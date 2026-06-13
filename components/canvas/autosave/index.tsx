"use client";
import { useAppSelector } from "@/redux/store";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState, useCallback } from "react";

const Autosave = () => {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  const shapesState = useAppSelector((state) => state.shapes);
  const viewportState = useAppSelector((state) => state.viewport);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const isReady = Boolean(projectId);

  const saveNow = useCallback(async () => {
    if (!isReady || !viewportState.initialized) return;

    const stateString = JSON.stringify({
      shapes: shapesState,
      viewport: viewportState,
    });
    lastSavedRef.current = stateString;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setSaveStatus("saving");
    setIsSaving(true);
    try {
      const response = await fetch("/api/autosave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId as string,
          shapesData: shapesState,
          viewportData: {
            scale: viewportState.scale,
            translate: viewportState.translate,
          },
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Save request failed");
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [isReady, projectId, shapesState, viewportState]);

  // Debounced autosave effect
  useEffect(() => {
    if (!isReady || !viewportState.initialized) return;
    const stateString = JSON.stringify({
      shapes: shapesState,
      viewport: viewportState,
    });
    if (stateString === lastSavedRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveNow();
    }, 1000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [shapesState, viewportState, isReady, saveNow]);

  // Manual save listener effect
  useEffect(() => {
    const handleManualSave = () => {
      saveNow();
    };
    window.addEventListener("trigger-manual-save", handleManualSave);
    return () => {
      window.removeEventListener("trigger-manual-save", handleManualSave);
    };
  }, [saveNow]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!isReady) return null;

  if (isSaving) {
    return (
      <div className="flex items-center">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  switch (saveStatus) {
    case "saved":
      return (
        <div className="flex items-center">
          <CheckCircle className="w-4 h-4 text-green-400" />
        </div>
      );
    case "error":
      return (
        <div className="flex items-center">
          <AlertCircle className="w-4 h-4 text-red-400" />
        </div>
      );
    default:
      return <></>;
  }
};

export default Autosave;
