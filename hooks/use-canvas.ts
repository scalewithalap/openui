"use client";
import {
  downloadBlob,
  exportGeneratedUIAsPNG,
  generateFrameSnapshot,
  isShapeInsideFrame,
} from "@/lib/frame-snapshot";
import { getTextWidth } from "@/lib/font-loader";
import {
  getShapeRect,
  getShapeCenter,
  getBestConnectionPoints,
  boundsFromPoints,
} from "@/lib/shape-utils";
import { useGenerateWorkflowMutation } from "@/redux/api/generation";
import { polylineBox } from "@/lib/utils";
import {
  addErrorMessage,
  addUserMessage,
  clearChat,
  finishStreamingResponse,
  initializeChat,
  startStreamingResponse,
  updateStreamingContent,
} from "@/redux/slice/chat";
import {
  FrameShape,
  Shape,
  Tool,
  addArrow,
  addEllipse,
  addFrame,
  addNote,
  addConnector,
  addFreeDrawShape,
  addGeneratedUI,
  addLine,
  addRect,
  addText,
  clearSelection,
  removeShape,
  selectShape,
  setTool,
  updateShape,
  deleteSelected,
  selectAll,
  saveHistory,
  undo,
  redo,
  updateShapes,
} from "@/redux/slice/shapes";
import {
  Point,
  handToolDisable,
  handToolEnable,
  panEnd,
  panMove,
  panStart,
  restoreViewport,
  screenToWorld,
  wheelPan,
  wheelZoom,
  zoomToFit,
} from "@/redux/slice/viewport";
import { AppDispatch, useAppDispatch, useAppSelector } from "@/redux/store";
import { nanoid } from "@reduxjs/toolkit";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { parseSSEStream } from "@/lib/stream-utils";

interface TouchPointer {
  id: number;
  p: Point;
}
const RAF_INTERVAL_MS = 8;
interface DraftShape {
  type: "frame" | "rect" | "ellipse" | "note" | "arrow" | "line" | "selection";
  startWorld: Point;
  currentWorld: Point;
}

const isEditable = (el: Element | null): boolean => {
  if (!el) return false;
  const tagName = el.tagName.toUpperCase();
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    el.hasAttribute("contenteditable") ||
    el.closest("[contenteditable]") !== null
  );
};

const isInteractiveElement = (el: HTMLElement | null): boolean => {
  if (!el) return false;

  // Ignore events from dialogs, menus, or portalled elements (like popovers and select dropdowns)
  if (
    el.closest('[role="dialog"]') ||
    el.closest("[data-radix-portal]") ||
    el.closest('[role="menu"]')
  ) {
    return true;
  }

  const checkInteractive = (element: HTMLElement): boolean => {
    const tagName = element.tagName.toUpperCase();
    if (
      tagName === "BUTTON" ||
      tagName === "INPUT" ||
      tagName === "TEXTAREA" ||
      tagName === "SELECT" ||
      tagName === "OPTION" ||
      tagName === "A" ||
      tagName === "LABEL" ||
      tagName === "SUMMARY" ||
      tagName === "DETAILS"
    ) {
      return true;
    }
    if (
      element.hasAttribute("contenteditable") ||
      element.getAttribute("role") === "button" ||
      element.getAttribute("role") === "link" ||
      element.getAttribute("role") === "tab" ||
      element.getAttribute("role") === "checkbox" ||
      element.getAttribute("role") === "slider"
    ) {
      return true;
    }
    if (
      element.classList.contains("pointer-events-auto") &&
      !element.classList.contains("generatedui-content") &&
      !element.classList.contains("note-element") &&
      !element.classList.contains("text-element")
    ) {
      return true;
    }
    return false;
  };

  let current: HTMLElement | null = el;
  while (current && current !== document.body) {
    if (checkInteractive(current)) return true;
    current = current.parentElement;
  }
  return false;
};


export const useInfiniteCanvas = () => {
  const dispatch = useDispatch<AppDispatch>();
  const viewport = useAppSelector((s) => s.viewport);

  const [connectorDrag, setConnectorDrag] = useState<{
    fromId: string;
    startPoint: Point;
    currentPoint: Point;
  } | null>(null);

  const entityState = useAppSelector((s) => s.shapes.shapes);

  const shapeList = React.useMemo(
    () =>
      entityState.ids
        .map((id: string) => entityState.entities[id])
        .filter((s: Shape | undefined): s is Shape => Boolean(s)),
    [entityState],
  );

  const currentTool = useAppSelector((s) => s.shapes.tool);
  const selectedShapes = useAppSelector((s) => s.shapes.selected);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [laserPoints, setLaserPoints] = useState<
    Array<{ x: number; y: number; time: number }>
  >([]);
  const [laserCursor, setLaserCursor] = useState<Point | null>(null);
  const shapesEntities = useAppSelector(
    (state) => state.shapes.shapes.entities,
  );

  const hasSelectedText = Object.keys(selectedShapes).some((id) => {
    const shape = shapesEntities[id];
    return shape?.type === "text";
  });

  useEffect(() => {
    if (hasSelectedText && !isSidebarOpen) {
      setIsSidebarOpen(true);
    } else if (!hasSelectedText) {
      setIsSidebarOpen(false);
    }
  }, [hasSelectedText, isSidebarOpen]);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLDivElement | null>(null);
  const touchMapRef = useRef<Map<number, TouchPointer>>(new Map());

  const draftShapeRef = useRef<DraftShape | null>(null);
  const freeDrawPointsRef = useRef<Point[]>([]);
  const isSpacePressed = useRef(false);
  const isDrawingRef = useRef(false);
  const isMovingRef = useRef(false);
  const moveStartRef = useRef<Point | null>(null);
  const hasSavedHistoryForMoveRef = useRef(false);

  const initialShapePositionsRef = useRef<
    Record<
      string,
      {
        x?: number;
        y?: number;
        points?: Point[];
        startX?: number;
        startY?: number;
        endX?: number;
        endY?: number;
      }
    >
  >({});

  const isErasingRef = useRef(false);
  const erasedShapesRef = useRef<Set<string>>(new Set());
  const isResizingRef = useRef(false);
  const resizeDataRef = useRef<{
    shapeId: string;
    corner: string;
    initialBounds: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
    startPoint: { x: number; y: number };
    initialFontSize?: number;
  } | null>(null);

  const lastFreehandFrameRef = useRef(0);
  const freehandRafRef = useRef<number | null>(null);
  const panRafRef = useRef<number | null>(null);
  const pendingPanPointRef = useRef<Point | null>(null);

  const [, force] = useState(0);
  const requestRender = (): void => {
    force((n) => (n + 1) | 0);
  };

  const localPointFromClient = (clientX: number, clientY: number): Point => {
    const el = canvasRef.current;
    if (!el) return { x: clientX, y: clientY };
    const r = el.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const blurActiveTextInput = () => {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === "INPUT") {
      (activeElement as HTMLInputElement).blur();
    }
  };

  type WithClientXY = {
    clientX: number;
    clientY: number;
  };
  const getLocalPointFromPtr = (e: WithClientXY): Point =>
    localPointFromClient(e.clientX, e.clientY);

  const getShapeAtPoint = (worldPoint: Point): Shape | null => {
    for (let i = shapeList.length - 1; i >= 0; i--) {
      const shape = shapeList[i];
      if (isPointInShape(worldPoint, shape)) {
        return shape;
      }
    }
    return null;
  };

  const isPointInShape = (point: Point, shape: Shape): boolean => {
    switch (shape.type) {
      case "frame":
      case "rect":
      case "ellipse":
      case "note":
      case "generatedui":
        return (
          point.x >= shape.x &&
          point.x <= shape.x + shape.w &&
          point.y >= shape.y &&
          point.y <= shape.y + shape.h
        );

      case "freedraw":
        const threshold = 5;
        for (let i = 0; i < shape.points.length - 1; i++) {
          const p1 = shape.points[i];
          const p2 = shape.points[i + 1];
          if (distanceToLineSegment(point, p1, p2) <= threshold) {
            return true;
          }
        }
        return false;
      case "arrow":
      case "line":
        const lineThreshold = 8;
        return (
          distanceToLineSegment(
            point,
            { x: shape.startX, y: shape.startY },
            { x: shape.endX, y: shape.endY },
          ) <= lineThreshold
        );
      case "connector": {
        const fromShape = entityState.entities[shape.fromId];
        const toShape = entityState.entities[shape.toId];
        if (!fromShape || !toShape) return false;
        const rectA = getShapeRect(fromShape);
        const rectB = getShapeRect(toShape);
        const { start, end } = getBestConnectionPoints(rectA, rectB);
        const connectorThreshold = 8;
        return distanceToLineSegment(point, start, end) <= connectorThreshold;
      }
      case "text":
        const textWidth = Math.max(
          shape.text.length * (shape.fontSize * 0.6),
          100,
        );
        const textHeight = shape.fontSize * 1.2;
        const padding = 8;
        return (
          point.x >= shape.x - 2 &&
          point.x <= shape.x + textWidth + padding + 2 &&
          point.y >= shape.y - 2 &&
          point.y <= shape.y + textHeight + padding + 2
        );
      default:
        return false;
    }
  };
  const distanceToLineSegment = (
    point: Point,
    lineStart: Point,
    lineEnd: Point,
  ): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const schedulePanMove = (p: Point) => {
    pendingPanPointRef.current = p;
    if (panRafRef.current != null) return;
    panRafRef.current = window.requestAnimationFrame(() => {
      panRafRef.current = null;
      const next = pendingPanPointRef.current;
      if (next) dispatch(panMove(next));
    });
  };

  const freehandTick = (): void => {
    const now = performance.now();
    if (now - lastFreehandFrameRef.current >= RAF_INTERVAL_MS) {
      if (freeDrawPointsRef.current.length > 0) requestRender();
      lastFreehandFrameRef.current = now;
    }
    if (isDrawingRef.current) {
      freehandRafRef.current = window.requestAnimationFrame(freehandTick);
    }
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const originScreen = localPointFromClient(e.clientX, e.clientY);
    if (e.ctrlKey || e.metaKey) {
      dispatch(wheelZoom({ deltaY: e.deltaY, originScreen }));
    } else {
      const dx = e.shiftKey ? e.deltaY : e.deltaX;
      const dy = e.shiftKey ? 0 : e.deltaY;
      dispatch(wheelPan({ dx: -dx, dy: -dy }));
    }
  };

  const finalizeDrawingIfAny = (e?: React.PointerEvent): void => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (freehandRafRef.current) {
      window.cancelAnimationFrame(freehandRafRef.current);
      freehandRafRef.current = null;
    }

    const draft = draftShapeRef.current;
    if (draft) {
      const x = Math.min(draft.startWorld.x, draft.currentWorld.x);
      const y = Math.min(draft.startWorld.y, draft.currentWorld.y);
      const w = Math.abs(draft.currentWorld.x - draft.startWorld.x);
      const h = Math.abs(draft.currentWorld.y - draft.startWorld.y);

      if (draft.type === "selection") {
        if (w > 2 && h > 2) {
          const selectedIds: string[] = [];
          shapeList.forEach((shape: Shape) => {
            if (shape.type === "connector") return;
            const rect = getShapeRect(shape);
            const shapeMinX = rect.x;
            const shapeMaxX = rect.x + rect.w;
            const shapeMinY = rect.y;
            const shapeMaxY = rect.y + rect.h;

            const overlaps =
              shapeMinX <= x + w &&
              shapeMaxX >= x &&
              shapeMinY <= y + h &&
              shapeMaxY >= y;

            if (overlaps) {
              selectedIds.push(shape.id);
            }
          });

          const isShiftKey = e ? e.shiftKey : false;
          if (!isShiftKey) {
            dispatch(clearSelection());
          }
          selectedIds.forEach((id) => dispatch(selectShape(id)));
        }
      } else if (draft.type === "note") {
        const finalW = w > 5 ? w : 160;
        const finalH = h > 5 ? h : 160;
        const finalX = w > 5 ? x : x - finalW / 2;
        const finalY = h > 5 ? y : y - finalH / 2;
        dispatch(addNote({ x: finalX, y: finalY, w: finalW, h: finalH }));
        dispatch(setTool("select"));
      } else if (w > 1 && h > 1) {
        if (draft.type === "frame") {
          dispatch(addFrame({ x, y, w, h }));
        } else if (draft.type === "rect") {
          dispatch(addRect({ x, y, w, h }));
        } else if (draft.type === "ellipse") {
          dispatch(addEllipse({ x, y, w, h }));
        } else if (draft.type === "arrow") {
          dispatch(
            addArrow({
              startX: draft.startWorld.x,
              startY: draft.startWorld.y,
              endX: draft.currentWorld.x,
              endY: draft.currentWorld.y,
            }),
          );
        } else if (draft.type === "line") {
          dispatch(
            addLine({
              startX: draft.startWorld.x,
              startY: draft.startWorld.y,
              endX: draft.currentWorld.x,
              endY: draft.currentWorld.y,
            }),
          );
        }
      }
      draftShapeRef.current = null;
    } else if (currentTool === "freedraw") {
      const pts = freeDrawPointsRef.current;
      if (pts.length > 1) dispatch(addFreeDrawShape({ points: pts }));
      freeDrawPointsRef.current = [];
    }
    requestRender();
  };

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement;
    const isInteractive = isInteractiveElement(target);

    if (isInteractive) {
      return;
    }

    e.preventDefault();

    const local = getLocalPointFromPtr(e.nativeEvent);
    const world = screenToWorld(local, viewport.translate, viewport.scale);

    if (touchMapRef.current.size <= 1) {
      canvasRef.current?.setPointerCapture?.(e.pointerId);
      const isPanButton = e.button === 1 || e.button === 2;
      const panByShift = isSpacePressed.current && e.button === 0;
      const panByTool = currentTool === "pan" && e.button === 0;

      if (isPanButton || panByShift || panByTool) {
        dispatch(panStart({ screen: local, mode: "panning" }));
        return;
      }

      if (e.button === 0) {
        if (currentTool === "select") {
          const hitShape = getShapeAtPoint(world);
          if (hitShape) {
            const isAlreadySelected = selectedShapes[hitShape.id];
            if (!isAlreadySelected) {
              if (!e.shiftKey) dispatch(clearSelection());
              dispatch(selectShape(hitShape.id));
            }
            isMovingRef.current = true;
            moveStartRef.current = world;
            hasSavedHistoryForMoveRef.current = false;

            initialShapePositionsRef.current = {};
            Object.keys(selectedShapes).forEach((id) => {
              const shape = entityState.entities[id];
              if (shape) {
                if (
                  shape.type === "frame" ||
                  shape.type === "rect" ||
                  shape.type === "ellipse" ||
                  shape.type === "note" ||
                  shape.type === "generatedui"
                ) {
                  initialShapePositionsRef.current[id] = {
                    x: shape.x,
                    y: shape.y,
                  };
                } else if (shape.type === "freedraw") {
                  initialShapePositionsRef.current[id] = {
                    points: [...shape.points],
                  };
                } else if (shape.type === "arrow" || shape.type === "line") {
                  initialShapePositionsRef.current[id] = {
                    startX: shape.startX,
                    startY: shape.startY,
                    endX: shape.endX,
                    endY: shape.endY,
                  };
                } else if (shape.type === "text") {
                  initialShapePositionsRef.current[id] = {
                    x: shape.x,
                    y: shape.y,
                  };
                }
              }
            });

            if (
              hitShape.type === "frame" ||
              hitShape.type === "rect" ||
              hitShape.type === "ellipse" ||
              hitShape.type === "note" ||
              hitShape.type === "generatedui"
            ) {
              initialShapePositionsRef.current[hitShape.id] = {
                x: hitShape.x,
                y: hitShape.y,
              };
            } else if (hitShape.type === "freedraw") {
              initialShapePositionsRef.current[hitShape.id] = {
                points: [...hitShape.points],
              };
            } else if (hitShape.type === "arrow" || hitShape.type === "line") {
              initialShapePositionsRef.current[hitShape.id] = {
                startX: hitShape.startX,
                startY: hitShape.startY,
                endX: hitShape.endX,
                endY: hitShape.endY,
              };
            } else if (hitShape.type === "text") {
              initialShapePositionsRef.current[hitShape.id] = {
                x: hitShape.x,
                y: hitShape.y,
              };
            }
          } else {
            // Clicked on empty space - clear selection and blur any active text inputs
            if (!e.shiftKey) {
              dispatch(clearSelection());
              blurActiveTextInput();
            }
            // Start click & drag selection box
            isDrawingRef.current = true;
            draftShapeRef.current = {
              type: "selection",
              startWorld: world,
              currentWorld: world,
            };
            requestRender();
          }
        } else if (currentTool === "eraser") {
          isErasingRef.current = true;
          erasedShapesRef.current.clear();
          const hitShape = getShapeAtPoint(world);
          if (hitShape && !hitShape.locked) {
            dispatch(removeShape(hitShape.id));
            erasedShapesRef.current.add(hitShape.id);
          } else {
            blurActiveTextInput();
          }
        } else if (currentTool === "text") {
          dispatch(addText({ x: world.x, y: world.y }));
          dispatch(setTool("select"));
        } else if (currentTool === "connector") {
          const startShape = getShapeAtPoint(world);
          if (startShape) {
            isDrawingRef.current = true;
            const startCenter = getShapeCenter(startShape);
            setConnectorDrag({
              fromId: startShape.id,
              startPoint: startCenter,
              currentPoint: world,
            });
            requestRender();
          }
        } else if (currentTool === "laser") {
          isDrawingRef.current = true;
          setLaserPoints([{ x: world.x, y: world.y, time: Date.now() }]);
          setLaserCursor(local);
          requestRender();
        } else {
          isDrawingRef.current = true;
          if (
            currentTool === "frame" ||
            currentTool === "rect" ||
            currentTool === "ellipse" ||
            currentTool === "note" ||
            currentTool === "arrow" ||
            currentTool === "line"
          ) {
            draftShapeRef.current = {
              type: currentTool,
              startWorld: world,
              currentWorld: world,
            };
            requestRender();
          } else if (currentTool === "freedraw") {
            freeDrawPointsRef.current = [world];
            lastFreehandFrameRef.current = performance.now();
            freehandRafRef.current = window.requestAnimationFrame(freehandTick);
            requestRender();
          }
        }
      }
    }
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const local = getLocalPointFromPtr(e.nativeEvent);
    const world = screenToWorld(local, viewport.translate, viewport.scale);

    if (currentTool === "laser") {
      setLaserCursor(local);
      if (isDrawingRef.current) {
        setLaserPoints((prev) => [
          ...prev,
          { x: world.x, y: world.y, time: Date.now() },
        ]);
        requestRender();
      }
    }

    if (viewport.mode === "panning" || viewport.mode === "shiftPanning") {
      schedulePanMove(local);
      return;
    }

    if (isErasingRef.current && currentTool === "eraser") {
      const hitShape = getShapeAtPoint(world);
      if (
        hitShape &&
        !erasedShapesRef.current.has(hitShape.id) &&
        !hitShape.locked
      ) {
        // Delete the shape if we haven't already deleted it in this drag
        dispatch(removeShape(hitShape.id));
        erasedShapesRef.current.add(hitShape.id);
      }
    }

    if (
      isMovingRef.current &&
      moveStartRef.current &&
      currentTool === "select"
    ) {
      const deltaX = world.x - moveStartRef.current.x;
      const deltaY = world.y - moveStartRef.current.y;

      if (
        !hasSavedHistoryForMoveRef.current &&
        (deltaX !== 0 || deltaY !== 0)
      ) {
        dispatch(saveHistory());
        hasSavedHistoryForMoveRef.current = true;
      }

      // Batch all shape position updates into a single dispatch (H5 fix)
      const patches: Array<{ id: string; patch: Partial<Shape> }> = [];

      Object.keys(initialShapePositionsRef.current).forEach((id) => {
        const initialPos = initialShapePositionsRef.current[id];
        const shape = entityState.entities[id];

        if (shape && initialPos && !shape.locked) {
          if (
            shape.type === "frame" ||
            shape.type === "rect" ||
            shape.type === "ellipse" ||
            shape.type === "note" ||
            shape.type === "text" ||
            shape.type === "generatedui"
          ) {
            if (
              typeof initialPos.x === "number" &&
              typeof initialPos.y === "number"
            ) {
              patches.push({
                id,
                patch: {
                  x: initialPos.x + deltaX,
                  y: initialPos.y + deltaY,
                },
              });
            }
          } else if (shape.type === "freedraw") {
            const initialPoints = initialPos.points;
            if (initialPoints) {
              const newPoints = initialPoints.map((point) => ({
                x: point.x + deltaX,
                y: point.y + deltaY,
              }));
              patches.push({
                id,
                patch: { points: newPoints },
              });
            }
          } else if (shape.type === "arrow" || shape.type === "line") {
            if (
              typeof initialPos.startX === "number" &&
              typeof initialPos.startY === "number" &&
              typeof initialPos.endX === "number" &&
              typeof initialPos.endY === "number"
            ) {
              patches.push({
                id,
                patch: {
                  startX: initialPos.startX + deltaX,
                  startY: initialPos.startY + deltaY,
                  endX: initialPos.endX + deltaX,
                  endY: initialPos.endY + deltaY,
                },
              });
            }
          }
        }
      });

      if (patches.length > 0) {
        dispatch(updateShapes(patches));
      }
    }

    if (isDrawingRef.current) {
      if (draftShapeRef.current) {
        draftShapeRef.current.currentWorld = world;
        requestRender();
      } else if (currentTool === "freedraw") {
        freeDrawPointsRef.current.push(world);
      } else if (currentTool === "connector" && connectorDrag) {
        setConnectorDrag((prev) =>
          prev ? { ...prev, currentPoint: world } : null,
        );
        requestRender();
      }
    }
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    canvasRef.current?.releasePointerCapture?.(e.pointerId);

    const local = getLocalPointFromPtr(e.nativeEvent);
    const world = screenToWorld(local, viewport.translate, viewport.scale);

    if (currentTool === "laser") {
      isDrawingRef.current = false;
    }

    if (viewport.mode === "panning" || viewport.mode === "shiftPanning") {
      dispatch(panEnd());
    }

    if (isMovingRef.current) {
      isMovingRef.current = false;
      moveStartRef.current = null;
      initialShapePositionsRef.current = {};
      hasSavedHistoryForMoveRef.current = false;
    }

    if (isErasingRef.current) {
      isErasingRef.current = false;
      erasedShapesRef.current.clear();
    }

    if (currentTool === "connector" && connectorDrag) {
      const endShape = getShapeAtPoint(world);
      if (endShape && endShape.id !== connectorDrag.fromId) {
        dispatch(
          addConnector({ fromId: connectorDrag.fromId, toId: endShape.id }),
        );
      }
      setConnectorDrag(null);
      isDrawingRef.current = false;
      dispatch(setTool("select"));
    } else {
      finalizeDrawingIfAny(e);
    }
  };

  const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = (e) => {
    onPointerUp(e);
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (isEditable(document.activeElement)) return;

    if (
      (e.code === "Space" ||
        e.code === "ShiftLeft" ||
        e.code === "ShiftRight") &&
      !e.repeat
    ) {
      e.preventDefault();
      isSpacePressed.current = true; // Keep the same ref name for consistency
      dispatch(handToolEnable());
    }

    if (e.code === "Delete" || e.code === "Backspace") {
      dispatch(deleteSelected());
    }

    if ((e.ctrlKey || e.metaKey) && e.code === "KeyA") {
      e.preventDefault();
      dispatch(selectAll());
    }

    if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ" && !e.shiftKey) {
      e.preventDefault();
      dispatch(undo());
    }

    if (
      (e.ctrlKey || e.metaKey) &&
      (e.code === "KeyY" || (e.shiftKey && e.code === "KeyZ"))
    ) {
      e.preventDefault();
      dispatch(redo());
    }

    if ((e.ctrlKey || e.metaKey) && e.code === "F1") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("open-help-legend"));
    }

    if ((e.ctrlKey || e.metaKey) && e.code === "KeyO") {
      e.preventDefault();
      fitToScreen();
    }

    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.code === "KeyV") {
        dispatch(setTool("select"));
      } else if (e.code === "KeyH") {
        dispatch(setTool("pan"));
      } else if (e.code === "KeyF") {
        dispatch(setTool("frame"));
      } else if (e.code === "KeyR") {
        dispatch(setTool("rect"));
      } else if (e.code === "KeyO") {
        dispatch(setTool("ellipse"));
      } else if (e.code === "KeyA") {
        dispatch(setTool("arrow"));
      } else if (e.code === "KeyL") {
        dispatch(setTool("line"));
      } else if (e.code === "KeyT") {
        dispatch(setTool("text"));
      } else if (e.code === "KeyP") {
        dispatch(setTool("freedraw"));
      }
    }
  };

  const onKeyUp = (e: KeyboardEvent): void => {
    if (
      e.code === "Space" ||
      e.code === "ShiftLeft" ||
      e.code === "ShiftRight"
    ) {
      if (!isEditable(document.activeElement)) {
        e.preventDefault();
      }
      isSpacePressed.current = false;
      dispatch(handToolDisable());
    }
  };

  const onKeyDownRef = useRef(onKeyDown);
  const onKeyUpRef = useRef(onKeyUp);

  useEffect(() => {
    onKeyDownRef.current = onKeyDown;
    onKeyUpRef.current = onKeyUp;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => onKeyDownRef.current(e);
    const handleKeyUp = (e: KeyboardEvent) => onKeyUpRef.current(e);

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      if (freehandRafRef.current)
        window.cancelAnimationFrame(freehandRafRef.current);
      if (panRafRef.current) window.cancelAnimationFrame(panRafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Laser fade: only run RAF loop when there are points to fade (H3 fix)
  const hasLaserPoints = laserPoints.length > 0;
  useEffect(() => {
    if (!hasLaserPoints) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      setLaserPoints((prev) => {
        if (prev.length === 0) return prev;
        const now = Date.now();
        const next = prev.filter((p) => now - p.time < 1000);
        return next.length === prev.length ? prev : next;
      });
      if (active) requestAnimationFrame(tick);
    };
    const animId = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, [hasLaserPoints]);

  const onWheelRef = useRef(onWheel);
  useEffect(() => {
    onWheelRef.current = onWheel;
  });

  useEffect(() => {
    const el = canvasEl;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      onWheelRef.current(e);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [canvasEl]);

  useEffect(() => {
    const handleBlur = () => {
      isSpacePressed.current = false;
      dispatch(handToolDisable());
    };
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, [dispatch]);

  useEffect(() => {
    if (viewport.initialized || !canvasEl) return;

    const el = canvasEl;
    const center = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width > 0 && height > 0) {
        const targetScale = 0.83;
        const boundsCenterX = 612; // 100 + 1024 / 2
        const boundsCenterY = 388; // 100 + 576 / 2

        const tx = width / 2 - boundsCenterX * targetScale;
        const ty = height / 2 - boundsCenterY * targetScale;

        dispatch(
          restoreViewport({
            scale: targetScale,
            translate: { x: tx, y: ty },
          }),
        );
      }
    };

    center();

    // If width/height was 0 (e.g., initial layout pass), use a ResizeObserver to catch when it gets its size
    if (el.clientWidth === 0 || el.clientHeight === 0) {
      const observer = new ResizeObserver(() => {
        center();
      });
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [viewport.initialized, canvasEl, dispatch]);

  useEffect(() => {
    const handleResizeStart = (e: CustomEvent) => {
      dispatch(saveHistory());
      const { shapeId, corner, bounds } = e.detail;
      const shape = entityState.entities[shapeId];
      isResizingRef.current = true;
      resizeDataRef.current = {
        shapeId,
        corner,
        initialBounds: bounds,
        startPoint: { x: e.detail.clientX || 0, y: e.detail.clientY || 0 },
        initialFontSize: shape?.type === "text" ? shape.fontSize : undefined,
      };
    };

    const handleResizeMove = (e: CustomEvent) => {
      if (!isResizingRef.current || !resizeDataRef.current) return;
      const { shapeId, corner, initialBounds } = resizeDataRef.current;
      const { clientX, clientY, shiftKey } = e.detail;

      const canvasEl = canvasRef.current;
      if (!canvasEl) return;

      const rect = canvasEl.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const world = screenToWorld(
        { x: localX, y: localY },
        viewport.translate,
        viewport.scale,
      );

      const shape = entityState.entities[shapeId];
      if (!shape) return;

      const newBounds = { ...initialBounds };
      let w = initialBounds.w;
      let h = initialBounds.h;

      switch (corner) {
        case "nw":
          w = initialBounds.w + (initialBounds.x - world.x);
          h = initialBounds.h + (initialBounds.y - world.y);
          break;
        case "ne":
          w = world.x - initialBounds.x;
          h = initialBounds.h + (initialBounds.y - world.y);
          break;
        case "sw":
          w = initialBounds.w + (initialBounds.x - world.x);
          h = world.y - initialBounds.y;
          break;
        case "se":
          w = world.x - initialBounds.x;
          h = world.y - initialBounds.y;
          break;
      }

      const aspectRatio = initialBounds.w / initialBounds.h;

      if (shiftKey && aspectRatio > 0) {
        const scaleX = w / initialBounds.w;
        const scaleY = h / initialBounds.h;
        const devX = Math.abs(scaleX - 1);
        const devY = Math.abs(scaleY - 1);

        let scale = 1;
        if (devX > devY) {
          scale = scaleX;
        } else {
          scale = scaleY;
        }

        w = initialBounds.w * scale;
        h = initialBounds.h * scale;
      }

      // Enforce minimum size of 10px and maintain aspect ratio if shiftKey is pressed
      if (w < 10) {
        w = 10;
        if (shiftKey && aspectRatio > 0) {
          h = w / aspectRatio;
        }
      }
      if (h < 10) {
        h = 10;
        if (shiftKey && aspectRatio > 0) {
          w = h * aspectRatio;
        }
      }

      // Calculate new x and y based on final width and height to keep the opposite corner fixed
      let x = initialBounds.x;
      let y = initialBounds.y;

      switch (corner) {
        case "nw":
          x = initialBounds.x + initialBounds.w - w;
          y = initialBounds.y + initialBounds.h - h;
          break;
        case "ne":
          x = initialBounds.x;
          y = initialBounds.y + initialBounds.h - h;
          break;
        case "sw":
          x = initialBounds.x + initialBounds.w - w;
          y = initialBounds.y;
          break;
        case "se":
          x = initialBounds.x;
          y = initialBounds.y;
          break;
      }

      newBounds.x = x;
      newBounds.y = y;
      newBounds.w = w;
      newBounds.h = h;

      if (
        shape.type === "frame" ||
        shape.type === "rect" ||
        shape.type === "ellipse" ||
        shape.type === "note"
      ) {
        dispatch(
          updateShape({
            id: shapeId,
            patch: {
              x: newBounds.x,
              y: newBounds.y,
              w: newBounds.w,
              h: newBounds.h,
            },
          }),
        );
      } else if (
        shape.type === "text" &&
        resizeDataRef.current?.initialFontSize
      ) {
        const initialFontSize = resizeDataRef.current.initialFontSize;
        const scaleX = newBounds.w / initialBounds.w;
        const scaleY = newBounds.h / initialBounds.h;
        const scale = (scaleX + scaleY) / 2;
        const newFontSize = Math.max(8, Math.round(initialFontSize * scale));
        dispatch(
          updateShape({
            id: shapeId,
            patch: {
              x: newBounds.x,
              y: newBounds.y,
              fontSize: newFontSize,
            },
          }),
        );
      } else if (shape.type === "freedraw") {
        const xs = shape.points.map((p: { x: number; y: number }) => p.x);
        const ys = shape.points.map((p: { x: number; y: number }) => p.y);

        const actualMinX = Math.min(...xs);
        const actualMaxX = Math.max(...xs);
        const actualMinY = Math.min(...ys);
        const actualMaxY = Math.max(...ys);

        const actualWidth = actualMaxX - actualMinX;
        const actualHeight = actualMaxY - actualMinY;

        const newActualX = newBounds.x + 5; // Remove padding
        const newActualY = newBounds.y + 5;
        const newActualWidth = Math.max(10, newBounds.w - 10); // Minimum size and remove padding
        const newActualHeight = Math.max(10, newBounds.h - 10);

        const scaleX = actualWidth > 0 ? newActualWidth / actualWidth : 1;
        const scaleY = actualHeight > 0 ? newActualHeight / actualHeight : 1;

        const scaledPoints = shape.points.map(
          (point: { x: number; y: number }) => ({
            x: newActualX + (point.x - actualMinX) * scaleX,
            y: newActualY + (point.y - actualMinY) * scaleY,
          }),
        );

        dispatch(
          updateShape({
            id: shapeId,
            patch: {
              points: scaledPoints,
            },
          }),
        );
      } else if (shape.type === "line" || shape.type === "arrow") {
        const actualMinX = Math.min(shape.startX, shape.endX);
        const actualMaxX = Math.max(shape.startX, shape.endX);
        const actualMinY = Math.min(shape.startY, shape.endY);
        const actualMaxY = Math.max(shape.startY, shape.endY);

        const actualWidth = actualMaxX - actualMinX;
        const actualHeight = actualMaxY - actualMinY;

        const newActualX = newBounds.x + 5;
        const newActualY = newBounds.y + 5;
        const newActualWidth = Math.max(10, newBounds.w - 10);
        const newActualHeight = Math.max(10, newBounds.h - 10);

        let newStartX, newStartY, newEndX, newEndY;
        if (actualWidth === 0) {
          newStartX = newActualX + newActualWidth / 2;
          newEndX = newActualX + newActualWidth / 2;
          newStartY =
            shape.startY < shape.endY
              ? newActualY
              : newActualY + newActualHeight;
          newEndY =
            shape.startY < shape.endY
              ? newActualY + newActualHeight
              : newActualY;
        } else if (actualHeight === 0) {
          newStartY = newActualY + newActualHeight / 2;
          newEndY = newActualY + newActualHeight / 2;
          newStartX =
            shape.startX < shape.endX
              ? newActualX
              : newActualX + newActualWidth;
          newEndX =
            shape.startX < shape.endX
              ? newActualX + newActualWidth
              : newActualX;
        } else {
          const scaleX = newActualWidth / actualWidth;
          const scaleY = newActualHeight / actualHeight;

          newStartX = newActualX + (shape.startX - actualMinX) * scaleX;
          newStartY = newActualY + (shape.startY - actualMinY) * scaleY;
          newEndX = newActualX + (shape.endX - actualMinX) * scaleX;
          newEndY = newActualY + (shape.endY - actualMinY) * scaleY;
        }

        dispatch(
          updateShape({
            id: shapeId,
            patch: {
              startX: newStartX,
              startY: newStartY,
              endX: newEndX,
              endY: newEndY,
            },
          }),
        );
      }
    };

    const handleResizeEnd = () => {
      isResizingRef.current = false;
      resizeDataRef.current = null;
    };

    window.addEventListener(
      "shape-resize-start",
      handleResizeStart as EventListener,
    );

    window.addEventListener(
      "shape-resize-move",
      handleResizeMove as EventListener,
    );

    window.addEventListener(
      "shape-resize-end",
      handleResizeEnd as EventListener,
    );

    return () => {
      window.removeEventListener(
        "shape-resize-start",
        handleResizeStart as EventListener,
      );
      window.removeEventListener(
        "shape-resize-move",
        handleResizeMove as EventListener,
      );
      window.removeEventListener(
        "shape-resize-end",
        handleResizeEnd as EventListener,
      );
    };
  }, [dispatch, entityState.entities, viewport.translate, viewport.scale]);

  const fitToScreen = (): void => {
    const selectedIds = Object.keys(selectedShapes);
    const shapesToFit =
      selectedIds.length > 0
        ? shapeList.filter((s: Shape) => selectedShapes[s.id])
        : shapeList;

    if (shapesToFit.length === 0) {
      const width = canvasRef.current?.clientWidth || window.innerWidth;
      const height = canvasRef.current?.clientHeight || window.innerHeight;
      const targetScale = 0.8;
      const boundsCenterX = 612;
      const boundsCenterY = 388;
      const tx = width / 2 - boundsCenterX * targetScale;
      const ty = height / 2 - boundsCenterY * targetScale;

      dispatch(
        restoreViewport({
          scale: targetScale,
          translate: { x: tx, y: ty },
        }),
      );
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    shapesToFit.forEach((shape: Shape) => {
      const rect = getShapeRect(shape);
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.w);
      maxY = Math.max(maxY, rect.y + rect.h);
    });

    const bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    const width = canvasRef.current?.clientWidth || window.innerWidth;
    const height = canvasRef.current?.clientHeight || window.innerHeight;

    dispatch(
      zoomToFit({
        bounds,
        viewportPx: { width, height },
        padding: 60,
      }),
    );
  };

  const fitToScreenRef = useRef(fitToScreen);
  useEffect(() => {
    fitToScreenRef.current = fitToScreen;
  });

  useEffect(() => {
    const handleFit = () => fitToScreenRef.current();
    window.addEventListener("canvas-fit-to-screen", handleFit);
    return () => window.removeEventListener("canvas-fit-to-screen", handleFit);
  }, []);

  const attachCanvasRef = useCallback((ref: HTMLDivElement | null): void => {
    canvasRef.current = ref;
    setCanvasEl(ref);
  }, []);

  const selectTool = (tool: Tool): void => {
    dispatch(setTool(tool));
  };

  const getDraftShape = (): DraftShape | null => draftShapeRef.current;
  const getFreeDrawPoints = (): ReadonlyArray<Point> =>
    freeDrawPointsRef.current;

  return {
    viewport,
    shapes: shapeList,
    currentTool,
    selectedShapes,

    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,

    attachCanvasRef,
    selectTool,
    getDraftShape,
    getFreeDrawPoints,
    isSidebarOpen,
    hasSelectedText,
    setIsSidebarOpen,
    connectorDrag,
    laserPoints,
    laserCursor,
    fitToScreen,
  };
};

export const useFrame = (shape: FrameShape) => {
  const dispatch = useAppDispatch();
  const [isGenerating, setIsGenerating] = useState(false);

  const shapesEntities = useAppSelector(
    (state) => state.shapes.shapes.entities,
  );
  const allShapes = React.useMemo(() => {
    return Object.values(shapesEntities || {}).filter(
      (shape): shape is Shape => shape !== undefined,
    );
  }, [shapesEntities]);

  const handleGenerateDesign = async (
    prompt: string,
    deviceType: string,
    includeDrawing: boolean,
    selectedImageIds: string[],
    variantCount: number = 1,
    creativeRange: number = 1.0,
  ) => {
    try {
      setIsGenerating(true);

      const existingVariants = allShapes
        .filter(
          (s) => s.type === "generatedui" && (s as any).sourceFrameId === shape.id,
        )
        .sort((a, b) => (a as any).x - (b as any).x);

      let targetW = shape.w;
      let targetH = shape.h;
      if (deviceType === "mobile") {
        targetW = 375;
        targetH = 812;
      } else if (deviceType === "tablet") {
        targetW = 768;
        targetH = 1024;
      } else if (deviceType === "web") {
        targetW = 1600;
        targetH = 900;
      }

      // Resize the frame container on the canvas if a preset device was chosen
      if (
        deviceType !== "custom" &&
        (targetW !== shape.w || targetH !== shape.h)
      ) {
        dispatch(
          updateShape({
            id: shape.id,
            patch: { w: targetW, h: targetH },
          }),
        );
      }

      let snapshot: Blob | null = null;
      if (includeDrawing) {
        const updatedFrame = { ...shape, w: targetW, h: targetH };
        snapshot = await generateFrameSnapshot(updatedFrame, allShapes);
        downloadBlob(
          snapshot,
          `OpenUI-frame-${shape.frameNumber}-snapshot.png`,
        );
      }

      // Remove the original frame and any sketch shapes inside it (first-time generation only)
      if (existingVariants.length === 0) {
        const shapesInsideFrame = allShapes.filter(
          (s) => s.id !== shape.id && s.type !== "generatedui" && isShapeInsideFrame(s, shape)
        );
        for (const s of shapesInsideFrame) {
          dispatch(removeShape(s.id));
        }
        dispatch(removeShape(shape.id));
      }

      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get("project");

      // Helper: generate a single variant
      const generateSingleVariant = async (variantIndex: number) => {
        const existingVariant = existingVariants[variantIndex];
        const generatedUIId = existingVariant ? existingVariant.id : nanoid();
        try {
          const formData = new FormData();
          if (snapshot) {
            formData.append(
              "image",
              snapshot,
              `OpenUI-frame-${shape.frameNumber}.png`,
            );
          }

          formData.append("frameNumber", shape.frameNumber.toString());
          formData.append("prompt", prompt);
          formData.append("deviceType", deviceType);
          formData.append("includeDrawing", includeDrawing.toString());
          formData.append("selectedImageIds", JSON.stringify(selectedImageIds));
          formData.append("temperature", creativeRange.toString());
          formData.append("variantIndex", variantIndex.toString());
          formData.append("variantCount", variantCount.toString());
          formData.append("streamId", generatedUIId);

          if (projectId) {
            formData.append("projectId", projectId);
          }

          // Position: place variants side by side starting at shape.x
          const variantSpacing = 30;
          const generatedUIPosition = {
            x: variantIndex === 0
              ? shape.x
              : shape.x + targetW + 50 + (targetW + variantSpacing) * (variantIndex - 1),
            y: shape.y,
            w: targetW,
            h: targetH,
          };

          if (existingVariant) {
            dispatch(
              updateShape({
                id: generatedUIId,
                patch: {
                  ...generatedUIPosition,
                  uiSpecData: null,
                  isGenerating: true,
                },
              }),
            );
          } else {
            dispatch(
              addGeneratedUI({
                ...generatedUIPosition,
                id: generatedUIId,
                uiSpecData: null,
                sourceFrameId: shape.id,
                isGenerating: true,
              }),
            );
          }

          const response = await fetch("/api/generate", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
            );
          }

          // Stream the response
          const reader = response.body?.getReader();
          let lastUpdateTime = 0;
          const UPDATE_THROTTLE_MS = 200;

          if (reader) {
            const finalMarkup = await parseSSEStream(reader, generatedUIId, (accumulated) => {
              const now = Date.now();
              if (now - lastUpdateTime >= UPDATE_THROTTLE_MS) {
                dispatch(
                  updateShape({
                    id: generatedUIId,
                    patch: { uiSpecData: accumulated },
                  }),
                );
                lastUpdateTime = now;
              }
            });

            dispatch(
              updateShape({
                id: generatedUIId,
                patch: { uiSpecData: finalMarkup, isGenerating: false },
              }),
            );
          } else {
            dispatch(
              updateShape({
                id: generatedUIId,
                patch: { isGenerating: false },
              }),
            );
          }
        } catch (err) {
          dispatch(
            updateShape({
              id: generatedUIId,
              patch: { isGenerating: false },
            }),
          );
          throw err;
        }
      };

      // Fire all variants in parallel
      const variantPromises = Array.from({ length: variantCount }, (_, i) =>
        generateSingleVariant(i),
      );

      const results = await Promise.allSettled(variantPromises);

      // Report any failures
      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0 && failures.length < variantCount) {
        toast.error(
          `${failures.length} of ${variantCount} variants failed to generate.`,
        );
      } else if (failures.length === variantCount) {
        const firstError = (failures[0] as PromiseRejectedResult).reason;
        throw firstError;
      }
    } catch (error) {
      toast.error(
        `Failed to generate UI design: ${error instanceof Error ? error.message : "Unknown error!"}`,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    handleGenerateDesign,
  };
};

export const useInspiration = () => {
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);

  const toggleInspiration = () => {
    setIsInspirationOpen(!isInspirationOpen);
  };

  const openInspiration = () => {
    setIsInspirationOpen(true);
  };

  const closeInspiration = () => {
    setIsInspirationOpen(false);
  };

  return {
    isInspirationOpen,
    toggleInspiration,
    openInspiration,
    closeInspiration,
  };
};

export const useWorkflowGeneration = () => {
  const dispatch = useAppDispatch();
  const [, { isLoading: isGeneratingWorkflow }] = useGenerateWorkflowMutation();

  const shapesEntities = useAppSelector(
    (state) => state.shapes.shapes.entities,
  );
  const allShapes = React.useMemo(() => {
    return Object.values(shapesEntities || {}).filter(
      (shape): shape is Shape => shape !== undefined,
    );
  }, [shapesEntities]);

  const generateWorkflow = async (generatedUIId: string) => {
    try {
      const currentShape = allShapes.find(
        (shape) => shape.id === generatedUIId,
      );

      if (!currentShape || currentShape.type !== "generatedui") {
        toast.error("Generated UI not found!");
        return;
      }
      if (!currentShape.uiSpecData) {
        toast.error("No design data to generate workflow from!");
        return;
      }
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get("project");

      if (!projectId) {
        toast.error("Project not found!");
        return;
      }

      const pageCount = 4;
      toast.loading("Generating workflow...", { id: "workflow-generation" });

      const baseX = currentShape.x + currentShape.w + 100;
      const spacing = Math.max(currentShape.w + 50, 450);

      const workflowPromises = Array.from({ length: pageCount }).map(
        async (_, index) => {
          try {
            const workflowId = nanoid();
            const workflowPosition = {
              x: baseX + index * spacing,
              y: currentShape.y,
              w: Math.max(400, currentShape.w), // At least 400px wide
              h: Math.max(300, currentShape.h), // At least 300px high
            };

            const response = await fetch("/api/generate/workflow", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                generatedUIId,
                currentHTML: currentShape.uiSpecData,
                projectId,
                pageIndex: index,
                streamId: workflowId,
              }),
            });

            if (!response.ok) {
              throw new Error(
                `Failed to generate page ${index + 1}: ${response.status}`,
              );
            }

            dispatch(
              addGeneratedUI({
                ...workflowPosition,
                id: workflowId,
                uiSpecData: null, // Start with null for live rendering
                sourceFrameId: currentShape.sourceFrameId,
                isWorkflowPage: true, // Mark as workflow page
              }),
            );

            const reader = response.body?.getReader();
            if (reader) {
              const finalHTML = await parseSSEStream(reader, workflowId, (accumulated) => {
                dispatch(
                  updateShape({
                    id: workflowId,
                    patch: { uiSpecData: accumulated },
                  }),
                );
              });

              dispatch(
                updateShape({
                  id: workflowId,
                  patch: { uiSpecData: finalHTML },
                }),
              );
            }
            return { pageIndex: index, success: true };
          } catch (error) {
            console.error(
              `Error generating workflow page ${index + 1}:`,
              error,
            );
            return { pageIndex: index, success: false, error };
          }
        },
      );

      const results = await Promise.all(workflowPromises);
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;
      if (successCount === 4) {
        toast.success("✨ All 4 workflow pages generated successfully!", {
          id: "workflow-generation",
        });
      } else if (successCount > 0) {
        toast.success(
          `✨ Generated ${successCount}/4 workflow pages successfully!`,
          { id: "workflow-generation" },
        );
        if (failureCount > 0) {
          toast.error(`⚠️ Failed to generate ${failureCount} pages!`);
        }
      } else {
        toast.error("❌ Failed to generate workflow pages!", {
          id: "workflow-generation",
        });
      }
    } catch (error) {
      console.error("Error generating workflow:", error);
      toast.error("❌ Error generating workflow pages!", {
        id: "workflow-generation",
      });
    }
  };
  return {
    generateWorkflow,
    isGeneratingWorkflow,
  };
};

// TODO: Add chat window
export const useGlobalChat = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeGeneratedUIId, setActiveGeneratedUIId] = useState<string | null>(
    null,
  );
  const { generateWorkflow } = useWorkflowGeneration();

  const exportDesign = async (
    generatedUIId: string,
    element: HTMLElement | null,
  ) => {
    if (!element) {
      console.warn("❌ No element to export for shape:", generatedUIId);
      toast.error("No design element found for export.");
      return;
    }

    try {
      const filename = `generated-ui-${generatedUIId.slice(0, 8)}.png`;
      console.log("✉️ Starting snapshot export:", { filename });

      await exportGeneratedUIAsPNG(element, filename);

      toast.success("Design exported successfully!");
    } catch (error) {
      console.error("❌ Failed to export GeneratedUI:", error);
      toast.error("Failed to export design. Please try again.");
    }
  };

  const openChat = (generatedUIId: string) => {
    setActiveGeneratedUIId(generatedUIId);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setActiveGeneratedUIId(null);
  };

  const toggleChat = (generatedUIId: string) => {
    if (isChatOpen && activeGeneratedUIId === generatedUIId) {
      closeChat();
    } else {
      openChat(generatedUIId);
    }
  };

  return {
    isChatOpen,
    setIsChatOpen,
    activeGeneratedUIId,
    setActiveGeneratedUIId,
    openChat,
    closeChat,
    toggleChat,
    generateWorkflow,
    exportDesign,
  };
};

export const useChatWindow = (
  generatedUIId: string | null,
  isOpen: boolean,
) => {
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const safeId = generatedUIId || "global-placeholder";
  const chatState = useAppSelector((state) => state.chat.chats[safeId]);
  const currentShape = useAppSelector(
    (state) => state.shapes.shapes.entities[safeId],
  );
  const allShapes = useAppSelector((state) => state.shapes.shapes.entities);

  const getSourceFrame = (): FrameShape | null => {
    if (!currentShape || currentShape.type !== "generatedui") {
      return null;
    }
    const sourceFrameId = currentShape.sourceFrameId;
    if (!sourceFrameId) {
      return null;
    }

    const sourceFrame = allShapes[sourceFrameId];
    if (!sourceFrame || sourceFrame.type !== "frame") {
      return null;
    }

    return sourceFrame as FrameShape;
  };

  useEffect(() => {
    if (isOpen) {
      dispatch(initializeChat(safeId));
    }
  }, [dispatch, safeId, isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatState?.messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || chatState?.isStreaming) return;

    const message = inputValue.trim();
    setInputValue("");

    try {
      dispatch(addUserMessage({ generatedUIId: safeId, content: message }));
      const responseId = `response-${Date.now()}`;
      dispatch(
        startStreamingResponse({
          generatedUIId: safeId,
          messageId: responseId,
        }),
      );

      // Set shape isGenerating flag to true
      dispatch(
        updateShape({
          id: safeId,
          patch: { isGenerating: true },
        }),
      );

      const isWorkflowPage =
        currentShape?.type === "generatedui" && currentShape.isWorkflowPage;

      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get("project");

      if (!projectId) {
        throw new Error("Project ID not found in URL");
      }

      const baseRequestData = {
        userMessage: message,
        generatedUIId: safeId,
        currentHTML:
          currentShape?.type === "generatedui" ? currentShape.uiSpecData : null,
        projectId: projectId, // Pass projectId in body
        streamId: safeId, // Pass streamId
      };

      let apiEndpoint = "/api/generate/redesign";
      let wireframeSnapshot: string | null = null;
      if (isWorkflowPage) {
        apiEndpoint = "/api/generate/workflow-redesign";
      } else {
        const sourceFrame = getSourceFrame();
        if (sourceFrame && sourceFrame.type === "frame") {
          try {
            const allShapesArray = Object.values(allShapes).filter(
              Boolean,
            ) as Shape[];

            const snapshot = await generateFrameSnapshot(
              sourceFrame,
              allShapesArray,
            );

            const arrayBuffer = await snapshot.arrayBuffer();
            const base64 = btoa(
              String.fromCharCode(...new Uint8Array(arrayBuffer)),
            );
            wireframeSnapshot = base64;
          } catch (error) {
            console.warn("Failed to capture source wireframe snapshot:", error);
          }
        } else {
          console.warn("Source frame for context not found or invalid!");
        }
      }

      const requestData = isWorkflowPage
        ? baseRequestData
        : { ...baseRequestData, wireframeSnapshot };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (reader) {
        const finalHTML = await parseSSEStream(reader, safeId, (accumulated) => {
          dispatch(
            updateStreamingContent({
              generatedUIId: safeId,
              messageId: responseId,
              content: "Regenerating your design...",
            }),
          );

          dispatch(
            updateShape({
              id: safeId,
              patch: { uiSpecData: accumulated },
            }),
          );
        });

        dispatch(
          updateShape({
            id: safeId,
            patch: { uiSpecData: finalHTML, isGenerating: false },
          }),
        );
      } else {
        dispatch(
          updateShape({
            id: safeId,
            patch: { isGenerating: false },
          }),
        );
      }
      dispatch(
        finishStreamingResponse({
          generatedUIId: safeId,
          messageId: responseId,
          finalContent: "Design regenerated successfully!",
        }),
      );
    } catch (error) {
      console.error("Chat error:", error);
      dispatch(
        updateShape({
          id: safeId,
          patch: { isGenerating: false },
        }),
      );
      dispatch(
        addErrorMessage({
          generatedUIId: safeId,
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      );
      toast.error("Failed to regenerate design! Please try again.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    dispatch(clearChat(safeId));
  };

  return {
    inputValue,
    setInputValue,
    scrollAreaRef,
    inputRef,
    handleSendMessage,
    handleKeyPress,
    handleClearChat,
    chatState,
  };
};
