import { Shape, updateShape, saveHistory } from "@/redux/slice/shapes";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { getShapeRect, getBestConnectionPoints, boundsFromPoints } from "@/lib/shape-utils";
import { getTextWidth } from "@/lib/font-loader";
import { Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionOverlayProps {
  shape: Shape;
  isSelected: boolean;
}

export const SelectionOverlay = ({
  shape,
  isSelected,
}: SelectionOverlayProps) => {
  const dispatch = useAppDispatch();
  const shapesEntities = useAppSelector(
    (state) => state.shapes.shapes.entities,
  );

  if (!isSelected) return null;

  // Get bounding box based on shape type
  const getBounds = () => {
    switch (shape.type) {
      case "frame":
      case "rect":
      case "ellipse":
      case "note":
      case "generatedui":
        return {
          x: shape.x,
          y: shape.y,
          w: shape.w,
          h: shape.h, // Use the shape's height which gets updated by the component
        };
      case "freedraw":
        if (shape.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
        const { minX, minY, maxX, maxY } = boundsFromPoints(shape.points);
        return {
          x: minX - 5, // Padding for stroke
          y: minY - 5,
          w: maxX - minX + 10,
          h: maxY - minY + 10,
        };
      case "arrow":
      case "line":
        const lineMinX = Math.min(shape.startX, shape.endX);
        const lineMaxX = Math.max(shape.startX, shape.endX);
        const lineMinY = Math.min(shape.startY, shape.endY);
        const lineMaxY = Math.max(shape.startY, shape.endY);
        return {
          x: lineMinX - 5,
          y: lineMinY - 5,
          w: lineMaxX - lineMinX + 10,
          h: lineMaxY - lineMinY + 10,
        };
      case "text": {
        // Calculate bounds purely and synchronously using getTextWidth to ensure
        // it updates in real-time during slider dragging and text editing.
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
        const paddingX = 16; // px-2 = 16px total padding
        const paddingY = 8; // py-1 = 8px total padding
        return {
          x: shape.x,
          y: shape.y,
          w: textWidth + paddingX,
          h: textHeight + paddingY,
        };
      }
      case "connector": {
        const fromShape = shapesEntities[shape.fromId];
        const toShape = shapesEntities[shape.toId];
        if (!fromShape || !toShape) return { x: 0, y: 0, w: 0, h: 0 };
        const rectA = getShapeRect(fromShape);
        const rectB = getShapeRect(toShape);
        const { start, end } = getBestConnectionPoints(rectA, rectB);
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        return {
          x: minX,
          y: minY,
          w: Math.max(2, maxX - minX),
          h: Math.max(2, maxY - minY),
        };
      }
      default:
        return { x: 0, y: 0, w: 0, h: 0 };
    }
  };

  const bounds = getBounds();

  // Only show resize handles for resizable shapes (exclude locked shapes and generatedui)
  const isResizable =
    !shape.locked &&
    (shape.type === "frame" ||
      shape.type === "rect" ||
      shape.type === "ellipse" ||
      shape.type === "note" ||
      shape.type === "freedraw" ||
      shape.type === "line" ||
      shape.type === "arrow" ||
      shape.type === "text");

  const handlePointerDown = (e: React.PointerEvent, corner: string) => {
    e.stopPropagation();
    // We'll handle the resize logic in the canvas hook
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Add data attributes to identify the resize operation
    const event = new CustomEvent("shape-resize-start", {
      detail: { shapeId: shape.id, corner, bounds },
    });
    window.dispatchEvent(event);
  };

  const handlePointerMove = (e: React.PointerEvent, corner: string) => {
    if ((e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
      const event = new CustomEvent("shape-resize-move", {
        detail: {
          shapeId: shape.id,
          corner,
          clientX: e.clientX,
          clientY: e.clientY,
          bounds,
          shiftKey: e.shiftKey,
        },
      });
      window.dispatchEvent(event);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    const event = new CustomEvent("shape-resize-end", {
      detail: { shapeId: shape.id },
    });
    window.dispatchEvent(event);
  };

  return (
    <div
      className={cn(
        "absolute pointer-events-none border-2 transition-colors duration-200",
        shape.locked
          ? "border-red-500 bg-red-500/3"
          : "border-blue-500 bg-blue-500/10",
      )}
      style={{
        left: bounds.x - 2,
        top: bounds.y - 2,
        width: bounds.w + 4,
        height: bounds.h + 4,
        borderRadius: shape.type === "frame" ? "10px" : "4px",
        zIndex: 20, // Ensure it draws on top of all shapes (e.g. GeneratedUI which has zIndex: 5)
      }}
    >
      {/* Lock/Unlock Control Button above the Selection Box */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-auto z-50 flex items-center justify-center"
        style={{ top: shape.type === "generatedui" ? -68 : -36 }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            dispatch(saveHistory());
            dispatch(
              updateShape({
                id: shape.id,
                patch: { locked: !shape.locked },
              }),
            );
          }}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-lg transition-all duration-200 cursor-pointer select-none",
            shape.locked
              ? "bg-red-500 hover:bg-red-600 border-red-400 text-white"
              : "bg-black/90 hover:bg-black border-white/20 text-white",
          )}
          title={shape.locked ? "Unlock element" : "Lock element"}
        >
          {shape.locked ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Unlock</span>
            </>
          ) : (
            <>
              <Unlock className="w-3.5 h-3.5 text-white/70" />
              <span>Lock</span>
            </>
          )}
        </button>
      </div>

      {isResizable && (
        <>
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize pointer-events-auto"
            style={{ top: -6, left: -6 }}
            onPointerDown={(e) => handlePointerDown(e, "nw")}
            onPointerMove={(e) => handlePointerMove(e, "nw")}
            onPointerUp={handlePointerUp}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize pointer-events-auto"
            style={{ top: -6, right: -6 }}
            onPointerDown={(e) => handlePointerDown(e, "ne")}
            onPointerMove={(e) => handlePointerMove(e, "ne")}
            onPointerUp={handlePointerUp}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize pointer-events-auto"
            style={{ bottom: -6, left: -6 }}
            onPointerDown={(e) => handlePointerDown(e, "sw")}
            onPointerMove={(e) => handlePointerMove(e, "sw")}
            onPointerUp={handlePointerUp}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize pointer-events-auto"
            style={{ bottom: -6, right: -6 }}
            onPointerDown={(e) => handlePointerDown(e, "se")}
            onPointerMove={(e) => handlePointerMove(e, "se")}
            onPointerUp={handlePointerUp}
          />
        </>
      )}
      {!isResizable && !shape.locked && (
        <>
          <div className="absolute w-2 h-2 bg-blue-500 border border-white rounded-full -top-1 -left-1" />
          <div className="absolute w-2 h-2 bg-blue-500 border border-white rounded-full -top-1 -right-1" />
          <div className="absolute w-2 h-2 bg-blue-500 border border-white rounded-full -bottom-1 -left-1" />
          <div className="absolute w-2 h-2 bg-blue-500 border border-white rounded-full -bottom-1 -right-1" />
        </>
      )}
    </div>
  );
};
