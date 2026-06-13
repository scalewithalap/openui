"use client";
import { Button } from "@/components/ui/button";
import { useInfiniteCanvas } from "@/hooks/use-canvas";
import { setScale, setTranslate } from "@/redux/slice/viewport";
import { Shape } from "@/redux/slice/shapes";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import React from "react";
import { useAppDispatch } from "@/redux/store";

interface Point {
  x: number;
  y: number;
}

const getShapeCenter = (shape: Shape): Point => {
  switch (shape.type) {
    case "frame":
    case "rect":
    case "ellipse":
    case "note":
    case "generatedui":
      return { x: shape.x + shape.w / 2, y: shape.y + shape.h / 2 };
    case "text":
      return { x: shape.x + 60, y: shape.y + 15 };
    case "freedraw": {
      if (shape.points.length === 0) return { x: 0, y: 0 };
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    }
    case "arrow":
    case "line":
      return {
        x: (shape.startX + shape.endX) / 2,
        y: (shape.startY + shape.endY) / 2,
      };
    case "connector":
      return { x: 0, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
};

const ZoomBar = () => {
  const dispatch = useAppDispatch();
  const { viewport, shapes } = useInfiniteCanvas();
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleZoomOut = () => {
    const newScale = Math.max(viewport.scale / 1.2, viewport.minScale);
    dispatch(setScale({ scale: newScale }));
  };

  const handleZoomIn = () => {
    const newScale = Math.min(viewport.scale * 1.2, viewport.maxScale);
    dispatch(setScale({ scale: newScale }));
  };

  const handleClick = () => {
    setIsEditing(true);
    setInputValue(`${Math.round(viewport.scale * 100)}`);
  };

  const getMainShape = (): Shape | null => {
    if (!shapes || shapes.length === 0) return null;
    const genUi = shapes.find((s: Shape) => s.type === "generatedui");
    if (genUi) return genUi;
    const frame = shapes.find((s: Shape) => s.type === "frame");
    if (frame) return frame;
    const firstNonConnector = shapes.find((s: Shape) => s.type !== "connector");
    return firstNonConnector || shapes[0];
  };

  const handleCommit = () => {
    setIsEditing(false);
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed > 0) {
      const newScale = parsed / 100;
      const clampedScale = Math.min(
        Math.max(newScale, viewport.minScale),
        viewport.maxScale,
      );
      dispatch(setScale({ scale: clampedScale }));

      const mainShape = getMainShape();
      if (mainShape) {
        const center = getShapeCenter(mainShape);
        const canvasElement = document.querySelector('div[role="application"]');
        const width = canvasElement?.clientWidth || window.innerWidth;
        const height = canvasElement?.clientHeight || window.innerHeight;

        const tx = width / 2 - center.x * clampedScale;
        const ty = height / 2 - center.y * clampedScale;

        dispatch(setTranslate({ x: tx, y: ty }));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center select-none">
      <div className="flex items-center gap-1 bg-card/95 border border-border shadow-xl shadow-neutral-950/10 dark:shadow-black/50 rounded-full p-3 backdrop-blur-md">
        <Button
          variant="ghost"
          size="lg"
          onClick={handleZoomOut}
          className="w-9 h-9 p-0 rounded-full cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent
    hover:border-border transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <div
          className="text-center px-2 min-w-[5ch] flex items-center justify-center cursor-text"
          onClick={handleClick}
          title="Click to enter custom zoom"
        >
          {isEditing ? (
            <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                autoFocus
                value={inputValue}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                  setInputValue(cleaned);
                }}
                onBlur={handleCommit}
                onKeyDown={handleKeyDown}
                onFocus={(e) => e.target.select()}
                className="w-10 h-6 px-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-foreground text-xs text-center font-semibold font-mono rounded-md focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
              />
              <span className="text-sm font-semibold font-mono text-muted-foreground select-none">%</span>
            </div>
          ) : (
            <span className="text-sm font-semibold font-mono leading-none text-foreground">
              {Math.round(viewport.scale * 100)}%
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          className="w-9 h-9 p-0 rounded-full cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent
  hover:border-border transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <span className="mx-1 h-5 w-px rounded bg-border" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.dispatchEvent(new CustomEvent("canvas-fit-to-screen"))}
          className="w-9 h-9 p-0 rounded-full cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent
  hover:border-border transition-all"
          title="Fit to Screen (Ctrl + O)"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ZoomBar;
