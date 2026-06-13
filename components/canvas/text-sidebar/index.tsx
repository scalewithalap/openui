"use client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";

import { cn } from "@/lib/utils";
import { TextShape, updateShape } from "@/redux/slice/shapes";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { Label } from "@radix-ui/react-label";
import { Bold, Italic, Palette, Strikethrough, Underline } from "lucide-react";
import React from "react";
import { googleFonts, loadGoogleFont } from "@/lib/font-loader";

type Props = {
  isOpen: boolean;
};

const TextSidebar = ({ isOpen }: Props) => {
  const dispatch = useAppDispatch();
  const selectedShapes = useAppSelector((state) => state.shapes.selected);
  const shapesEntities = useAppSelector(
    (state) => state.shapes.shapes.entities,
  );

  const fontFamilies = [
    "Arial, sans-serif",
    "Helvetica, sans-serif",
    "Georgia, serif",
    "Times New Roman, serif",
    "Courier New, monospace",
    "Monaco, monospace",
    "system-ui, sans-serif",
    ...googleFonts.map((f) => f.cssValue),
  ];

  const selectedTextShape = Object.keys(selectedShapes)
    .map((id) => shapesEntities[id])
    .find((shape) => shape?.type === "text") as TextShape | undefined;

  const [colorInput, setColorInput] = React.useState(
    selectedTextShape?.fill || "#ffffff",
  );

  // Load Google Fonts stylesheets dynamically when the sidebar opens
  React.useEffect(() => {
    if (isOpen) {
      googleFonts.forEach((font) => {
        loadGoogleFont(font.cssValue);
      });
    }
  }, [isOpen]);

  const currentFillRef = React.useRef(selectedTextShape?.fill || "#ffffff");
  currentFillRef.current = selectedTextShape?.fill || "#ffffff";

  // Sync color input state with selected text shape color changes
  React.useEffect(() => {
    if (selectedTextShape) {
      setColorInput(selectedTextShape.fill || "#ffffff");
    }
  }, [selectedTextShape?.id, selectedTextShape?.fill]);

  // Add type safety for selectedTextShape access
  if (!selectedTextShape) return null;

  const updateTextProperty = (property: keyof TextShape, value: any) => {
    if (!selectedTextShape) return;

    dispatch(
      updateShape({
        id: selectedTextShape.id,
        patch: { [property]: value },
      }),
    );
  };

  // Handle color change with validation
  const handleColorChange = (color: string) => {
    setColorInput(color);
    if (/^#([0-9A-F]{6})$/i.test(color) || /^#([0-9A-F]{3})$/i.test(color)) {
      updateTextProperty("fill", color);
    }
  };

  //if (!isOpen || !selectedTextShape) return null;
  return (
    <div
      className={cn(
        "z-60 fixed right-5 top-1/2 transform -translate-y-1/2 w-80 bg-card/95 border border-border shadow-2xl shadow-black/30 gap-2 p-3 rounded-lg transition-transform duration-300 backdrop-blur-md",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="p-4 flex flex-col gap-5 overflow-y-auto h-[calc(100vh-12rem)]">
        <div className="space-y-2">
          <Label className="text-foreground/80 font-medium">Font Family</Label>
          <Select
            value={selectedTextShape?.fontFamily}
            onValueChange={(value) => updateTextProperty("fontFamily", value)}
          >
            <SelectTrigger className="bg-background border-border w-full text-foreground hover:bg-muted/50 transition">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60 overflow-y-auto">
              {fontFamilies.map((font) => (
                <SelectItem
                  key={font}
                  value={font}
                  className="text-foreground hover:bg-accent focus:bg-accent focus:text-accent-foreground cursor-pointer"
                >
                  <span style={{ fontFamily: font }}>{font.split(",")[0]}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground/80 font-medium">
            Font Size: {selectedTextShape?.fontSize}px
          </Label>
          <Slider
            value={[selectedTextShape?.fontSize]}
            onValueChange={([value]) => updateTextProperty("fontSize", value)}
            min={8}
            max={128}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground/80 font-medium">
            Font Weight: {selectedTextShape?.fontWeight}
          </Label>
          <Slider
            value={[selectedTextShape?.fontWeight]}
            onValueChange={([value]) => updateTextProperty("fontWeight", value)}
            min={100}
            max={900}
            step={100}
            className="w-full"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-foreground/80 font-medium">Font Style</Label>
          <div className="flex gap-2">
            <Toggle
              pressed={selectedTextShape.fontWeight >= 600}
              onPressedChange={(pressed) =>
                updateTextProperty("fontWeight", pressed ? 700 : 400)
              }
              variant="outline"
              className="h-9 w-9 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground cursor-pointer"
            >
              <Bold className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={selectedTextShape.fontStyle === "italic"}
              onPressedChange={(pressed) =>
                updateTextProperty("fontStyle", pressed ? "italic" : "normal")
              }
              variant="outline"
              className="h-9 w-9 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground cursor-pointer"
            >
              <Italic className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={selectedTextShape.textDecoration === "underline"}
              onPressedChange={(pressed) =>
                updateTextProperty(
                  "textDecoration",
                  pressed ? "underline" : "none",
                )
              }
              variant="outline"
              className="h-9 w-9 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground cursor-pointer"
            >
              <Underline className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={selectedTextShape.textDecoration === "line-through"}
              onPressedChange={(pressed) =>
                updateTextProperty(
                  "textDecoration",
                  pressed ? "line-through" : "none",
                )
              }
              variant="outline"
              className="h-9 w-9 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground cursor-pointer"
            >
              <Strikethrough className="w-4 h-4" />
            </Toggle>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground/80 font-medium">
            Letter Spacing: {selectedTextShape.letterSpacing}px
          </Label>
          <Slider
            value={[selectedTextShape.letterSpacing]}
            onValueChange={([value]) =>
              updateTextProperty("letterSpacing", value)
            }
            min={-2}
            max={10}
            step={0.1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground/80 flex items-center gap-2 font-medium">
            <Palette className="w-4 h-4" />
            TextColor
          </Label>
          <div className="flex gap-2">
            <Input
              value={colorInput}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="#ffffff"
              className="bg-background border-border text-foreground flex-1 hover:border-border/80 focus:border-primary"
            />
            <div
              className="relative w-10 h-10 rounded border border-border cursor-pointer overflow-hidden shadow-xs hover:border-border/80"
              style={{ backgroundColor: selectedTextShape.fill || "#ffffff" }}
            >
              <input
                type="color"
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                value={selectedTextShape.fill || "#ffffff"}
                onChange={(e) => {
                  const color = e.target.value;
                  if (color === currentFillRef.current) return;
                  setColorInput(color);
                  updateTextProperty("fill", color);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextSidebar;
