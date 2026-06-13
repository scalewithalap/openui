"use client";
import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LiquidGlassButton } from "@/components/buttons/liquid-glass";
import {
  X,
  Smartphone,
  Tablet,
  Monitor,
  ZoomIn,
  ZoomOut,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/store";
import { TOKEN_LISTENER_SCRIPT } from "@/hooks/use-token-injection";
import { parseHtmlDocument } from "@/lib/html-parser";

type DeviceFrame = "phone" | "tablet" | "desktop";

const DEVICE_DIMS: Record<
  DeviceFrame,
  { w: number; h: number; label: string }
> = {
  phone: { w: 375, h: 812, label: "Phone" },
  tablet: { w: 768, h: 1024, label: "Tablet" },
  desktop: { w: 1600, h: 900, label: "Desktop" },
};

type FullscreenPreviewProps = {
  isOpen: boolean;
  onClose: () => void;
  shapeId: string;
};

export default function FullscreenPreview({
  isOpen,
  onClose,
  shapeId,
}: FullscreenPreviewProps) {
  const [device, setDevice] = React.useState<DeviceFrame>("desktop");
  const [zoom, setZoom] = React.useState(1);

  const shape = useAppSelector(
    (state) => state.shapes.shapes.entities[shapeId],
  );
  const { guide } = useAppSelector((state) => state.styleGuide);

  // Initialize and reset device frame matching based on shape width on open
  React.useEffect(() => {
    if (isOpen && shape) {
      if (shape.w < 500) {
        setDevice("phone");
      } else if (shape.w >= 500 && shape.w < 900) {
        setDevice("tablet");
      } else {
        setDevice("desktop");
      }
      setZoom(1);
    }
  }, [isOpen, shapeId, shape?.w]);

  if (!shape || shape.type !== "generatedui" || !shape.uiSpecData) return null;

  // Resolve styles dynamically by title lookups (design system guidelines compliance)
  const primaryColor =
    guide?.colorSections.find(
      (s: { title: string }) => s.title === "Primary Colors",
    )?.swatches[0]?.hexColor || "#db2800";

  const bgColor =
    guide?.colorSections.find(
      (s: { title: string }) => s.title === "Primary Colors",
    )?.swatches[1]?.hexColor || "#faf8f5";

  const textColor =
    guide?.colorSections.find(
      (s: { title: string }) => s.title === "Secondary & Accent Colors",
    )?.swatches[0]?.hexColor || "#2e2925";

  const headingFont =
    guide?.typographySections.find(
      (s: { title: string }) =>
        s.title.toLowerCase().includes("heading") ||
        s.title.toLowerCase().includes("headline"),
    )?.styles[0]?.fontFamily ||
    guide?.typographySections[0]?.styles[0]?.fontFamily ||
    "Host Grotesk";

  const bodyFont =
    guide?.typographySections.find((s: { title: string }) =>
      s.title.toLowerCase().includes("body"),
    )?.styles[0]?.fontFamily ||
    guide?.typographySections[1]?.styles[0]?.fontFamily ||
    "DM Sans";

  const buttonRadius = guide
    ? `${guide.designSystemDetails.buttonRadius}px`
    : "9999px";
  const fontImportUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFont)}:wght@400;700&family=${encodeURIComponent(bodyFont)}:wght@400;700&display=swap`;

  const dims = DEVICE_DIMS[device];

  const parsed = parseHtmlDocument(shape.uiSpecData);

  // Reconstruct original generated HTML layout by mapping bodyClass/bodyStyle directly on body,
  // letting user's mockup center or stretch natively without forced overrides
  const srcDocContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="${fontImportUrl}" rel="stylesheet" crossorigin="anonymous">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    :root {
      --color-primary: ${primaryColor};
      --color-secondary: ${bgColor};
      --color-text: ${textColor};
      --font-heading: '${headingFont}', sans-serif;
      --font-body: '${bodyFont}', sans-serif;
      --border-radius-button: ${buttonRadius};
    }
    body {
      font-family: var(--font-body);
      color: var(--color-text);
      margin: 0;
      padding-top: ${device === "phone" ? "32px" : "16px"};
      overflow-y: auto;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
    }
  </style>
  ${parsed.headContent}
</head>
<body class="${parsed.bodyClass}" style="${parsed.bodyStyle}">
  ${parsed.bodyContent}
  ${TOKEN_LISTENER_SCRIPT}
</body>
</html>`;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));

  const handleOpenNewTab = () => {
    const fonts = {
      headingFont:
        guide?.typographySections?.[0]?.styles?.[0]?.fontFamily ||
        "Host Grotesk",
      bodyFont:
        guide?.typographySections?.[1]?.styles?.[0]?.fontFamily || "DM Sans",
    };
    const families = new Set<string>();
    families.add(fonts.headingFont.replace(/\s+/g, "+"));
    families.add(fonts.bodyFont.replace(/\s+/g, "+"));
    families.add("Inter");
    const params = Array.from(families)
      .map((f) => `family=${f}:wght@400;500;600;700`)
      .join("&");
    const fontsUrl = `https://fonts.googleapis.com/css2?${params}&display=swap`;

    const fullDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OpenUI Preview - Standalone</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="${fontsUrl}" rel="stylesheet">
  <style>
    :root {
      --color-primary: ${primaryColor};
      --color-secondary: ${bgColor};
      --color-text: ${textColor};
      --font-heading: '${headingFont}', sans-serif;
      --font-body: '${bodyFont}', sans-serif;
      --border-radius-button: ${buttonRadius};
    }
    body {
      font-family: '${fonts.bodyFont}', 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      color: var(--color-text);
      background-color: var(--color-secondary);
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: '${fonts.headingFont}', 'Inter', sans-serif;
    }
    [data-generated-ui] {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  </style>
  ${parsed.headContent}
</head>
<body class="${parsed.bodyClass}" style="${parsed.bodyStyle}">
  ${parsed.bodyContent}
</body>
</html>`;

    const blob = new Blob([fullDocument], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-none sm:max-w-none max-h-none sm:max-h-none w-screen h-screen bg-zinc-950 border-none rounded-none p-0 flex flex-col overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Fullscreen Preview</DialogTitle>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-zinc-900/80 border-b border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Preview
            </span>
            <span className="text-[10px] text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded-full">
              {dims.w} × {dims.h}
            </span>
          </div>

          {/* Device Switcher */}
          <div className="flex items-center gap-1 bg-zinc-800/50 rounded-full p-0.5">
            {[
              { id: "phone" as DeviceFrame, icon: Smartphone },
              { id: "tablet" as DeviceFrame, icon: Tablet },
              { id: "desktop" as DeviceFrame, icon: Monitor },
            ].map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setDevice(id);
                  setZoom(1);
                }}
                className={cn(
                  "p-2 rounded-full transition-all cursor-pointer",
                  device === id
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
                title={DEVICE_DIMS[id].label}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>

          {/* Zoom + Close */}
          <div className="flex items-center gap-2">
            {device === "desktop" && (
              <LiquidGlassButton
                size="sm"
                variant="subtle"
                onClick={handleOpenNewTab}
                className="shadow-2xs text-[11px] h-7 px-2.5 mr-2 bg-zinc-800/80 hover:bg-zinc-700/80 border-zinc-700 text-zinc-300 hover:text-zinc-100 cursor-pointer"
              >
                <ExternalLink size={12} className="mr-1.5 inline-block" />
                Open in New Tab
              </LiquidGlassButton>
            )}
            <div className="flex items-center gap-1 bg-zinc-800/50 rounded-full p-0.5">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-[10px] text-zinc-400 font-mono min-w-[3ch] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <ZoomIn size={13} />
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex overflow-auto bg-zinc-950 px-4 pb-2">
          {/* Scaled wrapper to handle accurate sizing in flow layout without scrollbar quirks */}
          <div
            className={cn(
              "transition-all duration-300 flex items-center justify-center shrink-0 m-auto",
              device === "desktop" ? "w-full h-full" : "",
            )}
            style={{
              width: device === "desktop" ? "100%" : dims.w * zoom,
              height: device === "desktop" ? "100%" : dims.h * zoom,
            }}
          >
            <div
              className={cn(
                "relative transition-all duration-300 shadow-2xl origin-center shrink-0",
                device === "phone" &&
                  "rounded-[2.5rem] border-8 border-zinc-700 bg-zinc-800",
                device === "tablet" &&
                  "rounded-3xl border-[6px] border-zinc-700 bg-zinc-800",
                device === "desktop" &&
                  "rounded-xl border-2 border-zinc-700 bg-zinc-800 overflow-hidden flex flex-col w-full h-full",
              )}
              style={{
                width: device === "desktop" ? "100%" : dims.w,
                height: device === "desktop" ? "100%" : dims.h,
                transform: device === "desktop" ? undefined : `scale(${zoom})`,
              }}
            >
              {/* Desktop browser chrome */}
              {device === "desktop" && (
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border-b border-zinc-700/60 shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-5 bg-zinc-700/60 rounded-md max-w-md mx-auto flex items-center justify-center">
                      <span className="text-[9px] text-zinc-500 font-mono">
                        localhost:3000
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <iframe
                data-openui-shape={`fullscreen-${shapeId}`}
                srcDoc={srcDocContent}
                sandbox="allow-scripts allow-same-origin"
                className={cn(
                  "w-full bg-white",
                  device === "desktop" && "flex-1",
                )}
                style={{
                  height:
                    device === "desktop"
                      ? undefined // Subtract browser chrome height
                      : device === "phone"
                        ? dims.h - 16 // Subtract notch area padding
                        : dims.h - 12,
                  border: "none",
                }}
              />

              {/* Phone home indicator */}
              {device === "phone" && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-zinc-600 rounded-full" />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
