import { LineShape } from "@/redux/slice/shapes";
import { cn } from "@/lib/utils";

export const Line = ({ shape }: { shape: LineShape }) => {
  const { startX, startY, endX, endY } = shape;
  
  // Calculate bounding box for the SVG
  const minX = Math.min(startX, endX) - 5;
  const minY = Math.min(startY, endY) - 5;
  const maxX = Math.max(startX, endX) + 5;
  const maxY = Math.max(startY, endY) + 5;
  const width = maxX - minX;
  const height = maxY - minY;
  
  const isDefaultStroke = shape.stroke === "#ffffff";
  
  return (
    <svg
      className={cn(
        "absolute pointer-events-none z-10",
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
    </svg>
  );
};
