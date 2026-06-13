import { NoteShape } from "@/redux/slice/shapes";
import { updateShape, saveHistory } from "@/redux/slice/shapes";
import React, { useState, useRef, useEffect } from "react";
import { useAppDispatch } from "@/redux/store";

export const Note = ({ shape }: { shape: NoteShape }) => {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(shape.text === "New Note");
  const [tempText, setTempText] = useState(shape.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when text is newly created
  useEffect(() => {
    if (shape.text === "New Note" && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      setIsEditing(true);
    }
  }, [shape.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      if (shape.text === "New Note") {
        textareaRef.current.select();
      }
    }
  }, [isEditing, shape.text]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shape.locked) return; // Prevent editing when locked
    setIsEditing(true);
    setTempText(shape.text);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const trimmed = tempText.trim();
    if (trimmed === "") {
      // Keep placeholder if empty
      setTempText("New Note");
      if (shape.text !== "New Note") {
        dispatch(
          updateShape({
            id: shape.id,
            patch: { text: "New Note" },
          })
        );
      }
    } else if (trimmed !== shape.text) {
      dispatch(saveHistory());
      dispatch(
        updateShape({
          id: shape.id,
          patch: { text: trimmed },
        })
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter to finish editing
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setTempText(shape.text);
    }
  };

  return (
    <div
      className="note-element absolute border border-yellow-300 shadow-md p-4 flex flex-col justify-start items-stretch select-none pointer-events-auto rounded-lg"
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.w,
        height: shape.h,
        backgroundColor: shape.color || "#fef08a",
        color: "#451a03",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.12)",
      }}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit note"
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="w-full h-full bg-transparent border-none outline-none resize-none font-sans text-sm font-medium leading-relaxed text-[#451a03] focus:ring-0 focus:outline-none"
          value={tempText}
          onChange={(e) => setTempText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          style={{
            fontFamily: "Inter, sans-serif",
          }}
        />
      ) : (
        <div
          className="w-full h-full overflow-y-auto wrap-break-word font-sans text-sm font-medium leading-relaxed whitespace-pre-wrap text-[#451a03]"
          style={{
            fontFamily: "Inter, sans-serif",
          }}
        >
          {shape.text}
        </div>
      )}
    </div>
  );
};
