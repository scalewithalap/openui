import React from "react";
import { FrameShape, Shape } from "@/redux/slice/shapes";
import { LiquidGlassButton } from "@/components/buttons/liquid-glass";
import { Brush, Palette } from "lucide-react";
import { useFrame } from "@/hooks/use-canvas";
import { GeneratorDialog } from "./generator-dialog";
import { useAppSelector } from "@/redux/store";
import { useSearchParams } from "next/navigation";
import { isShapeInsideFrame } from "@/lib/frame-snapshot";

export const Frame = ({
  shape,
  toggleInspiration,
}: {
  shape: FrameShape;
  toggleInspiration: () => void;
}) => {
  const { isGenerating, handleGenerateDesign } = useFrame(shape);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project") || "";

  const shapesEntities = useAppSelector((state) => state.shapes.shapes.entities);
  const allShapes = React.useMemo(() => {
    return Object.values(shapesEntities || {}).filter(
      (s): s is Shape => s !== undefined
    );
  }, [shapesEntities]);

  // Check if there are any drawings or shapes inside this frame
  const hasDrawings = React.useMemo(() => {
    return allShapes.some(
      (s) => s.id !== shape.id && s.type !== "generatedui" && isShapeInsideFrame(s, shape)
    );
  }, [allShapes, shape]);

  return (
    <>
      <div
        className="absolute pointer-events-none bg-secondary/15 dark:bg-white/4 border-2 border-muted-foreground/30 dark:border-white/40 shadow-lg"
        style={{
          left: shape.x,
          top: shape.y,
          width: shape.w,
          height: shape.h,
          borderRadius: "12px", // Slightly more rounded for modern feel
        }}
      />
      <div
        className="absolute pointer-events-none whitespace-nowrap text-xs font-semibold text-foreground/80 dark:text-white select-none"
        style={{
          left: shape.x,
          top: shape.y - 24, // Position above the frame
          fontSize: "11px",
          lineHeight: "1.2",
        }}
      >
        Frame {shape.frameNumber}
      </div>
      <div
        className="absolute pointer-events-auto flex gap-4"
        style={{
          left: shape.x + shape.w - 235, // Position at top right, accounting for button width
          top: shape.y - 36, // Position above the frame with some spacing
          zIndex: 1000, // Ensure button is on top
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <LiquidGlassButton
          size="sm"
          variant="subtle"
          onClick={toggleInspiration}
          style={{ pointerEvents: "auto" }}
        >
          <Palette size={12} />
          Inspiration
        </LiquidGlassButton>
        <LiquidGlassButton
          size="sm"
          variant="subtle"
          onClick={() => setIsDialogOpen(true)}
          disabled={isGenerating}
          className={isGenerating ? "animate-pulse" : ""}
          style={{ pointerEvents: "auto" }}
        >
          <Brush size={12} className={isGenerating ? "animate-spin" : ""} />
          {isGenerating ? "Generating..." : "Generate Design"}
        </LiquidGlassButton>
      </div>

      <GeneratorDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleGenerateDesign}
        hasDrawings={hasDrawings}
        projectId={projectId}
      />
    </>
  );
};

