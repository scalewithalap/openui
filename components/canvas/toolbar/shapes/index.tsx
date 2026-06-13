"use client";
import { Button } from "@/components/ui/button";
import { useInfiniteCanvas } from "@/hooks/use-canvas";
import { cn } from "@/lib/utils";
import { Tool } from "@/redux/slice/shapes";
import {
  MousePointer2,
  Hand,
  Hash,
  Square,
  ArrowRight,
  Circle,
  Minus,
  Pencil,
  Eraser,
  Type,
  StickyNote,
  GitCommit,
  Sparkles,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import React from "react";

const tools: Array<{
  id: Tool;
  icon: React.ReactNode;
  label: string;
  description: string;
}> = [
  {
    id: "select",
    icon: <MousePointer2 className="w-4 h-4" />,
    label: "Select",
    description: "Select and move shapes",
  },

  {
    id: "pan",
    icon: <Hand className="w-4 h-4" />,
    label: "Pan",
    description: "Pan the canvas",
  },
  {
    id: "frame",
    icon: <Hash className="w-4 h-4" />,
    label: "Frame",
    description: "Draw frame containers",
  },
  {
    id: "rect",
    icon: <Square className="w-4 h-4" />,
    label: "Rectangle",
    description: "Draw rectangles",
  },
  {
    id: "ellipse",
    icon: <Circle className="w-4 h-4" />,
    label: "Ellipse",
    description: "Draw ellipses and circles",
  },
  {
    id: "freedraw",
    icon: <Pencil className="w-4 h-4" />,
    label: "Free Draw",
    description: "Draw freehand lines",
  },
  {
    id: "arrow",
    icon: <ArrowRight className="w-4 h-4" />,
    label: "Arrow",
    description: "Draw arrows with direction",
  },
  {
    id: "line",
    icon: <Minus className="w-4 h-4" />,
    label: "Line",
    description: "Draw straight lines",
  },
  {
    id: "connector",
    icon: <GitCommit className="w-4 h-4" />,
    label: "Connector",
    description: "Link shapes with connector lines",
  },
  {
    id: "text",
    icon: <Type className="w-4 h-4" />,
    label: "Text",
    description: "Add text blocks",
  },
  {
    id: "note",
    icon: <StickyNote className="w-4 h-4" />,
    label: "Sticky Note",
    description: "Add sticky note cards",
  },
  {
    id: "eraser",
    icon: <Eraser className="w-4 h-4" />,
    label: "Eraser",
    description: "Remove shapes",
  },
  {
    id: "laser",
    icon: <Sparkles className="w-4 h-4" />,
    label: "Laser Pointer",
    description: "Highlight items with a fading glow trail",
  },
];

const ToolBarShapes = () => {
  const { currentTool, selectTool } = useInfiniteCanvas();
  return (
    <div className="flex items-center">
      <div
        className="flex items-center bg-card/95 border border-border shadow-xl shadow-neutral-950/10 dark:shadow-black/50 gap-2 rounded-full p-3 backdrop-blur-md"
      >
        <TooltipProvider>
          {tools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => selectTool(tool.id)}
                  className={cn(
                    "cursor-pointer rounded-full p-3 transition-all duration-200",
                    currentTool === tool.id
                      ? "text-primary-foreground bg-primary border border-primary/20 shadow-lg shadow-primary/20 scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                  )}
                >
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{`${tool.label} - ${tool.description}`}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ToolBarShapes;
