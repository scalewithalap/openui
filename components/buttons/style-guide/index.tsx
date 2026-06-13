"use client";

import { Button } from "@/components/ui/button";
import { useStyleguide } from "@/hooks/use-styles";
import { Loader2, Sparkles } from "lucide-react";
import React from "react";

type Props = {
  images: any[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  projectId: string;
};

const GenerateStyleGuideButton = ({
  images,
  fileInputRef,
  projectId,
}: Props) => {
  const { handleGenerateStyleGuide, isGenerating } = useStyleguide(
    projectId,
    images,
    fileInputRef,
  );
  return (
    images.length > 0 && (
      <div className="flex justify-end">
        <Button
          className="rounded-full cursor-pointer"
          onClick={handleGenerateStyleGuide}
          disabled={isGenerating || images.some((img) => img.uploading)}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Images...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </>
          )}
        </Button>
      </div>
    )
  );
};

export default GenerateStyleGuideButton;
