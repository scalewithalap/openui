import { ArrowShape } from "@/redux/slice/shapes";
import { cn } from "@/lib/utils";

// Calculate arrow direction and create arrow head points
const calculateArrowHead = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  size: number = 10
) => {
  const angle = Math.atan2(endY - startY, endX - startX);
  const arrowAngle = Math.PI / 6;

  const x1 = endX - size * Math.cos(angle - arrowAngle);
  const y1 = endY - size * Math.sin(angle - arrowAngle);
  const x2 = endX - size * Math.cos(angle + arrowAngle);
  const y2 = endY - size * Math.sin(angle + arrowAngle);

  return { x1, y1, x2, y2 };
};

export const Arrow = ({ shape }: { shape: ArrowShape }) => {
  const { startX, startY, endX, endY } = shape;
  const arrowHead = calculateArrowHead(startX, startY, endX, endY, 12);

  // Calculate bounding box for the SVG
  const minX = Math.min(startX, endX, arrowHead.x1, arrowHead.x2) - 5;
  const minY = Math.min(startY, endY, arrowHead.y1, arrowHead.y2) - 5;
  const maxX = Math.max(startX, endX, arrowHead.x1, arrowHead.x2) + 5;
  const maxY = Math.max(startY, endY, arrowHead.y1, arrowHead.y2) + 5;
  const width = maxX - minX;
  const height = maxY - minY;

  const isDefaultStroke = shape.stroke === "#ffffff";

  return (
    <svg
      className={cn(
        "absolute pointer-events-none",
        isDefaultStroke && "text-foreground/80 dark:text-white"
      )}
      style={{
        left: minX,
        top: minY,
        width,
        height,
      }}
      aria-hidden>
      <line
        x1={startX - minX}
        y1={startY - minY}
        x2={endX - minX}
        y2={endY - minY}
        stroke={isDefaultStroke ? "currentColor" : shape.stroke}
        strokeWidth={shape.strokeWidth}
        strokeLinecap="round"
      />
      <polygon
        points={`${endX - minX},${endY - minY} ${arrowHead.x1 - minX},${arrowHead.y1 - minY} ${arrowHead.x2 - minX},${arrowHead.y2 - minY}`}
        fill={isDefaultStroke ? "currentColor" : shape.stroke}
        stroke={isDefaultStroke ? "currentColor" : shape.stroke}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </svg>
  );
};
