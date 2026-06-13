"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Smartphone,
  Tablet,
  Laptop,
  RefreshCw,
  Sparkles,
  Check,
  X,
  Layers,
  Gauge,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type InspirationImage = {
  id: string;
  url: string;
};

type GeneratorDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    prompt: string,
    deviceType: string,
    includeDrawing: boolean,
    selectedImageIds: string[],
    variantCount: number,
    creativeRange: number,
  ) => void;
  hasDrawings: boolean;
  projectId: string;
};

// Style Word Bank — curated design keywords inspired by Google Stitch's Redesign mode
const STYLE_CATEGORIES = [
  {
    label: "Layout",
    pills: [
      "Bento Grid",
      "Editorial",
      "Swiss Style",
      "Split-Screen",
      "Card Stack",
      "Magazine",
    ],
  },
  {
    label: "Texture",
    pills: [
      "Glassmorphism",
      "Claymorphism",
      "Skeuomorphic",
      "Neumorphism",
      "Flat",
      "Grainy",
    ],
  },
  {
    label: "Atmosphere",
    pills: [
      "Brutalist",
      "Cyberpunk",
      "Y2K",
      "Retro-Futurism",
      "Minimalist",
      "Corporate",
    ],
  },
  {
    label: "Color",
    pills: [
      "Duotone",
      "Monochromatic",
      "Pastel",
      "Dark Mode OLED",
      "Neon",
      "Earth Tones",
    ],
  },
];

export function GeneratorDialog({
  isOpen,
  onClose,
  onSubmit,
  hasDrawings,
  projectId,
}: GeneratorDialogProps) {
  const [idea, setIdea] = useState("");
  const [content, setContent] = useState("");
  const [selectedPills, setSelectedPills] = useState<string[]>([]);
  const [deviceType, setDeviceType] = useState<string>("custom");
  const [includeDrawing, setIncludeDrawing] = useState(hasDrawings);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [inspirationImages, setInspirationImages] = useState<
    InspirationImage[]
  >([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [variantCount, setVariantCount] = useState(1);
  const [creativeRange, setCreativeRange] = useState(1.0);

  // Sync includeDrawing when hasDrawings changes
  useEffect(() => {
    setIncludeDrawing(hasDrawings);
  }, [hasDrawings]);

  // Load project inspiration images
  useEffect(() => {
    if (!isOpen || !projectId) return;

    async function loadInspiration() {
      setIsLoadingImages(true);
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          const serverImages = (data.inspirationImages || []).map(
            (img: any) => ({
              id: img.id,
              url: `/api/uploads/${img.filePath}`,
            }),
          );
          setInspirationImages(serverImages);
          // Select all images by default
          setSelectedImageIds(serverImages.map((img: any) => img.id));
        }
      } catch (err) {
        console.error("Failed to load reference images for dialog:", err);
      } finally {
        setIsLoadingImages(false);
      }
    }

    loadInspiration();
  }, [isOpen, projectId]);

  const handleToggleImage = (id: string) => {
    setSelectedImageIds((prev) =>
      prev.includes(id) ? prev.filter((imgId) => imgId !== id) : [...prev, id],
    );
  };

  const handleTogglePill = (pill: string) => {
    setSelectedPills((prev) =>
      prev.includes(pill) ? prev.filter((p) => p !== pill) : [...prev, pill],
    );
  };

  const handleGenerate = () => {
    // Combine structured fields into a single prompt string
    const parts: string[] = [];

    if (idea.trim()) {
      parts.push(idea.trim());
    }

    if (content.trim()) {
      parts.push(`Content: ${content.trim()}`);
    }

    if (selectedPills.length > 0) {
      parts.push(`Style: ${selectedPills.join(", ")}`);
    }

    const combinedPrompt = parts.join(". ");
    onSubmit(
      combinedPrompt,
      deviceType,
      includeDrawing,
      selectedImageIds,
      variantCount,
      creativeRange,
    );
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className="z-100 min-w-2xl bg-background border-border text-foreground shadow-2xl rounded-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-foreground text-lg font-bold">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            AI Mockup Generator
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-2">
          <div className="space-y-5 my-4">
            {/* Idea field */}
            <div className="space-y-2">
              <Label
                htmlFor="idea"
                className="text-xs font-semibold text-muted-foreground"
              >
                What are you building? <span className="text-amber-500">*</span>
              </Label>
              <Input
                id="idea"
                placeholder="e.g. A premium fitness tracking dashboard..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                className="bg-muted/20 border-border focus-visible:ring-amber-500/50 text-sm text-foreground placeholder-muted-foreground rounded-xl"
              />
            </div>

            {/* Content field */}
            <div className="space-y-2">
              <Label
                htmlFor="content"
                className="text-xs font-semibold text-muted-foreground"
              >
                Content details{" "}
                <span className="text-muted-foreground/60 text-[10px] font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="content"
                placeholder="Describe specific sections, data, or copy (e.g. a line graph showing weekly calories, a list of recent workouts, a motivational quote banner)..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[70px] bg-muted/20 border-border focus-visible:ring-amber-500/50 text-sm text-foreground placeholder-muted-foreground rounded-xl resize-none"
              />
            </div>

            {/* Style Word Bank */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Style Word Bank
                </Label>
                {selectedPills.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPills([])}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>
              <div className="space-y-2.5">
                {STYLE_CATEGORIES.map((category) => (
                  <div key={category.label} className="space-y-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                      {category.label}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {category.pills.map((pill) => {
                        const isSelected = selectedPills.includes(pill);
                        return (
                          <button
                            key={pill}
                            type="button"
                            onClick={() => handleTogglePill(pill)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer",
                              isSelected
                                ? "border-amber-500/60 bg-amber-500/15 text-amber-500 dark:text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                                : "border-border bg-muted/20 text-muted-foreground hover:border-border/80 hover:text-foreground hover:bg-muted/40",
                            )}
                          >
                            {pill}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Preset selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                Target Screen Size
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    id: "custom",
                    label: "Custom",
                    sub: "Frame Size",
                    icon: <RefreshCw className="w-3.5 h-3.5" />,
                  },
                  {
                    id: "mobile",
                    label: "Mobile",
                    sub: "375 x 812",
                    icon: <Smartphone className="w-3.5 h-3.5" />,
                  },
                  {
                    id: "tablet",
                    label: "Tablet",
                    sub: "768 x 1024",
                    icon: <Tablet className="w-3.5 h-3.5" />,
                  },
                  {
                    id: "web",
                    label: "Web",
                    sub: "1600 x 900",
                    icon: <Laptop className="w-3.5 h-3.5" />,
                  },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setDeviceType(preset.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                      deviceType === preset.id
                        ? "border-amber-500/80 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
                        : "border-border bg-muted/20 text-muted-foreground hover:border-border/80 hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {preset.icon}
                    <span className="text-xs mt-1.5 leading-tight">
                      {preset.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground mt-0.5 leading-none">
                      {preset.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Variants & Creative Range */}
            <div className="space-y-3 bg-muted/10 border border-border/80 p-3.5 rounded-xl">
              {/* Variant Count */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Variants
                  </Label>
                  <span className="text-[10px] text-muted-foreground/70 ml-auto">
                    Generate {variantCount} design{variantCount > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setVariantCount(n)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 cursor-pointer",
                        variantCount === n
                          ? "border-amber-500/60 bg-amber-500/15 text-amber-500 dark:text-amber-400"
                          : "border-border bg-muted/20 text-muted-foreground hover:border-border/80 hover:text-foreground",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Creative Range */}
              {variantCount > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Creative Range
                    </Label>
                  </div>
                  <Slider
                    value={[creativeRange]}
                    onValueChange={([val]) => setCreativeRange(val)}
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground/75 font-medium px-0.5">
                    <span
                      className={creativeRange <= 0.7 ? "text-amber-500" : ""}
                    >
                      Refined
                    </span>
                    <span
                      className={
                        creativeRange > 0.7 && creativeRange <= 1.2
                          ? "text-amber-500"
                          : ""
                      }
                    >
                      Balanced
                    </span>
                    <span
                      className={creativeRange > 1.2 ? "text-amber-500" : ""}
                    >
                      Creative
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sketch toggle (only if has drawings) */}
            {hasDrawings && (
              <div className="flex items-center space-x-2 bg-muted/10 border border-border/80 p-3 rounded-xl">
                <Checkbox
                  id="sketch-toggle"
                  checked={includeDrawing}
                  onCheckedChange={(checked) => setIncludeDrawing(!!checked)}
                  className="border-border text-amber-600 focus-visible:ring-amber-500/50 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="sketch-toggle"
                    className="text-xs font-medium text-foreground leading-none cursor-pointer"
                  >
                    Include hand-drawn layout context
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    Sends the sketch inside the frame to guide the visual
                    structure.
                  </p>
                </div>
              </div>
            )}

            {/* Inspiration / Design reference selection */}
            {inspirationImages.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Design References ({selectedImageIds.length}/
                  {inspirationImages.length})
                </Label>
                <div className="flex gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-muted/30">
                  {inspirationImages.map((image) => {
                    const isSelected = selectedImageIds.includes(image.id);
                    return (
                      <div
                        key={image.id}
                        onClick={() => handleToggleImage(image.id)}
                        className={`relative aspect-square w-16 h-16 rounded-lg overflow-hidden border cursor-pointer shrink-0 transition-all duration-200 ${
                          isSelected
                            ? "border-amber-500 ring-2 ring-amber-500/30"
                            : "border-border opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={image.url}
                          alt="Design reference"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="bg-amber-500 rounded-full p-0.5">
                              <Check className="w-3 h-3 text-zinc-950 font-bold" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 pt-4 flex gap-2 border-t border-border/80">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl border border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!idea.trim() && !hasDrawings}
            className="rounded-xl bg-amber-500 text-amber-950 dark:text-zinc-950 hover:bg-amber-400 font-bold cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-1 fill-current" />
            Generate UI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
