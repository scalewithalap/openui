"use client";
import { LiquidGlassButton } from "@/components/buttons/liquid-glass";
import { useGeneratedContainer } from "@/hooks/use-styles";
import {
  TOKEN_LISTENER_SCRIPT,
  computeTokenHash,
} from "@/hooks/use-token-injection";
import {
  GeneratedUIShape,
  Shape,
  addGeneratedUI,
  updateShape,
} from "@/redux/slice/shapes";
import {
  Download,
  MessageCircle,
  Play,
  Square,
  Workflow,
  Copy,
  FileCode,
  ImageDown,
  ChevronDown,
  Maximize,
  FolderArchive,
  ArrowRightLeft,
  GitCompareArrows,
  Smartphone,
  Tablet,
  Monitor,
} from "lucide-react";
import React from "react";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { cn } from "@/lib/utils";
import { downloadHTML } from "@/lib/frame-snapshot";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { parseSSEStream } from "@/lib/stream-utils";
import { parseHtmlDocument, cleanBodyClass } from "@/lib/html-parser";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EditThemePopover from "./edit-theme-popover";
import FullscreenPreview from "./fullscreen-preview";
import CodePreviewDialog, { type Framework } from "./code-preview-dialog";
import ComparisonDialog from "./comparison-dialog";
import { exportScreensAsZip } from "@/lib/zip-export";

type Props = {
  shape: GeneratedUIShape;
  toggleChat: (generatedUIID: string) => void;
  generateWorkflow: (generatedUIID: string) => void;
  exportDesign: (generatedUIID: string, element: HTMLElement | null) => void;
  tweaks?: {
    layout: string;
    cornerRadius: number;
    waveformHeight: number;
    liveSpectrum: boolean;
    minimalism: number;
  };
};

const GeneratedUI = ({
  shape,
  toggleChat,
  generateWorkflow,
  exportDesign,
  tweaks,
}: Props) => {
  const { containerRef } = useGeneratedContainer(shape);
  const { guide } = useAppSelector((state) => state.styleGuide);
  const allShapesEntities = useAppSelector(
    (state) => state.shapes.shapes.entities,
  );
  const dispatch = useAppDispatch();
  const [isPlayMode, setIsPlayMode] = React.useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = React.useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = React.useState(false);
  const [codePreview, setCodePreview] = React.useState<{
    isOpen: boolean;
    code: string;
    framework: Framework;
    isStreaming: boolean;
  }>({ isOpen: false, code: "", framework: "react", isStreaming: false });
  const [iframeHeight, setIframeHeight] = React.useState(300);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Find sibling variants (shapes sharing same sourceFrameId)
  const siblingVariantIds = React.useMemo(() => {
    if (!shape.sourceFrameId) return [];
    return (Object.values(allShapesEntities) as (Shape | undefined)[])
      .filter(
        (s): s is GeneratedUIShape =>
          s != null &&
          s.type === "generatedui" &&
          s.sourceFrameId === shape.sourceFrameId &&
          !!s.uiSpecData,
      )
      .map((s) => s.id);
  }, [allShapesEntities, shape.sourceFrameId]);

  const handleConvertCode = async (framework: Framework) => {
    if (!shape.uiSpecData) return;

    setCodePreview({ isOpen: true, code: "", framework, isStreaming: true });

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get("project");
      const streamId = nanoid();

      const response = await fetch("/api/generate/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: shape.uiSpecData,
          framework,
          projectId,
          streamId,
        }),
      });

      if (!response.ok)
        throw new Error(`Conversion failed: ${response.status}`);

      const reader = response.body?.getReader();
      if (reader) {
        const finalCode = await parseSSEStream(reader, streamId, (accumulated) => {
          setCodePreview((prev) => ({ ...prev, code: accumulated }));
        });
        setCodePreview((prev) => ({ ...prev, code: finalCode }));
      }

      setCodePreview((prev) => ({ ...prev, isStreaming: false }));
    } catch {
      toast.error(`Failed to convert to ${framework}.`);
      setCodePreview((prev) => ({ ...prev, isStreaming: false }));
    }
  };

  const handleTranslateDevice = async (targetDevice: string) => {
    if (!shape.uiSpecData) return;

    const deviceLabels: Record<string, string> = {
      mobile:
        "mobile (375×812, vertical scrolling, bottom navigation, stacked content)",
      tablet: "tablet (768×1024, mixed layout, sidebar navigation)",
      web: "desktop web (1600×900, horizontal layout, top navigation, multi-column grids)",
    };

    const deviceSizes: Record<string, { w: number; h: number }> = {
      mobile: { w: 375, h: 812 },
      tablet: { w: 768, h: 1024 },
      web: { w: 1600, h: 900 },
    };

    const targetLabel = deviceLabels[targetDevice] || targetDevice;
    const dims = deviceSizes[targetDevice] || { w: shape.w, h: shape.h };

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get("project");

    if (!projectId) {
      toast.error("Project not found.");
      return;
    }

    toast.info(`Translating to ${targetDevice}...`);

    try {
      const response = await fetch("/api/generate/redesign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: `Translate this UI design to a ${targetLabel} layout. Keep all content and visual style but completely restructure the layout following ${targetDevice} device conventions. This is not a resize — it's a full layout translation with different navigation patterns, spacing, and component arrangements.`,
          generatedUIId: shape.id,
          currentHTML: shape.uiSpecData,
          projectId,
          streamId: shape.id,
        }),
      });

      if (!response.ok)
        throw new Error(`Translation failed: ${response.status}`);

      // Clear existing HTML and update dimensions before streaming new content
      dispatch(
        updateShape({
          id: shape.id,
          patch: {
            w: dims.w,
            h: dims.h,
            uiSpecData: null,
            isGenerating: true,
          },
        }),
      );

      // Stream response into the current shape
      const reader = response.body?.getReader();
      if (reader) {
        const finalHTML = await parseSSEStream(reader, shape.id, (accumulated) => {
          dispatch(
            updateShape({ id: shape.id, patch: { uiSpecData: accumulated } }),
          );
        });
        dispatch(
          updateShape({ id: shape.id, patch: { uiSpecData: finalHTML, isGenerating: false } }),
        );
      } else {
        dispatch(
          updateShape({ id: shape.id, patch: { isGenerating: false } }),
        );
      }

      toast.success(`Translated to ${targetDevice}!`);
    } catch {
      dispatch(
        updateShape({ id: shape.id, patch: { isGenerating: false } }),
      );
      toast.error(`Failed to translate to ${targetDevice}.`);
    }
  };

  const latestRef = React.useRef({ shape, guide, tweaks, dispatch });
  React.useEffect(() => {
    latestRef.current = { shape, guide, tweaks, dispatch };
  });

  // Resize message listener for iframe content
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our own iframes (srcDoc iframes report origin as "null")
      if (event.origin !== window.location.origin && event.origin !== "null") return;
      const { shape, guide, tweaks, dispatch } = latestRef.current;
      if (
        event.data &&
        event.data.type === "resize" &&
        event.data.shapeId === shape.id
      ) {
        const newHeight = event.data.height;
        setIframeHeight(newHeight);

        // Update shape height in Redux so selection border and canvas bounds match
        const paddingVal = guide
          ? Number(guide.designSystemDetails.spacingUnit)
          : tweaks
            ? Number(tweaks.minimalism)
            : 16;
        const totalHeight = newHeight + 2 * paddingVal;

        if (Math.abs(shape.h - totalHeight) > 2) {
          dispatch(updateShape({ id: shape.id, patch: { h: totalHeight } }));
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  React.useEffect(() => {
    if (!shape.uiSpecData || !containerRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const { toPng } = await import("html-to-image");
        const contentDiv = containerRef.current?.querySelector(
          'div[style*="pointer-events: auto"]',
        ) as HTMLElement;

        if (contentDiv) {
          const dataUrl = await toPng(contentDiv, {
            backgroundColor: "#faf8f5", // Use cream background matching brand style
            pixelRatio: 1,
            quality: 0.8,
            skipFonts: true,
            style: {
              transform: "scale(1)",
              transformOrigin: "top left",
            },
          });

          const searchParams = new URLSearchParams(window.location.search);
          const projectId = searchParams.get("project");
          if (projectId) {
            await fetch(`/api/projects/${projectId}/thumbnail`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ thumbnail: dataUrl }),
            });
          }
        }
      } catch (err) {
        console.warn("Failed to automatically update project thumbnail:", err);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [shape.uiSpecData]);

  const handleExportDesign = () => {
    if (!shape.uiSpecData) {
      console.warn("No UI data to export");
      return;
    }
    exportDesign(shape.id, containerRef.current);
  };

  const handleGenerateWorkflow = () => {
    generateWorkflow(shape.id);
  };

  const handleToggleChat = () => {
    toggleChat(shape.id);
  };

  // Resolve styles from style guide or fall back to local tweaks/defaults
  const primaryColor =
    guide?.colorSections[0]?.swatches[0]?.hexColor || "#db2800";
  const bgColor = guide?.colorSections[0]?.swatches[1]?.hexColor || "#faf8f5";
  const textColor = guide?.colorSections[1]?.swatches[0]?.hexColor || "#2e2925";
  const accentColor =
    guide?.colorSections.find(
      (s: { title: string }) => s.title === "Secondary & Accent Colors",
    )?.swatches[1]?.hexColor || "#8a9a86";

  const headingFont =
    guide?.typographySections[0]?.styles[0]?.fontFamily || "Host Grotesk";
  const bodyFont =
    guide?.typographySections[1]?.styles[0]?.fontFamily || "DM Sans";

  const cardRadius = guide
    ? `${guide.designSystemDetails.cardRadius}px`
    : tweaks
      ? `${tweaks.cornerRadius}px`
      : "18px";
  const spacingPadding = guide
    ? `${guide.designSystemDetails.spacingUnit}px`
    : tweaks
      ? `${tweaks.minimalism}px`
      : "16px";
  const buttonRadius = guide
    ? `${guide.designSystemDetails.buttonRadius}px`
    : "9999px";

  const fontImportUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFont)}:wght@400;700&family=${encodeURIComponent(bodyFont)}:wght@400;700&display=swap`;


  const mainContent = (
    <div
      ref={containerRef}
      className="absolute pointer-events-none"
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.w,
        height: "auto",
        zIndex: 5,
      }}
    >
      {/* Load selected fonts dynamically */}
      <style>{`
        @import url('${fontImportUrl}');
      `}</style>

      <div
        className={cn(
          "w-full h-auto relative bg-card border transition-all duration-300",
          isPlayMode
            ? "border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.25)] bg-[#faf8f5]/95"
            : "border-border/80 shadow-[0_12px_48px_-12px rgba(46, 41, 37, 0.08)]",
        )}
        style={
          {
            borderRadius: cardRadius,
            padding: spacingPadding,
            height: "auto",
            minHeight: "120px",
            position: "relative",
            // Inject custom variables for the generated HTML's CSS styles
            "--color-primary": primaryColor,
            "--color-secondary": bgColor,
            "--color-text": textColor,
            "--font-heading": headingFont,
            "--font-body": bodyFont,
            "--border-radius-button": buttonRadius,
          } as React.CSSProperties
        }
      >
        <div
          className="h-auto w-full generatedui-content pointer-events-auto"
          style={{
            pointerEvents: "auto",
            height: "auto",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <div className="absolute -top-8 right-0 flex gap-1.5 z-20">
            <LiquidGlassButton
              size="sm"
              variant={isPlayMode ? "default" : "subtle"}
              onClick={() => setIsPlayMode(!isPlayMode)}
              style={{ pointerEvents: "auto" }}
              className={cn(
                "shadow-2xs scale-90 transition-all",
                isPlayMode
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/30"
                  : "",
              )}
            >
              {isPlayMode ? (
                <Square size={11} className="fill-current mr-1" />
              ) : (
                <Play size={11} className="fill-current mr-1" />
              )}
              {isPlayMode ? "Stop" : "Sandbox"}
            </LiquidGlassButton>

            {/* Export Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <LiquidGlassButton
                  size="sm"
                  variant="subtle"
                  disabled={!shape.uiSpecData}
                  style={{ pointerEvents: "auto" }}
                  className="shadow-2xs scale-90"
                >
                  <Download size={11} />
                  Export
                  <ChevronDown size={9} className="ml-0.5 opacity-60" />
                </LiquidGlassButton>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={4}
                className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl w-[180px] p-1.5 shadow-2xl flex flex-col gap-0.5 z-50"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (shape.uiSpecData) {
                      navigator.clipboard
                        .writeText(shape.uiSpecData)
                        .then(() => {
                          toast.success("HTML copied to clipboard!");
                        })
                        .catch(() => {
                          toast.error("Failed to copy HTML.");
                        });
                    }
                  }}
                  className="w-full text-left cursor-pointer text-xs gap-2 flex items-center px-2 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <Copy size={13} className="text-zinc-400" />
                  Copy HTML
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (shape.uiSpecData) {
                      const filename = `openui-${shape.id.slice(0, 8)}.html`;
                      const fonts = {
                        headingFont: guide?.typographySections?.[0]?.styles?.[0]?.fontFamily || "Host Grotesk",
                        bodyFont: guide?.typographySections?.[1]?.styles?.[0]?.fontFamily || "DM Sans",
                      };
                      downloadHTML(shape.uiSpecData, filename, fonts);
                      toast.success("HTML file downloaded!");
                    }
                  }}
                  className="w-full text-left cursor-pointer text-xs gap-2 flex items-center px-2 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <FileCode size={13} className="text-zinc-400" />
                  Download HTML
                </button>
                <button
                  type="button"
                  onClick={handleExportDesign}
                  className="w-full text-left cursor-pointer text-xs gap-2 flex items-center px-2 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <ImageDown size={13} className="text-zinc-400" />
                  Download PNG
                </button>
                <hr className="border-zinc-800 my-1" />
                <button
                  type="button"
                  onClick={async () => {
                    const allScreens = (
                      Object.values(allShapesEntities) as (
                        | GeneratedUIShape
                        | undefined
                      )[]
                    )
                      .filter(
                        (s): s is GeneratedUIShape =>
                          s != null &&
                          s.type === "generatedui" &&
                          !!s.uiSpecData,
                      )
                      .map((s, i) => ({
                        id: s.id,
                        html: s.uiSpecData as string,
                        name: `screen-${i + 1}`,
                      }));

                    if (allScreens.length === 0) {
                      toast.error("No generated screens to export.");
                      return;
                    }

                    try {
                      await exportScreensAsZip(allScreens);
                      toast.success(
                        `Exported ${allScreens.length} screen${allScreens.length > 1 ? "s" : ""} as ZIP!`,
                      );
                    } catch {
                      toast.error("Failed to create ZIP export.");
                    }
                  }}
                  className="w-full text-left cursor-pointer text-xs gap-2 flex items-center px-2 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <FolderArchive size={13} className="text-zinc-400" />
                  Export All as ZIP
                </button>
                <hr className="border-zinc-800 my-1" />
                <button
                  type="button"
                  onClick={() => handleConvertCode("react")}
                  className="w-full text-left cursor-pointer text-xs gap-2 flex items-center px-2 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <span className="text-[13px] w-[13px] text-center font-serif">
                    ⚛️
                  </span>
                  Convert to React
                </button>
                <button
                  type="button"
                  onClick={() => handleConvertCode("vue")}
                  className="w-full text-left cursor-pointer text-xs gap-2 flex items-center px-2 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <span className="text-[13px] w-[13px] text-center">🟢</span>
                  Convert to Vue
                </button>
                <button
                  type="button"
                  onClick={() => handleConvertCode("angular")}
                  className="w-full text-left cursor-pointer text-xs gap-2 flex items-center px-2 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <span className="text-[13px] w-[13px] text-center">🅰️</span>
                  Convert to Angular
                </button>
                <button
                  type="button"
                  onClick={() => handleConvertCode("svelte")}
                  className="w-full text-left cursor-pointer text-xs gap-2 flex items-center px-2 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <span className="text-[13px] w-[13px] text-center">🟧</span>
                  Convert to Svelte
                </button>
              </PopoverContent>
            </Popover>

            {/* Edit Theme Popover */}
            <EditThemePopover />

            {/* Fullscreen Preview */}
            <LiquidGlassButton
              size="sm"
              variant="subtle"
              disabled={!shape.uiSpecData}
              onClick={() => setIsFullscreenOpen(true)}
              style={{ pointerEvents: "auto" }}
              className="shadow-2xs scale-90"
            >
              <Maximize size={11} />
              Preview
            </LiquidGlassButton>

            {/* Translate Device */}
            <Popover>
              <PopoverTrigger asChild>
                <LiquidGlassButton
                  size="sm"
                  variant="subtle"
                  disabled={!shape.uiSpecData}
                  style={{ pointerEvents: "auto" }}
                  className="shadow-2xs scale-90"
                >
                  <ArrowRightLeft size={11} />
                  Translate
                  <ChevronDown size={9} className="ml-0.5 opacity-60" />
                </LiquidGlassButton>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={4}
                className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl shadow-2xl w-[180px] p-1.5 flex flex-col gap-0.5 z-50"
              >
                <button
                  type="button"
                  onClick={() => handleTranslateDevice("mobile")}
                  className="w-full text-left cursor-pointer text-xs gap-2 flex items-center px-2 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <Smartphone size={13} className="text-zinc-400" />
                  Translate to Mobile
                </button>
                <button
                  type="button"
                  onClick={() => handleTranslateDevice("tablet")}
                  className="w-full text-left cursor-pointer text-xs gap-2 flex items-center px-2 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <Tablet size={13} className="text-zinc-400" />
                  Translate to Tablet
                </button>
                <button
                  type="button"
                  onClick={() => handleTranslateDevice("web")}
                  className="w-full text-left cursor-pointer text-xs gap-2 flex items-center px-2 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <Monitor size={13} className="text-zinc-400" />
                  Translate to Web
                </button>
              </PopoverContent>
            </Popover>

            {/* Compare Variants */}
            {siblingVariantIds.length >= 2 && (
              <LiquidGlassButton
                size="sm"
                variant="subtle"
                onClick={() => setIsComparisonOpen(true)}
                style={{ pointerEvents: "auto" }}
                className="shadow-2xs scale-90"
              >
                <GitCompareArrows size={11} />
                Compare
              </LiquidGlassButton>
            )}

            <LiquidGlassButton
              size="sm"
              variant="subtle"
              onClick={handleGenerateWorkflow}
              style={{ pointerEvents: "auto" }}
              className="shadow-2xs scale-90"
            >
              <Workflow size={11} />
              Workflow
            </LiquidGlassButton>
            <LiquidGlassButton
              size="sm"
              variant="subtle"
              onClick={handleToggleChat}
              style={{ pointerEvents: "auto" }}
              className="shadow-2xs scale-90"
            >
              <MessageCircle size={11} />
              Chat
            </LiquidGlassButton>
          </div>

          <GeneratedUIErrorBoundary>
            <GeneratedUIRenderer
              shapeId={shape.id}
              uiSpecData={shape.uiSpecData}
              isPlayMode={isPlayMode}
              iframeHeight={iframeHeight}
              iframeRef={iframeRef}
              fontImportUrl={fontImportUrl}
              primaryColor={primaryColor}
              bgColor={bgColor}
              textColor={textColor}
              accentColor={accentColor}
              headingFont={headingFont}
              bodyFont={bodyFont}
              buttonRadius={buttonRadius}
              tweaks={tweaks}
            />
          </GeneratedUIErrorBoundary>
        </div>
      </div>
      <div
        className={cn(
          "absolute -top-6 left-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border shadow-2xs flex items-center gap-1.5",
          shape.isGenerating
            ? "text-amber-500 bg-amber-500/10 border-amber-500/30 animate-pulse font-bold"
            : "text-muted-foreground bg-sidebar border border-sidebar-border"
        )}
        style={{ zIndex: 10 }}
      >
        {shape.isGenerating && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
        )}
        {isPlayMode ? "Sandbox Mode" : shape.isGenerating ? "Generating..." : "Generated UI"}
      </div>
      {/* Token Swatch Strip */}
      {shape.uiSpecData && guide && (
        <div
          className="absolute -bottom-7 left-0 flex items-center gap-1.5 px-2 py-1 rounded-full bg-sidebar/90 border border-sidebar-border/60 shadow-2xs backdrop-blur-sm"
          style={{ zIndex: 10 }}
        >
          {[primaryColor, bgColor, textColor, accentColor].map((color, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full border border-black/10 shadow-sm"
              style={{ backgroundColor: color }}
              title={["Primary", "Background", "Text", "Accent"][i]}
            />
          ))}
          <span className="text-[9px] text-muted-foreground/70 font-medium ml-0.5 max-w-[60px] truncate">
            {headingFont}
          </span>
          {(() => {
            const currentHash = computeTokenHash(guide);
            const isSynced =
              !shape.tokenHash || shape.tokenHash === currentHash;
            return (
              <span
                className={cn(
                  "text-[9px] font-bold ml-0.5",
                  isSynced ? "text-emerald-500" : "text-amber-500",
                )}
                title={
                  isSynced
                    ? "Tokens in sync"
                    : "Tokens changed since generation"
                }
              >
                {isSynced ? "✓" : "⚠"}
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );

  return (
    <>
      {mainContent}
      <FullscreenPreview
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        shapeId={shape.id}
      />
      <CodePreviewDialog
        isOpen={codePreview.isOpen}
        onClose={() => setCodePreview((prev) => ({ ...prev, isOpen: false }))}
        code={codePreview.code}
        framework={codePreview.framework}
        isStreaming={codePreview.isStreaming}
      />
      <ComparisonDialog
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        shapeIds={siblingVariantIds}
      />
    </>
  );
};

class GeneratedUIErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error rendering GeneratedUI frame:", error, errorInfo);
  }

  componentDidUpdate(prevProps: any) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center p-4 text-destructive bg-destructive/5 border border-destructive/20 rounded-lg text-xs gap-1.5 font-mono pointer-events-auto w-full min-h-[120px]">
            <span className="font-bold">⚠️ Rendering Error Intercepted</span>
            <span className="text-[10px] opacity-80 text-center">Skipped malformed frame chunk. Preserving state.</span>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

type RendererProps = {
  shapeId: string;
  uiSpecData: string | null;
  isPlayMode: boolean;
  iframeHeight: number;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  fontImportUrl: string;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  buttonRadius: string;
  tweaks?: any;
};

const GeneratedUIRenderer = ({
  shapeId,
  uiSpecData,
  isPlayMode,
  iframeHeight,
  iframeRef,
  fontImportUrl,
  primaryColor,
  bgColor,
  textColor,
  accentColor,
  headingFont,
  bodyFont,
  buttonRadius,
  tweaks,
}: RendererProps) => {
  const lastValidDocRef = React.useRef<any>(null);
  const [iframeLoaded, setIframeLoaded] = React.useState(false);

  const parsed = React.useMemo(() => {
    try {
      if (!uiSpecData) return null;
      const parsedDoc = parseHtmlDocument(uiSpecData);
      lastValidDocRef.current = parsedDoc;
      return parsedDoc;
    } catch (e) {
      console.warn("HTML Parser encountered a malformed chunk, using last valid state:", e);
      return lastValidDocRef.current;
    }
  }, [uiSpecData]);

  const initialShell = React.useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="${fontImportUrl}" rel="stylesheet" crossorigin="anonymous">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: 'var(--color-primary)',
            secondary: 'var(--color-secondary)',
          }
        }
      }
    }
  </script>
  <style>
    :root {
      --color-primary: ${primaryColor};
      --color-secondary: ${bgColor};
      --color-text: ${textColor};
      --font-heading: '${headingFont}', sans-serif;
      --font-body: '${bodyFont}', sans-serif;
      --border-radius-button: ${buttonRadius};
      --waveform-height: ${tweaks ? tweaks.waveformHeight + "px" : "90px"};
    }
    body {
      font-family: var(--font-body);
      color: var(--color-text);
      background-color: transparent;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
    }
    [data-generated-ui] {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .sandbox-toast-container {
      position: fixed;
      bottom: 16px;
      right: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 99999;
      pointer-events: none;
    }
    .sandbox-toast {
      pointer-events: auto;
      background-color: #2e2925;
      color: #faf8f5;
      border: 1px solid rgba(226, 91, 62, 0.2);
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(46, 41, 37, 0.3);
      font-family: var(--font-body);
      font-size: 13px;
      max-width: 320px;
      animation: toast-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sandbox-toast-header {
      font-weight: 700;
      color: #db2800;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sandbox-toast-body {
      opacity: 0.9;
      word-break: break-word;
      white-space: pre-wrap;
    }
    .sandbox-toast-close {
      cursor: pointer;
      font-size: 12px;
      opacity: 0.6;
    }
    .sandbox-toast-close:hover {
      opacity: 1;
    }
    @keyframes toast-fade-in {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .sandbox-dialog-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(46, 41, 37, 0.4);
      backdrop-filter: blur(4px);
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-body);
      animation: dialog-fade-in 0.2s ease-out;
    }
    .sandbox-dialog-container {
      background: #faf8f5;
      color: #2e2925;
      border: 1px solid rgba(46, 41, 37, 0.1);
      border-radius: 16px;
      padding: 24px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .sandbox-dialog-title {
      font-family: var(--font-heading);
      font-weight: bold;
      font-size: 18px;
      color: #2e2925;
    }
    .sandbox-dialog-message {
      font-size: 14px;
      color: #5a5450;
      line-height: 1.5;
    }
    .sandbox-dialog-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .sandbox-btn {
      padding: 8px 16px;
      border-radius: var(--border-radius-button, 9999px);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .sandbox-btn-primary {
      background: #db2800;
      color: white;
      border: none;
    }
    .sandbox-btn-primary:hover {
      background: #b32000;
    }
    .sandbox-btn-secondary {
      background: transparent;
      color: #2e2925;
      border: 1px solid rgba(46, 41, 37, 0.2);
    }
    .sandbox-btn-secondary:hover {
      background: rgba(46, 41, 37, 0.05);
    }
    @keyframes dialog-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  </style>
  <style id="custom-head-content"></style>
</head>
<body>
  <div id="mockup-root" style="padding: 32px 16px; box-sizing: border-box; width: 100%;"></div>

  <script>
    (function() {
      const toastContainer = document.createElement('div');
      toastContainer.className = 'sandbox-toast-container';
      document.body.appendChild(toastContainer);

      function showToast(title, body) {
        const toast = document.createElement('div');
        toast.className = 'sandbox-toast';
        
        const header = document.createElement('div');
        header.className = 'sandbox-toast-header';
        header.innerHTML = '<span>' + title + '</span>';
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'sandbox-toast-close';
        closeBtn.innerText = '✕';
        closeBtn.onclick = function() {
          toast.remove();
        };
        header.appendChild(closeBtn);
        
        const content = document.createElement('div');
        content.className = 'sandbox-toast-body';
        content.innerText = typeof body === 'object' ? JSON.stringify(body, null, 2) : body;
        
        toast.appendChild(header);
        toast.appendChild(content);
        
        toastContainer.appendChild(toast);
        
        setTimeout(function() {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 5000);
      }

      window.alert = function(msg) {
        const backdrop = document.createElement('div');
        backdrop.className = 'sandbox-dialog-backdrop';
        
        const container = document.createElement('div');
        container.className = 'sandbox-dialog-container';
        
        const title = document.createElement('div');
        title.className = 'sandbox-dialog-title';
        title.innerText = 'Alert';
        
        const message = document.createElement('div');
        message.className = 'sandbox-dialog-message';
        message.innerText = msg;
        
        const buttons = document.createElement('div');
        buttons.className = 'sandbox-dialog-buttons';
        
        const okBtn = document.createElement('button');
        okBtn.className = 'sandbox-btn sandbox-btn-primary';
        okBtn.innerText = 'OK';
        okBtn.onclick = function() {
          backdrop.remove();
        };
        
        buttons.appendChild(okBtn);
        container.appendChild(title);
        container.appendChild(message);
        container.appendChild(buttons);
        backdrop.appendChild(container);
        
        document.body.appendChild(backdrop);
      };

      window.confirm = function(msg) {
        return new Promise(function(resolve) {
          const backdrop = document.createElement('div');
          backdrop.className = 'sandbox-dialog-backdrop';
          
          const container = document.createElement('div');
          container.className = 'sandbox-dialog-container';
          
          const title = document.createElement('div');
          title.className = 'sandbox-dialog-title';
          title.innerText = 'Confirm';
          
          const message = document.createElement('div');
          message.className = 'sandbox-dialog-message';
          message.innerText = msg;
          
          const buttons = document.createElement('div');
          buttons.className = 'sandbox-dialog-buttons';
          
          const cancelBtn = document.createElement('button');
          cancelBtn.className = 'sandbox-btn sandbox-btn-secondary';
          cancelBtn.innerText = 'Cancel';
          cancelBtn.onclick = function() {
            backdrop.remove();
            resolve(false);
          };
          
          const okBtn = document.createElement('button');
          okBtn.className = 'sandbox-btn sandbox-btn-primary';
          okBtn.innerText = 'Confirm';
          okBtn.onclick = function() {
            backdrop.remove();
            resolve(true);
          };
          
          buttons.appendChild(cancelBtn);
          buttons.appendChild(okBtn);
          container.appendChild(title);
          container.appendChild(message);
          container.appendChild(buttons);
          backdrop.appendChild(container);
          
          document.body.appendChild(backdrop);
        });
      };

      window.addEventListener('submit', function(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
          data[key] = value;
        });
        
        console.log('Form Submitted:', data);
        showToast('Form Submitted Successfully', data);
      }, true);

      const mockRoutes = {
        '/api/login': { status: 200, json: { token: 'mock-jwt-token-xyz123', user: { name: 'Demo User', email: 'user@example.com', role: 'admin' } } },
        '/login': { status: 200, json: { token: 'mock-jwt-token-xyz123', user: { name: 'Demo User', email: 'user@example.com', role: 'admin' } } },
        '/api/products': { 
          status: 200, 
          json: { 
            products: [
              { id: 1, name: 'Minimalist Chair', price: '$120', rating: 4.8 },
              { id: 2, name: 'Brushed Brass Lamp', price: '$85', rating: 4.5 },
              { id: 3, name: 'Linen Pillow Case', price: '$45', rating: 4.9 }
            ] 
          } 
        },
        '/products': { 
          status: 200, 
          json: { 
            products: [
              { id: 1, name: 'Minimalist Chair', price: '$120', rating: 4.8 },
              { id: 2, name: 'Brushed Brass Lamp', price: '$85', rating: 4.5 },
              { id: 3, name: 'Linen Pillow Case', price: '$45', rating: 4.9 }
            ] 
          } 
        },
        '/api/profile': { status: 200, json: { id: 'usr-99', name: 'John Doe', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', bio: 'Product Designer & Minimalist Enthusiast' } },
        '/profile': { status: 200, json: { id: 'usr-99', name: 'John Doe', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80', bio: 'Product Designer & Minimalist Enthusiast' } }
      };

      const originalFetch = window.fetch;
      window.fetch = function(input, init) {
        let url = typeof input === 'string' ? input : input.url;
        try {
          const parsed = new URL(url, window.location.href);
          url = parsed.pathname;
        } catch(e) {}

        const matchedRoute = mockRoutes[url];
        if (matchedRoute) {
          console.log('[Sandbox Fetch Intercept]', url, init);
          showToast('API Fetch Intercepted', 'Route: ' + url + '\\nParams: ' + (init ? JSON.stringify(init.body || '') : 'None'));
          
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve(new Response(JSON.stringify(matchedRoute.json), {
                status: matchedRoute.status,
                headers: { 'Content-Type': 'application/json' }
              }));
            }, 600);
          });
        }
        
        console.log('[Sandbox Fetch Generic Mock]', url, init);
        showToast('Generic API Fetch Intercepted', 'Route: ' + url);
        return new Promise(function(resolve) {
          setTimeout(function() {
            resolve(new Response(JSON.stringify({ success: true, message: 'Mock response for ' + url }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }));
          }, 400);
        });
      };

      const originalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        let method = 'GET';
        let url = '';

        xhr.open = function(m, u, ...args) {
          method = m;
          url = u;
          originalOpen.apply(this, [m, u, ...args]);
        };

        xhr.send = function(body) {
          let pathname = url;
          try {
            const parsed = new URL(url, window.location.href);
            pathname = parsed.pathname;
          } catch(e) {}

          const matchedRoute = mockRoutes[pathname];
          if (matchedRoute) {
            console.log('[Sandbox XHR Intercept]', pathname, body);
            showToast('API XHR Intercepted', 'Route: ' + pathname + '\\nBody: ' + (body || 'None'));

            setTimeout(() => {
              Object.defineProperty(xhr, 'readyState', { writable: true, value: 4 });
              Object.defineProperty(xhr, 'status', { writable: true, value: matchedRoute.status });
              Object.defineProperty(xhr, 'responseText', { writable: true, value: JSON.stringify(matchedRoute.json) });
              Object.defineProperty(xhr, 'response', { writable: true, value: matchedRoute.json });
              
              if (xhr.onreadystatechange) xhr.onreadystatechange();
              xhr.dispatchEvent(new Event('readystatechange'));
              xhr.dispatchEvent(new Event('load'));
            }, 600);
            return;
          }

          console.log('[Sandbox XHR Generic Mock]', pathname, body);
          showToast('Generic XHR Intercepted', 'Route: ' + pathname);
          setTimeout(() => {
            Object.defineProperty(xhr, 'readyState', { writable: true, value: 4 });
            Object.defineProperty(xhr, 'status', { writable: true, value: 200 });
            Object.defineProperty(xhr, 'responseText', { writable: true, value: JSON.stringify({ success: true, message: 'Mock response for ' + pathname }) });
            
            if (xhr.onreadystatechange) xhr.onreadystatechange();
            xhr.dispatchEvent(new Event('readystatechange'));
            xhr.dispatchEvent(new Event('load'));
          }, 400);
        };

        return xhr;
      };

      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const height = Math.ceil(document.body.scrollHeight);
          window.parent.postMessage({
            type: 'resize',
            shapeId: '${shapeId}',
            height: height
          }, '*');
        }
      });
      resizeObserver.observe(document.body);
      
      window.addEventListener('load', () => {
        window.parent.postMessage({
          type: 'resize',
          shapeId: '${shapeId}',
          height: Math.ceil(document.body.scrollHeight)
        }, '*');
      });
    })();
  </script>
  ${TOKEN_LISTENER_SCRIPT}
</body>
</html>`;
  }, [
    fontImportUrl,
    primaryColor,
    bgColor,
    textColor,
    headingFont,
    bodyFont,
    buttonRadius,
    shapeId,
    tweaks,
  ]);

  const updateIframeDOM = React.useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const mockupRoot = doc.getElementById("mockup-root");
    const customHead = doc.getElementById("custom-head-content");
    const parsedDoc = parsed || lastValidDocRef.current;

    if (mockupRoot && parsedDoc) {
      const bodyClass = cleanBodyClass(parsedDoc.bodyClass);
      if (mockupRoot.className !== bodyClass) {
        mockupRoot.className = bodyClass;
      }
      const newStyle = `padding: 32px 16px; box-sizing: border-box; width: 100%; ${parsedDoc.bodyStyle}`;
      if (mockupRoot.getAttribute("style") !== newStyle) {
        mockupRoot.setAttribute("style", newStyle);
      }
      if (mockupRoot.innerHTML !== parsedDoc.bodyContent) {
        mockupRoot.innerHTML = parsedDoc.bodyContent;
      }
      if (customHead && customHead.innerHTML !== parsedDoc.headContent) {
        customHead.innerHTML = parsedDoc.headContent;
      }
    }
  }, [parsed]);

  React.useEffect(() => {
    updateIframeDOM();
  }, [parsed, updateIframeDOM, iframeLoaded]);

  if (!uiSpecData) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground/60">
        <div className="animate-pulse font-medium text-xs">
          Generating mockup...
        </div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      onLoad={() => setIframeLoaded(true)}
      data-openui-shape={shapeId}
      sandbox="allow-scripts allow-same-origin"
      srcDoc={initialShell}
      style={{
        width: "100%",
        height: `${iframeHeight}px`,
        border: "none",
        overflow: "hidden",
        pointerEvents: isPlayMode ? "auto" : "none",
      }}
      className="w-full bg-transparent rounded-lg"
    />
  );
};

export default GeneratedUI;
