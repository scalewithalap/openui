"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DesignTokensEditor from "@/components/canvas/shapes/generatedui/design-tokens-editor";
import { useAppDispatch } from "@/redux/store";
import {
  loadStyleGuideStart,
  loadStyleGuideSuccess,
  loadStyleGuideFailure,
} from "@/redux/slice/style-guide";

export default function DesignSystemPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!projectId) return;

    const loadStyleGuide = async () => {
      dispatch(loadStyleGuideStart());
      try {
        const res = await fetch(`/api/projects/${projectId}/style-guide`);
        if (res.ok) {
          const data = await res.json();
          dispatch(loadStyleGuideSuccess(data.styleGuide));
        } else {
          dispatch(loadStyleGuideFailure("Failed to load style guide"));
        }
      } catch (err) {
        dispatch(loadStyleGuideFailure("Failed to load style guide"));
      }
    };

    loadStyleGuide();
  }, [dispatch, projectId]);

  return (
    <div className="h-screen w-screen flex flex-col pt-16 bg-background overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col p-6">
        <div className="flex items-center justify-between pb-2 shrink-0">
          <div>
            <h1 className="text-3xl lg:text-left text-center font-bold text-foreground">
              Design System & Tokens
            </h1>
            <p className="text-muted-foreground text-center lg:text-left">
              Configure and preview the brand style tokens and markdown
              configurations.
            </p>
          </div>
        </div>
        <div className="flex-1 min-h-0 mt-4 bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <DesignTokensEditor projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
