"use client";
import {
  useGlobalChat,
  useInfiniteCanvas,
  useInspiration,
} from "@/hooks/use-canvas";
import React, { useState, useEffect } from "react";
import TextSidebar from "./text-sidebar";
import { cn } from "@/lib/utils";
import ShapeRenderer from "./shapes";
import { RectanglePreview } from "./shapes/rectangle/preview";
import { FramePreview } from "./shapes/frame/preview";
import { EllipsePreview } from "./shapes/ellipse/preview";
import { NotePreview } from "./shapes/note/preview";
import { ArrowPreview } from "./shapes/arrow/preview";
import { LinePreview } from "./shapes/line/preview";
import { FreeDrawStrokePreview } from "./shapes/stroke/preview";
import { SelectionOverlay } from "./shapes/selection";
import InspirationSidebar from "./shapes/inspiration-sidebar";
import ChatWindow from "./shapes/generatedui/chat";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import {
  loadStyleGuideStart,
  loadStyleGuideSuccess,
  loadStyleGuideFailure,
} from "@/redux/slice/style-guide";
import { useTokenInjection } from "@/hooks/use-token-injection";
import { setTranslate } from "@/redux/slice/viewport";
import Minimap from "./minimap";
import { useSearchParams } from "next/navigation";
import { Shape } from "@/redux/slice/shapes";
import { calculateArrowHead } from "@/lib/shape-utils";

const InfiniteCanvas = () => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project") || "";

  // Broadcast design token updates to all generated-UI iframes
  useTokenInjection();

  const {
    viewport,
    shapes,
    currentTool,
    selectedShapes,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    attachCanvasRef,
    getDraftShape,
    getFreeDrawPoints,
    isSidebarOpen,
    hasSelectedText,
    connectorDrag,
    laserPoints,
    laserCursor,
  } = useInfiniteCanvas();

  const { isInspirationOpen, closeInspiration, toggleInspiration } =
    useInspiration();

  const {
    isChatOpen,
    setIsChatOpen,
    activeGeneratedUIId,
    closeChat,
    toggleChat,
    generateWorkflow,
    exportDesign,
  } = useGlobalChat();

  useEffect(() => {
    if (!projectId) return;

    const loadStyleGuide = async () => {
      dispatch(loadStyleGuideStart());
      try {
        const res = await fetch(`/api/projects/${projectId}/style-guide`);
        if (res.ok) {
          const data = await res.json();
          dispatch(loadStyleGuideSuccess(data.styleGuide));
        } else {
          dispatch(loadStyleGuideFailure("Failed to load style guide"));
        }
      } catch (err) {
        dispatch(loadStyleGuideFailure("Failed to load style guide"));
      }
    };

    loadStyleGuide();
  }, [dispatch, projectId]);

  const draftShape = getDraftShape();
  const freeDrawPoints = getFreeDrawPoints();

  // Canvas element size for minimap
  const [canvasSize, setCanvasSize] = React.useState({ width: 1200, height: 800 });
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMinimapNavigate = React.useCallback(
    (worldX: number, worldY: number) => {
      // Center the viewport on the clicked world position
      dispatch(
        setTranslate({
          x: canvasSize.width / 2 - worldX * viewport.scale,
          y: canvasSize.height / 2 - worldY * viewport.scale,
        })
      );
    },
    [dispatch, viewport.scale, canvasSize]
  );

  const handleRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      attachCanvasRef(el);
      (canvasContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    },
    [attachCanvasRef]
  );

  return (
    <div className="relative flex h-screen w-screen overflow-hidden pt-16 bg-background">
      <TextSidebar isOpen={isSidebarOpen && hasSelectedText} />
      <InspirationSidebar
        isOpen={isInspirationOpen}
        onClose={closeInspiration}
      />

      {/* Center Canvas */}
      <div
        ref={handleRef}
        role="application"
        aria-label="Infinite drawing canvas"
        className={cn(
          "relative flex-1 h-full overflow-hidden select-none z-0 bg-background",
          {
            "cursor-grabbing": viewport.mode === "panning",
            "cursor-grab":
              viewport.mode === "shiftPanning" ||
              (currentTool === "pan" && viewport.mode === "idle"),
            "cursor-eraser":
              currentTool === "eraser" && viewport.mode === "idle",
            "cursor-crosshair":
              currentTool !== "select" &&
              currentTool !== "pan" &&
              currentTool !== "eraser" &&
              currentTool !== "laser" &&
              viewport.mode === "idle",
            "cursor-none": currentTool === "laser" && viewport.mode === "idle",
            "cursor-default":
              currentTool === "select" && viewport.mode === "idle",
          },
        )}
        style={{
          touchAction: "none",
          backgroundImage:
            "radial-gradient(circle, var(--canvas-grid) 1px, transparent 1px)",
          backgroundSize: `${20 * viewport.scale}px ${20 * viewport.scale}px`,
          backgroundPosition: `${viewport.translate.x}px ${viewport.translate.y}px`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
      >
        <div
          className="absolute origin-top-left pointer-events-none z-10"
          style={{
            transform: `translate3d(${viewport.translate.x}px, ${viewport.translate.y}px, 0) scale(${viewport.scale})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          {shapes.map((shape: Shape) => (
            <ShapeRenderer
              key={shape.id}
              shape={shape}
              toggleInspiration={toggleInspiration}
              toggleChat={toggleChat}
              generateWorkflow={generateWorkflow}
              exportDesign={exportDesign}
            />
          ))}
          {shapes.map((shape: Shape) => (
            <SelectionOverlay
              key={`selection-${shape.id}`}
              shape={shape}
              isSelected={!!selectedShapes[shape.id]}
            />
          ))}
          {draftShape && draftShape.type === "frame" && (
            <FramePreview
              startWorld={draftShape.startWorld}
              currentWorld={draftShape.currentWorld}
            />
          )}
          {draftShape && draftShape.type === "rect" && (
            <RectanglePreview
              startWorld={draftShape.startWorld}
              currentWorld={draftShape.currentWorld}
            />
          )}
          {draftShape && draftShape.type === "note" && (
            <NotePreview
              startWorld={draftShape.startWorld}
              currentWorld={draftShape.currentWorld}
            />
          )}
          {draftShape && draftShape.type === "ellipse" && (
            <EllipsePreview
              startWorld={draftShape.startWorld}
              currentWorld={draftShape.currentWorld}
            />
          )}
          {draftShape && draftShape.type === "arrow" && (
            <ArrowPreview
              startWorld={draftShape.startWorld}
              currentWorld={draftShape.currentWorld}
            />
          )}
          {draftShape && draftShape.type === "line" && (
            <LinePreview
              startWorld={draftShape.startWorld}
              currentWorld={draftShape.currentWorld}
            />
          )}
          {currentTool === "freedraw" && freeDrawPoints.length > 1 && (
            <FreeDrawStrokePreview points={freeDrawPoints} />
          )}
          {laserPoints && laserPoints.length > 1 && (
            <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none z-50">
              <defs>
                <filter
                  id="laser-glow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#laser-glow)">
                {laserPoints.slice(0, -1).map((p, idx) => {
                  const pNext = laserPoints[idx + 1];
                  const now = Date.now();
                  const avgTime = (p.time + pNext.time) / 2;
                  const age = now - avgTime;
                  const opacity = Math.max(0, 1 - age / 1000);
                  if (opacity <= 0) return null;
                  return (
                    <line
                      key={`laser-${idx}-${p.time}`}
                      x1={p.x}
                      y1={p.y}
                      x2={pNext.x}
                      y2={pNext.y}
                      stroke="#ff3b30"
                      strokeWidth={6 * opacity}
                      strokeLinecap="round"
                      opacity={opacity}
                    />
                  );
                })}
              </g>
            </svg>
          )}

          {draftShape && draftShape.type === "selection" && (
            <svg
              className="absolute pointer-events-none overflow-visible z-50"
              style={{
                left: Math.min(
                  draftShape.startWorld.x,
                  draftShape.currentWorld.x,
                ),
                top: Math.min(
                  draftShape.startWorld.y,
                  draftShape.currentWorld.y,
                ),
                width: Math.abs(
                  draftShape.currentWorld.x - draftShape.startWorld.x,
                ),
                height: Math.abs(
                  draftShape.currentWorld.y - draftShape.startWorld.y,
                ),
              }}
            >
              <rect
                x={0}
                y={0}
                width={Math.abs(
                  draftShape.currentWorld.x - draftShape.startWorld.x,
                )}
                height={Math.abs(
                  draftShape.currentWorld.y - draftShape.startWorld.y,
                )}
                fill="rgba(59, 130, 246, 0.15)"
                stroke="#3b82f6"
                strokeWidth={1.5}
                className="animate-marching-ants"
              />
            </svg>
          )}
          {connectorDrag && (
            <svg className="absolute overflow-visible pointer-events-none z-50">
              <line
                x1={connectorDrag.startPoint.x}
                y1={connectorDrag.startPoint.y}
                x2={connectorDrag.currentPoint.x}
                y2={connectorDrag.currentPoint.y}
                stroke="#db2800"
                strokeWidth={2}
                strokeLinecap="round"
                className="animate-connector-flow"
              />
              {(() => {
                const arrowHead = calculateArrowHead(
                  connectorDrag.startPoint.x,
                  connectorDrag.startPoint.y,
                  connectorDrag.currentPoint.x,
                  connectorDrag.currentPoint.y,
                  10,
                );
                return (
                  <polygon
                    points={`${connectorDrag.currentPoint.x},${connectorDrag.currentPoint.y} ${arrowHead.x1},${arrowHead.y1} ${arrowHead.x2},${arrowHead.y2}`}
                    fill="#db2800"
                  />
                );
              })()}
            </svg>
          )}
        </div>

        {currentTool === "laser" && laserCursor && (
          <div
            className="absolute pointer-events-none rounded-full bg-red-500 w-4 h-4 shadow-[0_0_12px_#ef4444] z-50 animate-pulse border border-white"
            style={{
              left: laserCursor.x - 8,
              top: laserCursor.y - 8,
            }}
          />
        )}
      </div>

      {/* Right Chat Sidebar */}
      {activeGeneratedUIId && isChatOpen && (
        <ChatWindow
          generatedUIId={activeGeneratedUIId}
          isOpen={isChatOpen}
          onClose={closeChat}
        />
      )}

      {/* Minimap */}
      <Minimap
        viewport={viewport}
        canvasSize={canvasSize}
        onNavigate={handleMinimapNavigate}
      />
    </div>
  );
};

export default InfiniteCanvas;
