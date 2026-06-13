"use client";
import { MoodBoardImage, useMoodBoard } from "@/hooks/use-styles";
import { cn } from "@/lib/utils";
import React, { useRef } from "react";
import ImagesBoard from "./images.board";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import GenerateStyleGuideButton from "@/components/buttons/style-guide";

type Props = {
  guideImages: MoodBoardImage[];
};

const MoodBoard = ({ guideImages }: Props) => {
  const {
    images,
    dragActive,
    removeImage,
    handleDrag,
    handleDrop,
    handleFileInput,
    canAddMore,
  } = useMoodBoard(guideImages);

  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-10">
      <GenerateStyleGuideButton
        images={images}
        fileInputRef={fileInputRef}
        projectId={projectId ?? ""}
      />

      <div
        className={cn(
          "relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-200 min-h-[400px] flex items-center justify-center",
          dragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border/50 hover:border-border",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full bg-linear-to-br from-primary/20
          to-transparent rounded-3xl"
          />
        </div>
        {images.length > 0 && (
          <>
            <div className="lg:hidden absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {images.map((image, index) => {
                  const seed = image.id
                    .split("")
                    .reduce((a, b) => a + b.charCodeAt(0), 0);
                  const random1 = ((seed * 9301 + 49297) % 233280) / 233280;
                  const random2 =
                    (((seed + 1) * 9301 + 49297) % 233280) / 233280;
                  const random3 =
                    (((seed + 2) * 9301 + 49297) % 233280) / 233280;

                  const rotation = (random1 - 0.5) * 20; // -10 to +10 degrees for subtle tilt
                  const xOffset = (random2 - 0.5) * 40; // -20 to +20 px horizontal offset
                  const yOffset = (random3 - 0.5) * 30; // -15 to +15 px vertical offset

                  return (
                    <ImagesBoard
                      key={`mobile-${image.id}`}
                      image={image}
                      removeImage={removeImage}
                      xOffset={xOffset}
                      yOffset={yOffset}
                      rotation={rotation}
                      zIndex={index + 1}
                      marginLeft="-80px"
                      marginTop="-96px"
                    />
                  );
                })}
              </div>
            </div>

            <div className="hidden lg:flex absolute inset-0 items-center justify-center">
              <div className="relative w-full max-w-[700px] h-[300px] mx-auto">
                {images.map((image, index) => {
                  const seed = image.id
                    .split("")
                    .reduce((a, b) => a + b.charCodeAt(0), 0);
                  const random1 = ((seed * 9301 + 49297) % 233280) / 233280;
                  const random3 =
                    (((seed + 2) * 9301 + 49297) % 233280) / 233280;

                  // Sequential positioning: each image moves right with slight overlap
                  const imageWidth = 192; // w-48 = 192px
                  const overlapAmount = 30; // Reduced overlap
                  const spacing = imageWidth - overlapAmount; // 162px between image centers

                  // Position from left to right with slight random rotation and minimal vertical offset
                  const rotation = (random1 - 0.5) * 50; // -25 to +25 degrees
                  const xOffset =
                    index * spacing - ((images.length - 1) * spacing) / 2; // Center the sequence
                  const yOffset = (random3 - 0.5) * 30; // -15 to +15 px minimal vertical
                  const zIndex = index + 1;

                  return (
                    <ImagesBoard
                      key={`desktop-${image.id}`}
                      image={image}
                      removeImage={removeImage}
                      xOffset={xOffset}
                      yOffset={yOffset}
                      rotation={rotation}
                      zIndex={zIndex}
                      marginLeft="-96px"
                      marginTop="-112px"
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
        {images.length === 0 && (
          <div className="relative z-10 space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground">
                Drop your images here
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Drag and drop up to 5 images to build your mood board
              </p>
            </div>
            <Button
              className="cursor-pointer"
              onClick={handleUploadClick}
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Images
            </Button>
          </div>
        )}

        {images.length > 0 && canAddMore && (
          <div className="absolute bottom-6 right-6 z-20">
            <Button
              className="cursor-pointer"
              onClick={handleUploadClick}
              size="sm"
              variant="outline"
            >
              <Upload className="w-4 h-4" />
              Add More
            </Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {images.length >= 5 && (
        <div className="text-center p-4 bg-muted/50 rounded-2xl">
          <p className="text-sm text-muted-foreground">
            Maximum 5 images are allowed! Remove some images to add more.
          </p>
        </div>
      )}
    </div>
  );
};

export default MoodBoard;
