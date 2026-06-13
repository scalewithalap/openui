"use client";
import React, { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import {
  updateVisualTokens,
  updateMarkdownText,
  syncMarkdownToTokens,
  saveStyleGuideStart,
  saveStyleGuideSuccess,
  saveStyleGuideFailure,
  parseYAML,
  loadStyleGuideSuccess,
  saveSnapshot,
  restoreSnapshot,
  deleteSnapshot,
  StyleGuideSnapshot,
} from "@/redux/slice/style-guide";
import { updateShape, GeneratedUIShape, Shape } from "@/redux/slice/shapes";
import { computeTokenHash } from "@/hooks/use-token-injection";
import { ColorSection, ColorSwatch } from "@/redux/api/style-guide";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Palette,
  Type,
  Sliders,
  Check,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Layers,
  FileCode,
  Wand2,
  RefreshCw,
  History,
  RotateCcw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { checkContrast, getContrastRecommendation } from "@/lib/contrast";
import { toast } from "sonner";
import { parseSSEStream } from "@/lib/stream-utils";

const GOOGLE_FONTS = [
  "Host Grotesk",
  "DM Sans",
  "Inter",
  "Roboto",
  "Geist",
  "Montserrat",
  "Playfair Display",
  "Space Grotesk",
  "Work Sans",
  "Sora",
  "JetBrains Mono",
];

export default function DesignTokensEditor({
  projectId,
}: {
  projectId: string;
}) {
  const dispatch = useAppDispatch();
  const { guide, isSaving, mode } = useAppSelector((state) => state.styleGuide);
  const allShapes = useAppSelector((state) => state.shapes.shapes.entities);
  const snapshots = useAppSelector((state) => state.styleGuide.snapshots);
  const [localMd, setLocalMd] = useState("");
  const [lastSavedMd, setLastSavedMd] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [snapshotName, setSnapshotName] = useState("");
  const resolvedColorsRef = useRef<Record<string, any>>({});

  // AI Theme Generation state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

  // Retheme state
  const [isRethemeing, setIsRethemeing] = useState(false);
  const [rethemeProgress, setRethemeProgress] = useState({
    current: 0,
    total: 0,
  });

  const handleGenerateTheme = async () => {
    if (!aiPrompt.trim() || isGeneratingTheme) return;
    setIsGeneratingTheme(true);
    try {
      const response = await fetch("/api/generate/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, projectId }),
      });
      if (!response.ok) throw new Error("Failed to generate theme");
      const data = await response.json();
      if (data.success && data.styleGuide) {
        dispatch(loadStyleGuideSuccess(data.styleGuide));
        toast.success(`Theme "${data.styleGuide.theme}" generated!`);
        setAiPrompt("");
      } else {
        toast.error(data.error || "Failed to generate theme");
      }
    } catch (err) {
      toast.error("Failed to generate theme. Check your AI provider settings.");
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  const handleRethemeAll = async () => {
    if (!guide || isRethemeing) return;
    const generatedUIShapes = (
      Object.values(allShapes) as (Shape | undefined)[]
    ).filter(
      (s): s is GeneratedUIShape =>
        s != null &&
        s.type === "generatedui" &&
        !!(s as GeneratedUIShape).uiSpecData,
    );

    if (generatedUIShapes.length === 0) {
      toast.error("No generated UI screens to retheme.");
      return;
    }

    setIsRethemeing(true);
    setRethemeProgress({ current: 0, total: generatedUIShapes.length });

    const tokens = {
      primaryColor: guide.colorSections[0]?.swatches[0]?.hexColor,
      bgColor: guide.colorSections[0]?.swatches[1]?.hexColor,
      textColor: guide.colorSections[1]?.swatches[0]?.hexColor,
      accentColor: guide.colorSections[1]?.swatches[1]?.hexColor,
      headingFont: guide.typographySections[0]?.styles[0]?.fontFamily,
      bodyFont: guide.typographySections[1]?.styles[0]?.fontFamily,
      cardRadius: guide.designSystemDetails.cardRadius,
      buttonRadius: guide.designSystemDetails.buttonRadius,
      spacingUnit: guide.designSystemDetails.spacingUnit,
    };

    const tokenHash = computeTokenHash(guide);

    for (let i = 0; i < generatedUIShapes.length; i++) {
      const shape = generatedUIShapes[i];
      setRethemeProgress({ current: i + 1, total: generatedUIShapes.length });

      try {
        const response = await fetch("/api/generate/retheme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html: shape.uiSpecData,
            tokens,
            projectId,
            streamId: shape.id,
          }),
        });

        if (!response.ok) {
          console.warn(`Failed to retheme shape ${shape.id}`);
          continue;
        }

        let accumulated = "";
        const reader = response.body?.getReader();
        if (reader) {
          accumulated = await parseSSEStream(reader, shape.id, () => {});
        }

        if (accumulated.trim()) {
          dispatch(
            updateShape({
              id: shape.id,
              patch: { uiSpecData: accumulated, tokenHash },
            }),
          );
        }
      } catch (err) {
        console.warn(`Error rethemeing shape ${shape.id}:`, err);
      }
    }

    setIsRethemeing(false);
    toast.success(`Rethemed ${generatedUIShapes.length} screen(s)!`);
  };

  // Only sync Redux guide markdown to local editor state when in markdown mode
  // or on initial load to avoid triggering heavy state updates during visual editing.
  useEffect(() => {
    if (
      guide?.designSystemDetails?.designMd &&
      (mode === "markdown" || !localMd)
    ) {
      setLocalMd(guide.designSystemDetails.designMd);
      setLastSavedMd(guide.designSystemDetails.designMd);
    }
  }, [guide, mode, localMd]);

  // Trigger autosave when guide changes
  useEffect(() => {
    if (!guide || !projectId) return;

    // Trigger save after 1.5 seconds of inactivity
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [guide, projectId]);

  const handleSave = async () => {
    if (!guide || !projectId) return;
    dispatch(saveStyleGuideStart());
    try {
      const response = await fetch(`/api/projects/${projectId}/style-guide`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styleGuide: guide }),
      });
      if (response.ok) {
        dispatch(saveStyleGuideSuccess());
        if (guide.designSystemDetails?.designMd) {
          setLastSavedMd(guide.designSystemDetails.designMd);
        }
      } else {
        dispatch(saveStyleGuideFailure("Failed to save style guide"));
      }
    } catch (err) {
      dispatch(saveStyleGuideFailure("Failed to save style guide"));
    }
  };

  const handleColorChange = (
    type: "primary" | "bg" | "text",
    value: string,
    _currentValue?: string,
  ) => {
    const currentValue =
      resolvedColorsRef.current[
        `${type}Color` as keyof typeof resolvedColorsRef.current
      ];
    if (value === currentValue) return;
    dispatch(
      updateVisualTokens({
        ...(type === "primary" && { primaryColor: value }),
        ...(type === "bg" && { bgColor: value }),
        ...(type === "text" && { textColor: value }),
      }),
    );
  };

  const handleSemanticColorChange = (
    type: "success" | "warning" | "error" | "info",
    value: string,
    _currentValue?: string,
  ) => {
    const currentValue =
      resolvedColorsRef.current[
        `${type}Color` as keyof typeof resolvedColorsRef.current
      ];
    if (value === currentValue) return;
    dispatch(
      updateVisualTokens({
        ...(type === "success" && { successColor: value }),
        ...(type === "warning" && { warningColor: value }),
        ...(type === "error" && { errorColor: value }),
        ...(type === "info" && { infoColor: value }),
      }),
    );
  };

  const handleSurfaceBorderChange = (
    type: "surface" | "muted" | "border" | "width" | "opacity",
    value: string | number,
    _currentValue?: string | number,
  ) => {
    const key =
      type === "width"
        ? "borderWidth"
        : type === "opacity"
          ? "overlayOpacity"
          : `${type}Color`;
    const currentValue =
      resolvedColorsRef.current[key as keyof typeof resolvedColorsRef.current];
    if (value === currentValue) return;
    dispatch(
      updateVisualTokens({
        ...(type === "surface" && { surfaceColor: value as string }),
        ...(type === "muted" && { mutedColor: value as string }),
        ...(type === "border" && { borderColor: value as string }),
        ...(type === "width" && { borderWidth: value as number }),
        ...(type === "opacity" && { overlayOpacity: value as number }),
      }),
    );
  };

  const handleShadowChange = (
    type: "sm" | "md" | "lg" | "xl",
    value: string,
  ) => {
    const currentValue =
      resolvedColorsRef.current[
        `shadow${type.toUpperCase()}` as keyof typeof resolvedColorsRef.current
      ];
    if (value === currentValue) return;
    dispatch(
      updateVisualTokens({
        ...(type === "sm" && { shadowSm: value }),
        ...(type === "md" && { shadowMd: value }),
        ...(type === "lg" && { shadowLg: value }),
        ...(type === "xl" && { shadowXl: value }),
      }),
    );
  };

  const handleFontChange = (type: "heading" | "body", value: string) => {
    const currentValue =
      resolvedColorsRef.current[
        `${type}Font` as keyof typeof resolvedColorsRef.current
      ];
    if (value === currentValue) return;
    dispatch(
      updateVisualTokens({
        ...(type === "heading" && { headingFont: value }),
        ...(type === "body" && { bodyFont: value }),
      }),
    );
  };

  const handleRadiusChange = (type: "card" | "button", value: number) => {
    const currentValue =
      resolvedColorsRef.current[
        `${type}Radius` as keyof typeof resolvedColorsRef.current
      ];
    if (value === currentValue) return;
    dispatch(
      updateVisualTokens({
        ...(type === "card" && { cardRadius: value }),
        ...(type === "button" && { buttonRadius: value }),
      }),
    );
  };

  const handleSpacingChange = (value: number) => {
    const currentValue = resolvedColorsRef.current.spacingUnit;
    if (value === currentValue) return;
    dispatch(updateVisualTokens({ spacingUnit: value }));
  };

  const handleMarkdownChange = (val: string) => {
    setLocalMd(val);
    dispatch(updateMarkdownText(val));
  };

  const handleSyncMarkdown = () => {
    dispatch(syncMarkdownToTokens());
    setLastSavedMd(localMd);
  };

  if (!guide) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground/60 space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs">Loading design system...</span>
      </div>
    );
  }

  // Dynamic color resolution from colorSections swatches
  const primaryColor =
    guide.colorSections.find((s: ColorSection) => s.title === "Primary Colors")
      ?.swatches[0]?.hexColor || "#db2800";
  const bgColor =
    guide.colorSections.find((s: ColorSection) => s.title === "Primary Colors")
      ?.swatches[1]?.hexColor || "#faf8f5";
  const textColor =
    guide.colorSections.find(
      (s: ColorSection) => s.title === "Secondary & Accent Colors",
    )?.swatches[0]?.hexColor || "#2e2925";

  const successColor =
    guide.colorSections
      .find((s: ColorSection) => s.title === "Status & Feedback Colors")
      ?.swatches.find((sw: ColorSwatch) => sw.name === "Success")?.hexColor ||
    "#10B981";
  const warningColor =
    guide.colorSections
      .find((s: ColorSection) => s.title === "Status & Feedback Colors")
      ?.swatches.find((sw: ColorSwatch) => sw.name === "Warning")?.hexColor ||
    "#F59E0B";
  const errorColor =
    guide.colorSections
      .find((s: ColorSection) => s.title === "Status & Feedback Colors")
      ?.swatches.find((sw: ColorSwatch) => sw.name === "Error")?.hexColor ||
    "#EF4444";
  const infoColor =
    guide.colorSections
      .find((s: ColorSection) => s.title === "Status & Feedback Colors")
      ?.swatches.find((sw: ColorSwatch) => sw.name === "Info")?.hexColor ||
    "#3B82F6";

  const surfaceColor =
    guide.colorSections
      .find((s: ColorSection) => s.title === "UI Component Colors")
      ?.swatches.find((sw: ColorSwatch) => sw.name === "Surface Variant")
      ?.hexColor || "#ffffff";
  const mutedColor =
    guide.colorSections
      .find((s: ColorSection) => s.title === "UI Component Colors")
      ?.swatches.find((sw: ColorSwatch) => sw.name === "Muted Background")
      ?.hexColor || "#f4f4f5";
  const borderColor =
    guide.colorSections
      .find((s: ColorSection) => s.title === "UI Component Colors")
      ?.swatches.find((sw: ColorSwatch) => sw.name === "Border Color")
      ?.hexColor || "#e4e4e7";

  // Parse layout, border, opacity and shadows dynamically from frontmatter
  let yamlData: any = {};
  if (guide.designSystemDetails.designMd) {
    try {
      const yamlMatch = guide.designSystemDetails.designMd.match(
        /^---\r?\n([\s\S]*?)\r?\n---/,
      );
      if (yamlMatch) {
        yamlData = parseYAML(yamlMatch[1]) || {};
      }
    } catch (e) {
      console.warn("Failed to parse YAML in editor view:", e);
    }
  }

  const borderWidth =
    yamlData.borders?.width !== undefined
      ? parseInt(yamlData.borders.width, 10)
      : 1;
  const overlayOpacity =
    yamlData.opacity?.overlay !== undefined
      ? parseFloat(yamlData.opacity.overlay)
      : 0.5;

  const shadowSm = yamlData.shadows?.sm || "0 1px 2px rgba(0,0,0,0.05)";
  const shadowMd = yamlData.shadows?.md || "0 4px 6px rgba(0,0,0,0.07)";
  const shadowLg = yamlData.shadows?.lg || "0 10px 15px rgba(0,0,0,0.1)";
  const shadowXl = yamlData.shadows?.xl || "0 20px 25px rgba(0,0,0,0.15)";

  const headingFont =
    guide.typographySections[0]?.styles[0]?.fontFamily || "Host Grotesk";
  const bodyFont =
    guide.typographySections[1]?.styles[0]?.fontFamily || "DM Sans";

  // Contrast Calculations
  const textOnBgContrast = checkContrast(textColor, bgColor);
  const primaryOnBgContrast = checkContrast(primaryColor, bgColor);
  const whiteOnPrimaryContrast = checkContrast("#ffffff", primaryColor);

  resolvedColorsRef.current = {
    primaryColor,
    bgColor,
    textColor,
    successColor,
    warningColor,
    errorColor,
    infoColor,
    surfaceColor,
    mutedColor,
    borderColor,
    borderWidth,
    overlayOpacity,
    headingFont,
    bodyFont,
    cardRadius: guide.designSystemDetails.cardRadius,
    buttonRadius: guide.designSystemDetails.buttonRadius,
    spacingUnit: guide.designSystemDetails.spacingUnit,
    shadowSM: shadowSm,
    shadowMD: shadowMd,
    shadowLG: shadowLg,
    shadowXL: shadowXl,
  };

  const renderContrastBadge = (contrast: {
    ratio: number;
    level: "AAA" | "AA" | "Fail";
    isValid: boolean;
  }) => {
    const bgClass = contrast.isValid
      ? contrast.level === "AAA"
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";

    return (
      <span
        className={`text-xs px-2 py-0.5 font-semibold font-mono rounded border flex items-center gap-1 ${bgClass}`}
      >
        {contrast.isValid ? (
          <ShieldCheck className="size-3 shrink-0 text-emerald-500" />
        ) : (
          <AlertTriangle className="size-3 shrink-0 text-rose-500 animate-pulse" />
        )}
        {contrast.ratio}:1 ({contrast.level})
      </span>
    );
  };

  // Renders the visual editor panel
  const renderVisualEditor = () => (
    <div className="space-y-6">
      {/* AI Theme Generator */}
      <div className="p-4 bg-linear-to-br from-violet-500/5 to-fuchsia-500/5 border border-violet-500/20 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Wand2 className="size-4 text-violet-500" />
          <h3 className="font-heading font-bold text-xs text-foreground/90 uppercase tracking-widest">
            AI Theme Generator
          </h3>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerateTheme()}
            placeholder='e.g. "cyberpunk neon dashboard"'
            className="flex-1 px-3 py-1.5 text-xs bg-background border border-sidebar-border/60 rounded-lg outline-none focus:border-violet-500/50 text-foreground placeholder:text-muted-foreground/50"
            disabled={isGeneratingTheme}
          />
          <Button
            size="sm"
            onClick={handleGenerateTheme}
            disabled={isGeneratingTheme || !aiPrompt.trim()}
            className="h-8 px-4 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isGeneratingTheme ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Retheme All Screens */}
      <button
        type="button"
        onClick={handleRethemeAll}
        disabled={isRethemeing}
        className="w-full py-2.5 rounded-xl text-xs font-bold border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isRethemeing ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Rethemeing {rethemeProgress.current}/{rethemeProgress.total}...
          </>
        ) : (
          <>
            <RefreshCw className="w-3.5 h-3.5" />
            Retheme All Screens
          </>
        )}
      </button>

      {/* Colors Section */}
      <div className="p-4 bg-card border border-sidebar-border/30 rounded-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-sidebar-border/20">
          <Palette className="size-4 text-primary" />
          <h3 className="font-heading font-bold text-xs text-foreground uppercase tracking-widest">
            Core Colors
          </h3>
        </div>
        <div className="space-y-3.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground/80 block">
                  Primary Color
                </span>
                <span className="text-xs text-muted-foreground block">
                  Buttons, active states
                </span>
              </div>
              <div className="flex items-center gap-2">
                {renderContrastBadge(whiteOnPrimaryContrast)}
                <span className="text-xs font-mono text-muted-foreground uppercase">
                  {primaryColor}
                </span>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) =>
                    handleColorChange("primary", e.target.value, primaryColor)
                  }
                  className="w-8 h-8 cursor-pointer rounded-full overflow-hidden border border-sidebar-border/50 bg-transparent"
                />
              </div>
            </div>
            {!whiteOnPrimaryContrast.isValid && (
              <span className="text-xs text-rose-500 leading-normal flex items-center gap-1">
                <TriangleAlert className="size-3 text-rose-500" /> White text on
                primary button:{" "}
                {getContrastRecommendation("#ffffff", primaryColor)}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground/80 block">
                  Background Color
                </span>
                <span className="text-xs text-muted-foreground block">
                  App background color
                </span>
              </div>
              <div className="flex items-center gap-2">
                {renderContrastBadge(primaryOnBgContrast)}
                <span className="text-xs font-mono text-muted-foreground uppercase">
                  {bgColor}
                </span>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) =>
                    handleColorChange("bg", e.target.value, bgColor)
                  }
                  className="w-8 h-8 cursor-pointer rounded-full overflow-hidden border border-sidebar-border/50 bg-transparent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-foreground/80 block">
                  Text Color
                </span>
                <span className="text-xs text-muted-foreground block">
                  Primary dark font color
                </span>
              </div>
              <div className="flex items-center gap-2">
                {renderContrastBadge(textOnBgContrast)}
                <span className="text-xs font-mono text-muted-foreground uppercase">
                  {textColor}
                </span>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) =>
                    handleColorChange("text", e.target.value, textColor)
                  }
                  className="w-8 h-8 cursor-pointer rounded-full overflow-hidden border border-sidebar-border/50 bg-transparent"
                />
              </div>
            </div>
            {!textOnBgContrast.isValid && (
              <span className="text-xs text-rose-500 leading-normal flex items-center gap-1">
                <TriangleAlert className="size-3 text-rose-500" /> Text on
                Background: {getContrastRecommendation(textColor, bgColor)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Semantic Colors Section */}
      <div className="p-4 bg-card border border-sidebar-border/30 rounded-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-sidebar-border/20">
          <Palette className="size-4 text-primary" />
          <h3 className="font-heading font-bold text-xs text-foreground uppercase tracking-widest">
            Semantic Colors
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-foreground/80 block">
                Success
              </span>
              <span className="text-xs text-muted-foreground block">
                Success alerts & badges
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase">
                {successColor}
              </span>
              <input
                type="color"
                value={successColor}
                onChange={(e) =>
                  handleSemanticColorChange(
                    "success",
                    e.target.value,
                    successColor,
                  )
                }
                className="w-8 h-8 cursor-pointer rounded-full overflow-hidden border border-sidebar-border/50 bg-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-foreground/80 block">
                Warning
              </span>
              <span className="text-xs text-muted-foreground block">
                Warnings & pending states
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase">
                {warningColor}
              </span>
              <input
                type="color"
                value={warningColor}
                onChange={(e) =>
                  handleSemanticColorChange(
                    "warning",
                    e.target.value,
                    warningColor,
                  )
                }
                className="w-8 h-8 cursor-pointer rounded-full overflow-hidden border border-sidebar-border/50 bg-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-foreground/80 block">
                Error
              </span>
              <span className="text-xs text-muted-foreground block">
                Errors & critical alerts
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase">
                {errorColor}
              </span>
              <input
                type="color"
                value={errorColor}
                onChange={(e) =>
                  handleSemanticColorChange("error", e.target.value, errorColor)
                }
                className="w-8 h-8 cursor-pointer rounded-full overflow-hidden border border-sidebar-border/50 bg-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-foreground/80 block">
                Info
              </span>
              <span className="text-xs text-muted-foreground block">
                Information alerts & highlights
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase">
                {infoColor}
              </span>
              <input
                type="color"
                value={infoColor}
                onChange={(e) =>
                  handleSemanticColorChange("info", e.target.value, infoColor)
                }
                className="w-8 h-8 cursor-pointer rounded-full overflow-hidden border border-sidebar-border/50 bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Surface & Borders Section */}
      <div className="p-4 bg-card border border-sidebar-border/30 rounded-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-sidebar-border/20">
          <Layers className="size-4 text-primary" />
          <h3 className="font-heading font-bold text-xs text-foreground uppercase tracking-widest">
            Surface & Borders
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-foreground/80 block">
                Surface Variant
              </span>
              <span className="text-xs text-muted-foreground block">
                Cards, side panels
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase">
                {surfaceColor}
              </span>
              <input
                type="color"
                value={surfaceColor}
                onChange={(e) =>
                  handleSurfaceBorderChange(
                    "surface",
                    e.target.value,
                    surfaceColor,
                  )
                }
                className="w-8 h-8 cursor-pointer rounded-full overflow-hidden border border-sidebar-border/50 bg-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-foreground/80 block">
                Muted Background
              </span>
              <span className="text-xs text-muted-foreground block">
                Disabled items, gray bg
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase">
                {mutedColor}
              </span>
              <input
                type="color"
                value={mutedColor}
                onChange={(e) =>
                  handleSurfaceBorderChange("muted", e.target.value, mutedColor)
                }
                className="w-8 h-8 cursor-pointer rounded-full overflow-hidden border border-sidebar-border/50 bg-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-foreground/80 block">
                Border Color
              </span>
              <span className="text-xs text-muted-foreground block">
                Dividers, card outline
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase">
                {borderColor}
              </span>
              <input
                type="color"
                value={borderColor}
                onChange={(e) =>
                  handleSurfaceBorderChange(
                    "border",
                    e.target.value,
                    borderColor,
                  )
                }
                className="w-8 h-8 cursor-pointer rounded-full overflow-hidden border border-sidebar-border/50 bg-transparent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground/80">
              <span>Border Width</span>
              <span className="font-mono text-xs text-muted-foreground">
                {borderWidth}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={borderWidth}
              onChange={(e) =>
                handleSurfaceBorderChange("width", parseInt(e.target.value, 10))
              }
              className="w-full accent-primary cursor-pointer h-1 rounded-lg bg-sidebar-border/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground/80">
              <span>Overlay Opacity</span>
              <span className="font-mono text-xs text-muted-foreground">
                {Math.round(overlayOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={overlayOpacity}
              onChange={(e) =>
                handleSurfaceBorderChange("opacity", parseFloat(e.target.value))
              }
              className="w-full accent-primary cursor-pointer h-1 rounded-lg bg-sidebar-border/50"
            />
          </div>
        </div>
      </div>

      {/* Typography Section */}
      <div className="p-4 bg-card border border-sidebar-border/30 rounded-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-sidebar-border/20">
          <Type className="size-4 text-primary" />
          <h3 className="font-heading font-bold text-xs text-foreground uppercase tracking-widest">
            Typography
          </h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80 block">
              Headline Font
            </label>
            <select
              value={headingFont}
              onChange={(e) => handleFontChange("heading", e.target.value)}
              className="w-full text-sm p-2 rounded-lg bg-sidebar border border-sidebar-border/60 text-foreground outline-none focus:border-primary/50 cursor-pointer"
            >
              {GOOGLE_FONTS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80 block">
              Body Font
            </label>
            <select
              value={bodyFont}
              onChange={(e) => handleFontChange("body", e.target.value)}
              className="w-full text-sm p-2 rounded-lg bg-sidebar border border-sidebar-border/60 text-foreground outline-none focus:border-primary/50 cursor-pointer"
            >
              {GOOGLE_FONTS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Radii & Spacing Section */}
      <div className="p-4 bg-card border border-sidebar-border/30 rounded-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-sidebar-border/20">
          <Sliders className="size-4 text-primary" />
          <h3 className="font-heading font-bold text-xs text-foreground uppercase tracking-widest">
            Layout Shapes
          </h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground/80">
              <span>Card Corners</span>
              <span className="font-mono text-xs text-muted-foreground">
                {guide.designSystemDetails.cardRadius}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              value={guide.designSystemDetails.cardRadius}
              onChange={(e) =>
                handleRadiusChange("card", parseInt(e.target.value, 10))
              }
              className="w-full accent-primary cursor-pointer h-1 rounded-lg bg-sidebar-border/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground/80">
              <span>Button Corners</span>
              <span className="font-mono text-xs text-muted-foreground">
                {guide.designSystemDetails.buttonRadius >= 32
                  ? "Full"
                  : `${guide.designSystemDetails.buttonRadius}px`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              value={
                guide.designSystemDetails.buttonRadius > 32
                  ? 32
                  : guide.designSystemDetails.buttonRadius
              }
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                handleRadiusChange("button", val === 32 ? 9999 : val);
              }}
              className="w-full accent-primary cursor-pointer h-1 rounded-lg bg-sidebar-border/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground/80">
              <span>Minimal Spacing</span>
              <span className="font-mono text-xs text-muted-foreground">
                {guide.designSystemDetails.spacingUnit}px
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="32"
              value={guide.designSystemDetails.spacingUnit}
              onChange={(e) =>
                handleSpacingChange(parseInt(e.target.value, 10))
              }
              className="w-full accent-primary cursor-pointer h-1 rounded-lg bg-sidebar-border/50"
            />
          </div>
        </div>
      </div>

      {/* Elevation Section */}
      <div className="p-4 bg-card border border-sidebar-border/30 rounded-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-sidebar-border/20">
          <FileCode className="size-4 text-primary" />
          <h3 className="font-heading font-bold text-xs text-foreground uppercase tracking-widest">
            Elevation (Shadows)
          </h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80 block">
              Small Shadow
            </label>
            <input
              type="text"
              value={shadowSm}
              onChange={(e) => handleShadowChange("sm", e.target.value)}
              className="w-full text-xs font-mono p-2 rounded-lg bg-sidebar border border-sidebar-border/60 text-foreground outline-none focus:border-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80 block">
              Medium Shadow
            </label>
            <input
              type="text"
              value={shadowMd}
              onChange={(e) => handleShadowChange("md", e.target.value)}
              className="w-full text-xs font-mono p-2 rounded-lg bg-sidebar border border-sidebar-border/60 text-foreground outline-none focus:border-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80 block">
              Large Shadow
            </label>
            <input
              type="text"
              value={shadowLg}
              onChange={(e) => handleShadowChange("lg", e.target.value)}
              className="w-full text-xs font-mono p-2 rounded-lg bg-sidebar border border-sidebar-border/60 text-foreground outline-none focus:border-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80 block">
              Extra Large Shadow
            </label>
            <input
              type="text"
              value={shadowXl}
              onChange={(e) => handleShadowChange("xl", e.target.value)}
              className="w-full text-xs font-mono p-2 rounded-lg bg-sidebar border border-sidebar-border/60 text-foreground outline-none focus:border-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Version History Section */}
      <div className="p-4 bg-card border border-sidebar-border/30 rounded-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-sidebar-border/20">
          <History className="size-4 text-primary" />
          <h3 className="font-heading font-bold text-xs text-foreground uppercase tracking-widest">
            Version History
          </h3>
          <span className="ml-auto text-xs text-muted-foreground font-semibold">
            {snapshots.length}/20
          </span>
        </div>

        {/* Save Current */}
        <div className="flex gap-2">
          <input
            type="text"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && snapshotName.trim()) {
                dispatch(saveSnapshot(snapshotName.trim()));
                setSnapshotName("");
                toast.success("Snapshot saved!");
              }
            }}
            placeholder="Snapshot name..."
            className="flex-1 px-3 py-1.5 text-xs bg-background border border-sidebar-border/60 rounded-lg outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
          />
          <Button
            size="sm"
            onClick={() => {
              dispatch(
                saveSnapshot(snapshotName.trim() || `v${snapshots.length + 1}`),
              );
              setSnapshotName("");
              toast.success("Snapshot saved!");
            }}
            className="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-xs cursor-pointer shrink-0"
          >
            Save
          </Button>
        </div>

        {/* Snapshot List */}
        {snapshots.length > 0 ? (
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border/40">
            {snapshots.map((snap: StyleGuideSnapshot) => {
              const timeAgo = (() => {
                const diff = Date.now() - snap.timestamp;
                const mins = Math.floor(diff / 60000);
                if (mins < 1) return "just now";
                if (mins < 60) return `${mins}m ago`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs}h ago`;
                return `${Math.floor(hrs / 24)}d ago`;
              })();
              return (
                <div
                  key={snap.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-sidebar/50 border border-sidebar-border/20 hover:border-sidebar-border/40 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground/90 truncate">
                      {snap.name}
                    </div>
                    <div className="text-xs capitalize text-muted-foreground/80">
                      {timeAgo}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(restoreSnapshot(snap.id));
                      toast.success(`Restored "${snap.name}"`);
                    }}
                    className="p-1 rounded hover:bg-primary/10 text-primary/70 hover:text-primary transition-colors cursor-pointer"
                    title="Restore this snapshot"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch(deleteSnapshot(snap.id))}
                    className="p-1 rounded hover:bg-rose-500/10 text-muted-foreground/40 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Delete this snapshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground/50 text-center py-3">
            No snapshots yet. Save one to track your theme history.
          </div>
        )}
      </div>
    </div>
  );

  // Renders the markdown editor textarea
  const renderMarkdownEditor = () => (
    <div className="h-full flex flex-col space-y-2 min-h-0">
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 text-primary" />
        <h3 className="font-heading font-semibold text-xs text-foreground uppercase tracking-wider">
          DESIGN.md
        </h3>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <textarea
          value={localMd}
          onChange={(e) => handleMarkdownChange(e.target.value)}
          placeholder="Paste your DESIGN.md in markdown format."
          className="grow w-full resize-none p-4 text-[13px] font-mono leading-relaxed bg-card border border-sidebar-border/60 rounded-xl outline-none focus:border-primary/50 text-foreground min-h-0"
        />
      </div>

      {localMd !== guide.designSystemDetails.designMd && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between gap-3">
          <span className="text-xs text-primary font-semibold leading-normal">
            DESIGN.md edited. Sync changes to update visual controls & mockup.
          </span>
          <Button
            size="sm"
            onClick={handleSyncMarkdown}
            className="h-8 px-4 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-lg shadow-xs cursor-pointer shrink-0"
          >
            Sync Visual
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-background">
      {/* Mac-style Window Header Bar & Autosave Status */}
      <div className="flex items-center justify-between px-6 bg-card py-3 border-b border-sidebar-border/60 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-[#ff5f56]" />
          <div className="size-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="size-2.5 rounded-full bg-[#27c93f]" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 font-semibold">
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Content panel: Split Screen Only */}
      <div className="grow grid grid-cols-2 gap-6 p-5 min-h-0 overflow-hidden h-full">
        {/* Left Side: Visual Editor (scrollable) */}
        <div className="h-full overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-border/40">
          {renderVisualEditor()}
        </div>

        {/* Right Side: Markdown Editor (independent scrolling) */}
        <div className="h-full flex flex-col min-h-0">
          {renderMarkdownEditor()}
        </div>
      </div>
    </div>
  );
}
