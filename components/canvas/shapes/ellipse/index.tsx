import { EllipseShape } from "@/redux/slice/shapes";
import { cn } from "@/lib/utils";

export const Ellipse = ({ shape }: { shape: EllipseShape }) => {
  const isDefaultStroke = shape.stroke === "#ffffff";

  return (
    <div
      className={cn(
        "absolute border-solid pointer-events-none",
        isDefaultStroke && "border-foreground/80 dark:border-white/80"
      )}
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.w,
        height: shape.h,
        borderColor: isDefaultStroke ? undefined : shape.stroke,
        borderWidth: shape.strokeWidth,
        backgroundColor: shape.fill ?? "transparent",
        borderRadius: "50%",
      }}
    />
  );
};
