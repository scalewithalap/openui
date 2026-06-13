"use client";
import React, { useCallback, useMemo, useRef } from "react";
import { useAppSelector } from "@/redux/store";
import type { Shape } from "@/redux/slice/shapes";
import { boundsFromPoints } from "@/lib/shape-utils";
import { cn } from "@/lib/utils";

const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 120;
const MINIMAP_PADDING = 12;

interface MinimapProps {
  viewport: {
    translate: { x: number; y: number };
    scale: number;
  };
  canvasSize: { width: number; height: number };
  onNavigate: (worldX: number, worldY: number) => void;
}

function getShapeBounds(
  shape: Shape,
): { x: number; y: number; w: number; h: number } | null {
  if ("x" in shape && "y" in shape && "w" in shape && "h" in shape) {
    return {
      x: shape.x as number,
      y: shape.y as number,
      w: shape.w as number,
      h: shape.h as number,
    };
  }
  if (
    "startX" in shape &&
    "startY" in shape &&
    "endX" in shape &&
    "endY" in shape
  ) {
    const sx = shape.startX as number;
    const sy = shape.startY as number;
    const ex = shape.endX as number;
    const ey = shape.endY as number;
    return {
      x: Math.min(sx, ex),
      y: Math.min(sy, ey),
      w: Math.abs(ex - sx),
      h: Math.abs(ey - sy),
    };
  }
  // M4 fix: Handle FreeDraw shapes
  if (shape.type === "freedraw" && shape.points.length > 0) {
    const { minX, minY, maxX, maxY } = boundsFromPoints(shape.points);
    return {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
    };
  }
  // Connectors derive position from connected shapes — skip in minimap
  return null;
}

const SHAPE_COLORS: Record<string, string> = {
  generatedui: "#db2800",
  frame: "#3b82f6",
  rect: "#8b5cf6",
  ellipse: "#14b8a6",
  note: "#f59e0b",
  text: "#6b7280",
  freedraw: "#ef4444",
  arrow: "#6b7280",
  line: "#6b7280",
  connector: "#6b7280",
};

export default function Minimap({
  viewport,
  canvasSize,
  onNavigate,
}: MinimapProps) {
  const minimapRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  const mouseMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const mouseUpRef = useRef<(() => void) | null>(null);

  React.useEffect(() => {
    return () => {
      if (mouseMoveRef.current) {
        window.removeEventListener("mousemove", mouseMoveRef.current);
      }
      if (mouseUpRef.current) {
        window.removeEventListener("mouseup", mouseUpRef.current);
      }
    };
  }, []);

  const shapesEntities = useAppSelector(
    (state) => state.shapes.shapes.entities,
  );
  const shapes = useMemo(
    () => Object.values(shapesEntities).filter((s): s is Shape => s != null),
    [shapesEntities],
  );

  // Compute world-space bounding box of all shapes
  const worldBounds = useMemo(() => {
    if (shapes.length === 0) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const shape of shapes) {
      const bounds = getShapeBounds(shape);
      if (!bounds) continue;
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.w);
      maxY = Math.max(maxY, bounds.y + bounds.h);
    }

    // If no shapes had bounds
    if (minX === Infinity) return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };

    // Add padding
    const padding = 200;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    };
  }, [shapes]);

  const worldWidth = worldBounds.maxX - worldBounds.minX;
  const worldHeight = worldBounds.maxY - worldBounds.minY;

  // Scale factor from world to minimap
  const scaleX = MINIMAP_WIDTH / worldWidth;
  const scaleY = MINIMAP_HEIGHT / worldHeight;
  const minimapScale = Math.min(scaleX, scaleY);

  // Convert world coords to minimap coords
  const toMinimap = useCallback(
    (wx: number, wy: number) => ({
      x: (wx - worldBounds.minX) * minimapScale,
      y: (wy - worldBounds.minY) * minimapScale,
    }),
    [worldBounds, minimapScale],
  );

  // Current viewport in world coords
  const viewportWorldX = -viewport.translate.x / viewport.scale;
  const viewportWorldY = -viewport.translate.y / viewport.scale;
  const viewportWorldW = canvasSize.width / viewport.scale;
  const viewportWorldH = canvasSize.height / viewport.scale;

  const viewportMinimap = toMinimap(viewportWorldX, viewportWorldY);
  const viewportMinimapW = viewportWorldW * minimapScale;
  const viewportMinimapH = viewportWorldH * minimapScale;

  // Handler for viewport indicator box dragging
  const handleViewportMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      const startClientX = e.clientX;
      const startClientY = e.clientY;

      // Calculate initial world center of the viewport
      const initialWorldCenterX =
        (canvasSize.width / 2 - viewport.translate.x) / viewport.scale;
      const initialWorldCenterY =
        (canvasSize.height / 2 - viewport.translate.y) / viewport.scale;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startClientX;
        const deltaY = moveEvent.clientY - startClientY;

        const deltaWorldX = deltaX / minimapScale;
        const deltaWorldY = deltaY / minimapScale;

        onNavigate(
          initialWorldCenterX + deltaWorldX,
          initialWorldCenterY + deltaWorldY,
        );
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        mouseMoveRef.current = null;
        mouseUpRef.current = null;
      };

      mouseMoveRef.current = handleMouseMove;
      mouseUpRef.current = handleMouseUp;

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [viewport, canvasSize, minimapScale, onNavigate],
  );

  // Handler for clicking and dragging the minimap background
  const handleContainerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;

      const rect = minimapRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Click position relative to the SVG canvas (subtracting padding)
      const clickX = e.clientX - rect.left - MINIMAP_PADDING;
      const clickY = e.clientY - rect.top - MINIMAP_PADDING;

      // Only navigate if click is within range
      if (
        clickX < -MINIMAP_PADDING ||
        clickX > MINIMAP_WIDTH + MINIMAP_PADDING ||
        clickY < -MINIMAP_PADDING ||
        clickY > MINIMAP_HEIGHT + MINIMAP_PADDING
      ) {
        return;
      }

      // Clamp coordinates to SVG bounds
      const svgX = Math.max(0, Math.min(MINIMAP_WIDTH, clickX));
      const svgY = Math.max(0, Math.min(MINIMAP_HEIGHT, clickY));

      const worldX = svgX / minimapScale + worldBounds.minX;
      const worldY = svgY / minimapScale + worldBounds.minY;

      // Center viewport on the clicked world position immediately
      onNavigate(worldX, worldY);

      // Start drag from the click coordinate as the initial viewport center
      const startClientX = e.clientX;
      const startClientY = e.clientY;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startClientX;
        const deltaY = moveEvent.clientY - startClientY;

        const deltaWorldX = deltaX / minimapScale;
        const deltaWorldY = deltaY / minimapScale;

        onNavigate(worldX + deltaWorldX, worldY + deltaWorldY);
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        mouseMoveRef.current = null;
        mouseUpRef.current = null;
      };

      mouseMoveRef.current = handleMouseMove;
      mouseUpRef.current = handleMouseUp;

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [minimapScale, worldBounds, onNavigate],
  );

  if (shapes.length === 0) return null;

  return (
    <div
      ref={minimapRef}
      className={cn(
        "fixed bottom-24 right-4 rounded-2xl border border-border/80 dark:border-white/10 bg-card/95 dark:bg-card/90 shadow-2xl shadow-black/10 dark:shadow-black/30 backdrop-blur-md cursor-pointer transition-all duration-300 overflow-hidden z-50",
        isHovered ? "scale-100 opacity-100" : "scale-95 opacity-90",
      )}
      style={{
        width: MINIMAP_WIDTH + MINIMAP_PADDING * 2,
        height: MINIMAP_HEIGHT + MINIMAP_PADDING * 2,
      }}
      onMouseDown={handleContainerMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Minimap — click or drag to navigate"
    >
      {/* Label */}
      <div className="absolute top-1.5 left-2.5 text-[8px] font-bold uppercase tracking-wider text-muted-foreground/50 select-none pointer-events-none">
        Map
      </div>

      {/* Shapes */}
      <svg
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        className="absolute"
        style={{ left: MINIMAP_PADDING, top: MINIMAP_PADDING }}
      >
        {shapes.map((shape) => {
          const bounds = getShapeBounds(shape);
          if (!bounds) return null;
          const pos = toMinimap(bounds.x, bounds.y);
          const w = bounds.w * minimapScale;
          const h = bounds.h * minimapScale;
          const color = SHAPE_COLORS[shape.type] || "#6b7280";
          return (
            <rect
              key={shape.id}
              x={pos.x}
              y={pos.y}
              width={Math.max(w, 2)}
              height={Math.max(h, 2)}
              fill={color}
              opacity={0.6}
              rx={1}
            />
          );
        })}

        {/* Viewport indicator */}
        <rect
          x={viewportMinimap.x}
          y={viewportMinimap.y}
          width={viewportMinimapW}
          height={viewportMinimapH}
          fill="rgba(59, 130, 246, 0.12)"
          stroke="#3b82f6"
          strokeWidth={1.5}
          rx={2}
          className="cursor-grab active:cursor-grabbing"
          onMouseDown={handleViewportMouseDown}
        />
      </svg>
    </div>
  );
}
