"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Trophy, Trash2 } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { removeShape, GeneratedUIShape } from "@/redux/slice/shapes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseHtmlDocument } from "@/lib/html-parser";

type ComparisonDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  shapeIds: string[];
};

export default function ComparisonDialog({
  isOpen,
  onClose,
  shapeIds,
}: ComparisonDialogProps) {
  const dispatch = useAppDispatch();
  const allEntities = useAppSelector((state) => state.shapes.shapes.entities);
  const { guide } = useAppSelector((state) => state.styleGuide);

  const shapes = React.useMemo(() => {
    return shapeIds
      .map((id) => allEntities[id])
      .filter(
        (s): s is GeneratedUIShape =>
          s != null && s.type === "generatedui" && !!s.uiSpecData,
      );
  }, [shapeIds, allEntities]);

  const [layout, setLayout] = React.useState<2 | 3 | 4>(
    Math.min(shapes.length, 3) as 2 | 3 | 4,
  );

  // Resolve design tokens dynamically by title lookups
  const primaryColor = guide?.colorSections
    .find((s: { title: string }) => s.title === "Primary Colors")
    ?.swatches[0]?.hexColor || "#db2800";

  const bgColor = guide?.colorSections
    .find((s: { title: string }) => s.title === "Primary Colors")
    ?.swatches[1]?.hexColor || "#faf8f5";

  const textColor = guide?.colorSections
    .find((s: { title: string }) => s.title === "Secondary & Accent Colors")
    ?.swatches[0]?.hexColor || "#2e2925";

  const headingFont = guide?.typographySections
    .find((s: { title: string }) => s.title.toLowerCase().includes("heading") || s.title.toLowerCase().includes("headline"))
    ?.styles[0]?.fontFamily || guide?.typographySections[0]?.styles[0]?.fontFamily || "Host Grotesk";

  const bodyFont = guide?.typographySections
    .find((s: { title: string }) => s.title.toLowerCase().includes("body"))
    ?.styles[0]?.fontFamily || guide?.typographySections[1]?.styles[0]?.fontFamily || "DM Sans";

  const fontImportUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFont)}:wght@400;700&family=${encodeURIComponent(bodyFont)}:wght@400;700&display=swap`;

  const buildSrcDoc = (html: string) => {
    const parsed = parseHtmlDocument(html);
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="${fontImportUrl}" rel="stylesheet" crossorigin="anonymous">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    body {
      font-family: '${bodyFont}', sans-serif;
      color: ${textColor};
      margin: 0;
      padding: 0;
      overflow-y: auto;
    }
    h1,h2,h3,h4,h5,h6 { font-family: '${headingFont}', sans-serif; }
  </style>
  ${parsed.headContent}
</head>
<body class="${parsed.bodyClass}" style="${parsed.bodyStyle}">
  ${parsed.bodyContent}
</body>
</html>`;
  };

  const handlePickWinner = (winnerId: string) => {
    const losers = shapes.filter((s) => s.id !== winnerId);
    losers.forEach((s) => dispatch(removeShape(s.id)));
    toast.success(
      `Winner picked! ${losers.length} variant${losers.length !== 1 ? "s" : ""} removed.`,
    );
    onClose();
  };

  if (shapes.length < 2) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="min-w-4xl max-h-[90vh] w-full bg-background border border-border text-foreground rounded-2xl p-0 flex flex-col overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Compare UI Variants</DialogTitle>
        <DialogHeader className="p-4 pb-0 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className="text-amber-500">⚡</span>
              Compare Variants
              <span className="text-muted-foreground text-xs font-normal">
                ({shapes.length} variants)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Layout switcher */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                {([2, 3, 4] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setLayout(n)}
                    disabled={shapes.length < n}
                    className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                      layout === n
                        ? "bg-background text-foreground shadow-3xs"
                        : "text-muted-foreground hover:text-foreground",
                      shapes.length < n && "opacity-30 cursor-not-allowed",
                    )}
                  >
                    {n}-up
                  </button>
                ))}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 pt-3">
          <div
            className="grid gap-4 h-full"
            style={{
              gridTemplateColumns: `repeat(${Math.min(layout, shapes.length)}, 1fr)`,
            }}
          >
            {shapes.slice(0, layout).map((shape, i) => (
              <div
                key={shape.id}
                className="flex flex-col border border-border rounded-xl overflow-hidden bg-card"
              >
                {/* Variant header */}
                <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border/60 shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">
                    Variant {i + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePickWinner(shape.id)}
                      className="h-6 px-2 text-[10px] text-amber-600 dark:text-amber-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                    >
                      <Trophy size={11} className="mr-1" />
                      Pick
                    </Button>
                  </div>
                </div>

                {/* Iframe preview */}
                <div className="flex-1 min-h-[400px]">
                  <iframe
                    srcDoc={buildSrcDoc(shape.uiSpecData || "")}
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full border-none bg-white"
                    style={{ minHeight: "400px" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
