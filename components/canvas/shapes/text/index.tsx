import {
  TextShape,
  updateShape,
  removeShape,
  saveHistory,
} from "@/redux/slice/shapes";
import { useAppDispatch } from "@/redux/store";
import { useState, useRef, useEffect } from "react";
import { loadGoogleFont, getTextWidth } from "@/lib/font-loader";
import { cn } from "@/lib/utils";

export const Text = ({ shape }: { shape: TextShape }) => {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(shape.text === "Type here...");
  const [tempText, setTempText] = useState(shape.text);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Google Font dynamically when rendering this text shape
  useEffect(() => {
    if (shape.fontFamily) {
      loadGoogleFont(shape.fontFamily);
    }
  }, [shape.fontFamily]);

  // Calculate width dynamically in real-time
  const calculatedWidth =
    getTextWidth(
      isEditing ? tempText : shape.text,
      shape.fontSize,
      shape.fontFamily,
      shape.fontWeight,
      shape.fontStyle,
      shape.letterSpacing,
    ) + 16; // Add px-2 padding (16px total)

  // Auto-focus when text is newly created (placeholder text)
  useEffect(() => {
    if (shape.text === "Type here..." && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // Select all placeholder text
      setIsEditing(true);
    }
  }, [shape.text]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (shape.text === "Type here...") {
        inputRef.current.select(); // Select placeholder text
      }
    }
  }, [isEditing, shape.text]);

  const handleDoubleClick = () => {
    if (shape.locked) return; // Prevent editing when locked
    setIsEditing(true);
    setTempText(shape.text);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (tempText.trim() === "" || tempText.trim() === "Type here...") {
      // Delete empty or unchanged placeholder text box
      dispatch(removeShape(shape.id));
    } else if (tempText.trim() !== shape.text) {
      if (shape.text !== "Type here...") {
        dispatch(saveHistory());
      }
      dispatch(
        updateShape({
          id: shape.id,
          patch: { text: tempText.trim() },
        }),
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      if (shape.text === "Type here...") {
        // Delete placeholder text box on escape
        dispatch(removeShape(shape.id));
      } else {
        setIsEditing(false);
        setTempText(shape.text);
      }
    }
  };

  const isDefaultFill = shape.fill === "#ffffff";

  if (isEditing) {
    return (
      <input
        id={`shape-${shape.id}`}
        ref={inputRef}
        type="text"
        className={cn(
          "absolute pointer-events-auto bg-transparent outline-none rounded px-2 py-1",
          isDefaultFill ? "text-foreground dark:text-white" : "text-white",
        )}
        style={{
          left: shape.x,
          top: shape.y,
          fontSize: shape.fontSize,
          fontFamily: shape.fontFamily,
          fontWeight: shape.fontWeight,
          fontStyle: shape.fontStyle,
          textAlign: shape.textAlign,
          textDecoration: shape.textDecoration,
          lineHeight: shape.lineHeight,
          letterSpacing: shape.letterSpacing,
          textTransform: shape.textTransform,
          color: isDefaultFill ? undefined : shape.fill || undefined,
          width: `${Math.max(100, calculatedWidth)}px`,
          whiteSpace: "nowrap",
        }}
        value={tempText}
        onChange={(e) => {
          setTempText(e.target.value);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder=""
        autoComplete="off"
      />
    );
  }

  return (
    <div
      id={`shape-${shape.id}`}
      className={cn(
        "absolute pointer-events-none cursor-text select-none rounded px-2 py-1",
        isDefaultFill && "text-foreground dark:text-white",
      )}
      style={{
        left: shape.x,
        top: shape.y,
        fontSize: shape.fontSize,
        fontFamily: shape.fontFamily,
        fontWeight: shape.fontWeight,
        fontStyle: shape.fontStyle,
        textAlign: shape.textAlign,
        textDecoration: shape.textDecoration,
        lineHeight: shape.lineHeight,
        letterSpacing: shape.letterSpacing,
        textTransform: shape.textTransform,
        color: isDefaultFill ? undefined : shape.fill || undefined,
        userSelect: "none",
        whiteSpace: "nowrap", // Prevent line breaks
      }}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      <span
        className="text-element cursor-pointer"
        style={{ display: "block", minWidth: "20px", minHeight: "1em" }}
      >
        {shape.text}
      </span>
    </div>
  );
};
