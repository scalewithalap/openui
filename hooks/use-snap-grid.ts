"use client";
import { useCallback, useMemo, useState } from "react";
import { useAppSelector } from "@/redux/store";
import type { Shape } from "@/redux/slice/shapes";

export type GridSize = 20 | 40 | 60;

export interface AlignmentGuide {
  /** "h" = horizontal (y-axis), "v" = vertical (x-axis) */
  axis: "h" | "v";
  /** World-space pixel position of the guide line */
  position: number;
}

/**
 * Snaps a value to the nearest grid cell.
 */
function snapToGrid(value: number, gridSize: GridSize): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Returns a bounding box for any shape that has x, y, w, h.
 */
function getShapeBounds(shape: Shape): { x: number; y: number; w: number; h: number } | null {
  if ("x" in shape && "y" in shape && "w" in shape && "h" in shape) {
    return { x: shape.x as number, y: shape.y as number, w: shape.w as number, h: shape.h as number };
  }
  return null;
}

const SNAP_THRESHOLD = 6; // pixels

/**
 * Hook that provides grid snapping and alignment guide computation.
 *
 * Usage:
 * ```ts
 * const { snapEnabled, toggleSnap, gridSize, setGridSize, snapPosition, guides, clearGuides } = useSnapGrid();
 * // During drag:
 * const snapped = snapPosition(draggedShape, newX, newY);
 * // Render guides from `guides` state
 * ```
 */
export function useSnapGrid() {
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [gridSize, setGridSize] = useState<GridSize>(20);
  const [guides, setGuides] = useState<AlignmentGuide[]>([]);

  const shapesEntities = useAppSelector((state) => state.shapes.shapes.entities);
  const shapesIds = useAppSelector((state) => state.shapes.shapes.ids);

  const shapes = useMemo(
    () => (Object.values(shapesEntities) as (Shape | undefined)[]).filter(
      (s): s is Shape => s != null,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shapesIds, shapesEntities],
  );

  const toggleSnap = useCallback(() => {
    setSnapEnabled((prev) => !prev);
  }, []);

  const clearGuides = useCallback(() => {
    setGuides([]);
  }, []);

  /**
   * Given a shape being dragged and a proposed (x, y), returns the
   * snapped position and updates alignment guides.
   */
  const snapPosition = useCallback(
    (
      draggedShapeId: string,
      proposedX: number,
      proposedY: number,
      shapeW: number,
      shapeH: number
    ): { x: number; y: number } => {
      let finalX = proposedX;
      let finalY = proposedY;

      // 1. Grid snapping
      if (snapEnabled) {
        finalX = snapToGrid(proposedX, gridSize);
        finalY = snapToGrid(proposedY, gridSize);
      }

      // 2. Alignment guides against other shapes
      const newGuides: AlignmentGuide[] = [];

      const draggedCenterX = finalX + shapeW / 2;
      const draggedCenterY = finalY + shapeH / 2;
      const draggedRight = finalX + shapeW;
      const draggedBottom = finalY + shapeH;

      for (const otherShape of shapes) {
        if (otherShape.id === draggedShapeId) continue;
        const bounds = getShapeBounds(otherShape);
        if (!bounds) continue;

        const otherCenterX = bounds.x + bounds.w / 2;
        const otherCenterY = bounds.y + bounds.h / 2;
        const otherRight = bounds.x + bounds.w;
        const otherBottom = bounds.y + bounds.h;

        // Vertical alignment checks (x-axis)
        // Left edge to left edge
        if (Math.abs(finalX - bounds.x) < SNAP_THRESHOLD) {
          finalX = bounds.x;
          newGuides.push({ axis: "v", position: bounds.x });
        }
        // Right edge to right edge
        else if (Math.abs(draggedRight - otherRight) < SNAP_THRESHOLD) {
          finalX = otherRight - shapeW;
          newGuides.push({ axis: "v", position: otherRight });
        }
        // Center to center (x)
        else if (Math.abs(draggedCenterX - otherCenterX) < SNAP_THRESHOLD) {
          finalX = otherCenterX - shapeW / 2;
          newGuides.push({ axis: "v", position: otherCenterX });
        }
        // Left to right
        else if (Math.abs(finalX - otherRight) < SNAP_THRESHOLD) {
          finalX = otherRight;
          newGuides.push({ axis: "v", position: otherRight });
        }
        // Right to left
        else if (Math.abs(draggedRight - bounds.x) < SNAP_THRESHOLD) {
          finalX = bounds.x - shapeW;
          newGuides.push({ axis: "v", position: bounds.x });
        }

        // Horizontal alignment checks (y-axis)
        // Top edge to top edge
        if (Math.abs(finalY - bounds.y) < SNAP_THRESHOLD) {
          finalY = bounds.y;
          newGuides.push({ axis: "h", position: bounds.y });
        }
        // Bottom edge to bottom edge
        else if (Math.abs(draggedBottom - otherBottom) < SNAP_THRESHOLD) {
          finalY = otherBottom - shapeH;
          newGuides.push({ axis: "h", position: otherBottom });
        }
        // Center to center (y)
        else if (Math.abs(draggedCenterY - otherCenterY) < SNAP_THRESHOLD) {
          finalY = otherCenterY - shapeH / 2;
          newGuides.push({ axis: "h", position: otherCenterY });
        }
        // Top to bottom
        else if (Math.abs(finalY - otherBottom) < SNAP_THRESHOLD) {
          finalY = otherBottom;
          newGuides.push({ axis: "h", position: otherBottom });
        }
        // Bottom to top
        else if (Math.abs(draggedBottom - bounds.y) < SNAP_THRESHOLD) {
          finalY = bounds.y - shapeH;
          newGuides.push({ axis: "h", position: bounds.y });
        }
      }

      // De-duplicate guides
      const uniqueGuides = newGuides.filter(
        (g, i, arr) => arr.findIndex((g2) => g2.axis === g.axis && g2.position === g.position) === i
      );

      setGuides(uniqueGuides);
      return { x: finalX, y: finalY };
    },
    [snapEnabled, gridSize, shapes]
  );

  return {
    snapEnabled,
    toggleSnap,
    gridSize,
    setGridSize,
    guides,
    clearGuides,
    snapPosition,
  };
}
