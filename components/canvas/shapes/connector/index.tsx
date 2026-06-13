import { ConnectorShape } from "@/redux/slice/shapes";
import { useAppSelector } from "@/redux/store";
import {
  getShapeRect,
  getBestConnectionPoints,
  calculateArrowHead,
} from "@/lib/shape-utils";
import React from "react";

export const Connector = ({ shape }: { shape: ConnectorShape }) => {
  // M8 fix: Select only the two connected shapes instead of all entities
  const fromShape = useAppSelector(
    (state) => state.shapes.shapes.entities[shape.fromId],
  );
  const toShape = useAppSelector(
    (state) => state.shapes.shapes.entities[shape.toId],
  );

  if (!fromShape || !toShape) return null;

  const rectA = getShapeRect(fromShape);
  const rectB = getShapeRect(toShape);

  const { start, end } = getBestConnectionPoints(rectA, rectB);
  const arrowHead = calculateArrowHead(start.x, start.y, end.x, end.y, 10);

  const minX = Math.min(start.x, end.x, arrowHead.x1, arrowHead.x2) - 10;
  const minY = Math.min(start.y, end.y, arrowHead.y1, arrowHead.y2) - 10;
  const maxX = Math.max(start.x, end.x, arrowHead.x1, arrowHead.x2) + 10;
  const maxY = Math.max(start.y, end.y, arrowHead.y1, arrowHead.y2) + 10;
  const width = maxX - minX;
  const height = maxY - minY;

  const strokeColor = shape.stroke || "#db2800";
  const strokeWidth = shape.strokeWidth || 2;

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        left: minX,
        top: minY,
        width,
        height,
      }}
      aria-hidden
    >
      <line
        x1={start.x - minX}
        y1={start.y - minY}
        x2={end.x - minX}
        y2={end.y - minY}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className="animate-connector-flow"
      />
      <polygon
        points={`${end.x - minX},${end.y - minY} ${arrowHead.x1 - minX},${arrowHead.y1 - minY} ${arrowHead.x2 - minX},${arrowHead.y2 - minY}`}
        fill={strokeColor}
        stroke={strokeColor}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </svg>
  );
};
