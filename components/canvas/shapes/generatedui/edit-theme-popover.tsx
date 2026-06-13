"use client";
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LiquidGlassButton } from "@/components/buttons/liquid-glass";
import { Paintbrush, Check, Layers, FileDown, FileUp } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import {
  updateVisualTokens,
  generateMarkdownFromGuide,
  parseMarkdownToGuide,
  loadStyleGuideSuccess,
} from "@/redux/slice/style-guide";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/frame-snapshot";
import { themePresets } from "@/lib/theme-presets";
import { hexToRgb, relativeLuminance } from "@/lib/contrast";

const ACCENT_PRESETS = [
  { name: "Coral", color: "#db2800" },
  { name: "Amber", color: "#F59E0B" },
  { name: "Rose", color: "#F43F5E" },
  { name: "Blue", color: "#3B82F6" },
  { name: "Emerald", color: "#10B981" },
  { name: "Violet", color: "#8B5CF6" },
  { name: "Cyan", color: "#06B6D4" },
  { name: "Fuchsia", color: "#D946EF" },
];

const RADIUS_PRESETS = [
  { label: "Sharp", value: 4 },
  { label: "Soft", value: 8 },
  { label: "Round", value: 16 },
  { label: "Full", value: 9999 },
];

const FONT_PAIRS = [
  { label: "Minimal", heading: "Host Grotesk", body: "DM Sans" },
  { label: "Modern", heading: "Inter", body: "DM Sans" },
  { label: "Elegant", heading: "Playfair Display", body: "Source Sans 3" },
  { label: "Friendly", heading: "Nunito", body: "Open Sans" },
  { label: "Technical", heading: "JetBrains Mono", body: "Inter" },
  { label: "Creative", heading: "Outfit", body: "Plus Jakarta Sans" },
  { label: "Classic", heading: "Merriweather", body: "Lato" },
  { label: "Bold", heading: "Space Grotesk", body: "Work Sans" },
];

export default function EditThemePopover() {
  const dispatch = useAppDispatch();
  const { guide } = useAppSelector((state) => state.styleGuide);

  const currentPrimary =
    guide?.colorSections[0]?.swatches[0]?.hexColor || "#db2800";
  const currentBg = guide?.colorSections[0]?.swatches[1]?.hexColor || "#faf8f5";
  const currentText =
    guide?.colorSections[1]?.swatches[0]?.hexColor || "#2e2925";
  const currentCardRadius = guide?.designSystemDetails?.cardRadius ?? 18;
  const currentHeadingFont =
    guide?.typographySections[0]?.styles[0]?.fontFamily || "Host Grotesk";
  const currentBodyFont =
    guide?.typographySections[1]?.styles[0]?.fontFamily || "DM Sans";

  const rgbBg = hexToRgb(currentBg);
  const isDarkMode = rgbBg ? relativeLuminance(rgbBg[0], rgbBg[1], rgbBg[2]) < 0.5 : false;

  const handleToggleDarkMode = (checked: boolean) => {
    if (checked) {
      // Switch to dark mode
      dispatch(
        updateVisualTokens({
          bgColor: "#121212",
          textColor: "#f5f5f5",
        }),
      );
    } else {
      // Switch to light mode
      dispatch(
        updateVisualTokens({
          bgColor: "#faf8f5",
          textColor: "#2e2925",
        }),
      );
    }
  };

  const handleAccentColor = (color: string) => {
    dispatch(updateVisualTokens({ primaryColor: color }));
  };

  const handleRadius = (value: number) => {
    dispatch(updateVisualTokens({ cardRadius: value }));
  };

  const handleFontPair = (heading: string, body: string) => {
    dispatch(updateVisualTokens({ headingFont: heading, bodyFont: body }));
  };

  const currentFontPair = FONT_PAIRS.find(
    (fp) => fp.heading === currentHeadingFont && fp.body === currentBodyFont,
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportDesignMd = () => {
    if (!guide) {
      toast.error("No design system to export.");
      return;
    }
    const markdown = generateMarkdownFromGuide(guide);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, "DESIGN.md");
    toast.success("DESIGN.md exported!");
  };

  const handleImportDesignMd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !guide) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        const updatedGuide = parseMarkdownToGuide(content, guide);
        dispatch(loadStyleGuideSuccess(updatedGuide));
        toast.success("DESIGN.md imported! Tokens updated.");
      } catch {
        toast.error("Failed to parse DESIGN.md. Check the format.");
      }
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-imported
    e.target.value = "";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <LiquidGlassButton
          size="sm"
          variant="subtle"
          style={{ pointerEvents: "auto" }}
          className="shadow-2xs scale-90"
        >
          <Paintbrush size={11} />
          Theme
        </LiquidGlassButton>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-72 bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl p-0 shadow-2xl"
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Quick Theme
            </h3>
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>

          {/* Theme Presets Gallery */}
          <div className="space-y-2">
            <Label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Presets
            </Label>
            <div className="grid grid-cols-2 gap-1.5 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {themePresets.map((preset) => {
                const presetPrimary =
                  preset.colorSections[0]?.swatches[0]?.hexColor || "#db2800";
                const presetBg =
                  preset.colorSections[0]?.swatches[1]?.hexColor || "#faf8f5";
                const presetText =
                  preset.colorSections[1]?.swatches[0]?.hexColor || "#2e2925";
                const presetFont =
                  preset.typographySections[0]?.styles[0]?.fontFamily ||
                  "Inter";
                const isActive = guide?.theme === preset.theme;
                return (
                  <button
                    key={preset.theme}
                    type="button"
                    onClick={() => {
                      dispatch(loadStyleGuideSuccess(preset));
                      toast.success(`Applied "${preset.theme}" preset!`);
                    }}
                    className={cn(
                      "p-2 rounded-lg border text-left transition-all duration-200 cursor-pointer relative",
                      isActive
                        ? "border-amber-500/60 bg-amber-500/10"
                        : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700",
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: presetPrimary }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: presetBg }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: presetText }}
                      />
                    </div>
                    <div
                      className={cn(
                        "text-[9px] font-bold truncate",
                        isActive ? "text-amber-400" : "text-zinc-300",
                      )}
                    >
                      {preset.theme}
                    </div>
                    <div className="text-[7px] text-zinc-600 truncate">
                      {presetFont}
                    </div>
                    {isActive && (
                      <Check className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-zinc-800/60" />

          {/* Light/Dark Toggle */}
          <div className="flex items-center justify-between py-1">
            <Label className="text-xs font-medium text-zinc-300">
              Dark mode
            </Label>
            <Switch
              checked={isDarkMode}
              onCheckedChange={handleToggleDarkMode}
              className="cursor-pointer data-[state=checked]:bg-amber-600"
            />
          </div>

          <hr className="border-zinc-800/60" />

          {/* Accent Color */}
          <div className="space-y-2">
            <Label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Accent Color
            </Label>
            <div className="flex gap-2 flex-wrap">
              {ACCENT_PRESETS.map((preset) => {
                const isActive =
                  currentPrimary.toUpperCase() === preset.color.toUpperCase();
                return (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => handleAccentColor(preset.color)}
                    title={preset.name}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all duration-200 cursor-pointer flex items-center justify-center",
                      isActive
                        ? "border-white scale-110 shadow-[0_0_10px_var(--accent-glow)]"
                        : "border-transparent hover:border-zinc-600 hover:scale-105",
                    )}
                    style={
                      {
                        backgroundColor: preset.color,
                        "--accent-glow": `${preset.color}60`,
                      } as React.CSSProperties
                    }
                  >
                    {isActive && (
                      <Check className="w-3 h-3 text-white drop-shadow-md" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-zinc-800/60" />

          {/* Corner Radius */}
          <div className="space-y-2">
            <Label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Corner Radius
            </Label>
            <div className="grid grid-cols-4 gap-1.5">
              {RADIUS_PRESETS.map((preset) => {
                const isActive = currentCardRadius === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleRadius(preset.value)}
                    className={cn(
                      "py-1.5 rounded-lg text-[10px] font-semibold border transition-all duration-200 cursor-pointer",
                      isActive
                        ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                        : "border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400",
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-zinc-800/60" />

          {/* Font Pair */}
          <div className="space-y-2">
            <Label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Font Pair
            </Label>
            <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {FONT_PAIRS.map((fp) => {
                const isActive =
                  fp.heading === currentHeadingFont &&
                  fp.body === currentBodyFont;
                return (
                  <button
                    key={fp.label}
                    type="button"
                    onClick={() => handleFontPair(fp.heading, fp.body)}
                    className={cn(
                      "p-2 rounded-lg border text-left transition-all duration-200 cursor-pointer",
                      isActive
                        ? "border-amber-500/60 bg-amber-500/10"
                        : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700",
                    )}
                  >
                    <div
                      className={cn(
                        "text-[10px] font-bold truncate",
                        isActive ? "text-amber-400" : "text-zinc-300",
                      )}
                    >
                      {fp.label}
                    </div>
                    <div className="text-[8px] text-zinc-600 truncate mt-0.5">
                      {fp.heading} + {fp.body}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-zinc-800/60" />

          {/* Apply to All */}
          <button
            type="button"
            onClick={async () => {
              try {
                const urlParams = new URLSearchParams(window.location.search);
                const projectId = urlParams.get("project");
                if (!projectId || !guide) {
                  toast.error("No project or style guide found.");
                  return;
                }

                // Save the current style guide to persist changes for all screens
                const response = await fetch(
                  `/api/projects/${projectId}/style-guide`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(guide),
                  },
                );

                if (response.ok) {
                  toast.success(
                    "Theme applied to all screens! Regenerating will use the updated tokens.",
                  );
                } else {
                  toast.error("Failed to save theme. Please try again.");
                }
              } catch {
                toast.error("Failed to apply theme.");
              }
            }}
            className="w-full py-2 rounded-lg text-xs font-bold border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Layers size={12} />
            Apply to All Screens
          </button>

          {/* DESIGN.md Import / Export */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleExportDesignMd}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
            >
              <FileDown size={11} />
              Export .md
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
            >
              <FileUp size={11} />
              Import .md
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt"
              onChange={handleImportDesignMd}
              className="hidden"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
