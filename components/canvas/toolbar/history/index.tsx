"use client";
import { Redo2, Undo2 } from "lucide-react";
import React from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { undo, redo } from "@/redux/slice/shapes";

const HistoryPill = () => {
  const dispatch = useAppDispatch();
  const pastLength = useAppSelector((state) => state.shapes.past.length);
  const futureLength = useAppSelector((state) => state.shapes.future.length);

  const canUndo = pastLength > 0;
  const canRedo = futureLength > 0;

  return (
    <div className="flex justify-start items-center">
      <div
        className="inline-flex items-center rounded-full bg-card/95 border border-border shadow-xl shadow-neutral-950/10 dark:shadow-black/50 p-2 text-foreground backdrop-blur-md"
        aria-hidden
      >
        <button
          onClick={() => {
            if (canUndo) dispatch(undo());
          }}
          disabled={!canUndo}
          className={`inline-grid h-9 w-9 place-items-center rounded-full transition-all text-muted-foreground focus:outline-none ${
            canUndo
              ? "hover:bg-muted hover:text-foreground cursor-pointer active:scale-95"
              : "opacity-40 pointer-events-none"
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={18} className="stroke-[1.75]" />
        </button>

        <span className="mx-1 h-5 w-px rounded bg-border" />
        
        <button
          onClick={() => {
            if (canRedo) dispatch(redo());
          }}
          disabled={!canRedo}
          className={`inline-grid h-9 w-9 place-items-center rounded-full transition-all text-muted-foreground focus:outline-none ${
            canRedo
              ? "hover:bg-muted hover:text-foreground cursor-pointer active:scale-95"
              : "opacity-40 pointer-events-none"
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={18} className="stroke-[1.75]" />
        </button>
      </div>
    </div>
  );
};

export default HistoryPill;
