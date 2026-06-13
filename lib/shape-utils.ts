import type { Shape } from "@/redux/slice/shapes";
import { getTextWidth } from "@/lib/font-loader";
import type { Point } from "@/redux/slice/viewport";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Loop-based min/max for arrays — avoids stack overflow from `Math.min(...arr)`
 * when array length exceeds ~65K (V8 call stack limit).
 */
export function boundsFromPoints(
  points: ReadonlyArray<Point>,
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Returns the bounding rect for any Shape.
 * Uses `getTextWidth` for accurate text measurement.
 */
export function getShapeRect(
  shape: Shape,
): Rect {
  if (
    shape.type === "frame" ||
    shape.type === "rect" ||
    shape.type === "ellipse" ||
    shape.type === "note" ||
    shape.type === "generatedui"
  ) {
    return { x: shape.x, y: shape.y, w: shape.w, h: shape.h };
  }
  if (shape.type === "text") {
    const textWidth = Math.max(
      getTextWidth(
        shape.text,
        shape.fontSize,
        shape.fontFamily,
        shape.fontWeight,
        shape.fontStyle,
        shape.letterSpacing,
      ),
      100,
    );
    const textHeight = shape.fontSize * 1.2;
    return { x: shape.x, y: shape.y, w: textWidth + 16, h: textHeight + 8 };
  }
  if (shape.type === "freedraw") {
    if (shape.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
    const { minX, minY, maxX, maxY } = boundsFromPoints(shape.points);
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  if (shape.type === "arrow" || shape.type === "line") {
    const minX = Math.min(shape.startX, shape.endX);
    const maxX = Math.max(shape.startX, shape.endX);
    const minY = Math.min(shape.startY, shape.endY);
    const maxY = Math.max(shape.startY, shape.endY);
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  return { x: 0, y: 0, w: 0, h: 0 };
}

/**
 * Returns the center point of any shape.
 */
export function getShapeCenter(shape: Shape): Point {
  const rect = getShapeRect(shape);
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

/**
 * Finds the best pair of connection ports between two rects
 * (top, bottom, left, right midpoints), minimizing distance.
 */
export function getBestConnectionPoints(a: Rect, b: Rect) {
  const portsA = [
    { x: a.x + a.w / 2, y: a.y }, // Top
    { x: a.x + a.w / 2, y: a.y + a.h }, // Bottom
    { x: a.x, y: a.y + a.h / 2 }, // Left
    { x: a.x + a.w, y: a.y + a.h / 2 }, // Right
  ];
  const portsB = [
    { x: b.x + b.w / 2, y: b.y }, // Top
    { x: b.x + b.w / 2, y: b.y + b.h }, // Bottom
    { x: b.x, y: b.y + b.h / 2 }, // Left
    { x: b.x + b.w, y: b.y + b.h / 2 }, // Right
  ];

  let minD = Infinity;
  let bestA = portsA[0];
  let bestB = portsB[0];

  for (const pa of portsA) {
    for (const pb of portsB) {
      const d = Math.hypot(pb.x - pa.x, pb.y - pa.y);
      if (d < minD) {
        minD = d;
        bestA = pa;
        bestB = pb;
      }
    }
  }
  return { start: bestA, end: bestB };
}

/**
 * Calculates the two wing points of an arrowhead at the end of a line.
 */
export function calculateArrowHead(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  size: number = 10,
) {
  const angle = Math.atan2(endY - startY, endX - startX);
  const arrowAngle = Math.PI / 6;

  const x1 = endX - size * Math.cos(angle - arrowAngle);
  const y1 = endY - size * Math.sin(angle - arrowAngle);
  const x2 = endX - size * Math.cos(angle + arrowAngle);
  const y2 = endY - size * Math.sin(angle + arrowAngle);

  return { x1, y1, x2, y2 };
}
