import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

type InspirationSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Props = {
  id: string;
  file?: File;
  url?: string;
  storageId?: string;
  uploaded: boolean;
  uploading: boolean;
  error?: string;
  isFromServer?: boolean;
};

const InspirationSidebar = ({ isOpen, onClose }: InspirationSidebarProps) => {
  const [images, setImages] = useState<Props[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  // Load existing images on mount/open
  useEffect(() => {
    if (!isOpen || !projectId) return;
    async function loadImages() {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          const serverImages: Props[] = (data.inspirationImages || []).map(
            (img: any) => ({
              id: img.id,
              storageId: img.id,
              url: `/api/uploads/${img.filePath}`,
              uploaded: true,
              uploading: false,
              isFromServer: true,
            }),
          );
          setImages(serverImages);
        }
      } catch (err) {
        console.error("Failed to load inspiration images:", err);
      }
    }
    loadImages();
  }, [isOpen, projectId]);

  const clearAllImages = async () => {
    const imagesToRemove = images.filter(
      (img) => img.storageId && img.isFromServer,
    );

    for (const image of imagesToRemove) {
      if (projectId && image.storageId) {
        try {
          await fetch(`/api/upload?id=${image.storageId}&type=inspiration`, {
            method: "DELETE",
          });
        } catch (error) {
          console.error("Failed to clear image from server:", error);
        }
      }
    }

    setImages([]);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const uploadImage = useCallback(
    async (file: File): Promise<{ storageId: string }> => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", projectId || "");
        formData.append("type", "inspiration");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        return { storageId: data.storageId };
      } catch (uploadError) {
        throw uploadError;
      }
    },
    [projectId],
  );

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const newImages: Props[] = Array.from(files)
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, 6 - images.length) // Limit to 6 total images
        .map((file) => ({
          id: `temp-${Date.now()}-${Math.random()}`,
          file,
          url: URL.createObjectURL(file),
          uploaded: false,
          uploading: false,
        }));

      if (newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages]);
        newImages.forEach(async (image) => {
          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id ? { ...img, uploading: true } : img,
            ),
          );

          try {
            const { storageId } = await uploadImage(image.file!);
            setImages((prev) =>
              prev.map((img) =>
                img.id === image.id
                  ? {
                      ...img,
                      storageId,
                      uploaded: true,
                      uploading: false,
                      isFromServer: true,
                      url: `/api/uploads/inspiration/${projectId}/${storageId}`, // Simple local preview fallback
                    }
                  : img,
              ),
            );
            // Reload from API to get the correct path URLs
            const response = await fetch(`/api/projects/${projectId}`);
            if (response.ok) {
              const data = await response.json();
              const serverImages: Props[] = (data.inspirationImages || []).map(
                (img: any) => ({
                  id: img.id,
                  storageId: img.id,
                  url: `/api/uploads/${img.filePath}`,
                  uploaded: true,
                  uploading: false,
                  isFromServer: true,
                }),
              );
              setImages(serverImages);
            }
          } catch (error) {
            setImages((prev) =>
              prev.map((img) =>
                img.id === image.id
                  ? {
                      ...img,
                      uploading: false,
                      error: (error as Error).message || "Upload failed!",
                    }
                  : img,
              ),
            );
          }
        });
      }
    },
    [images.length, uploadImage, projectId],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [handleFileSelect],
  );

  const removeImage = async (imageId: string) => {
    const image = images.find((img) => img.id === imageId);
    if (!image) return;

    if (image.storageId && image.isFromServer && projectId) {
      try {
        const response = await fetch(
          `/api/upload?id=${image.storageId}&type=inspiration`,
          {
            method: "DELETE",
          },
        );
        if (!response.ok) throw new Error("Delete failed");
      } catch (error) {
        console.error("Failed to remove image from server:", error);
      }
    }

    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  return (
    <div
      className={cn(
        "fixed left-5 top-1/2 transform -translate-y-1/2 w-80 bg-card/95 border border-border shadow-2xl shadow-neutral-950/20 dark:shadow-black/60 gap-2 p-3 rounded-lg z-50 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-[calc(100%+20px)]",
      )}
    >
      <div className="mb-1 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <ImageIcon className="w-4 h-4 text-foreground/80 mr-1" />
            <Label className="text-foreground/80 font-medium">
              Inspiration Board
            </Label>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="cursor-pointer h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "mb-3 border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer",
          dragActive
            ? "border-amber-500 bg-amber-500/10"
            : images.length < 6
              ? "border-border hover:border-muted-foreground/30 bg-muted/20 hover:bg-muted/30"
              : "border-border bg-muted/10 cursor-not-allowed opacity-50",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => images.length < 6 && fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            {images.length < 6 ? (
              <>
                Drop images here or{" "}
                <span className="text-amber-500 dark:text-amber-400 hover:underline">
                  browse
                </span>
                <br />
                <span className="text-xs text-muted-foreground/60">
                  {images.length}/6 images uploaded
                </span>
              </>
            ) : (
              "Maximum 6 images reached!"
            )}
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-foreground/80 text-sm">
              Uploaded Images ({images.length})
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllImages}
              className="cursor-pointer h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <Trash2 className="w-3 h-3" />
              Remove all
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted/10"
              >
                <Image
                  src={image.url || ""}
                  alt="Inspiration"
                  className="w-full h-full object-cover"
                  width={100}
                  height={100}
                  unoptimized
                />

                {image.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                {image.error && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <p className="text-xs text-red-300 text-center px-2">
                      {image.error}
                    </p>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(image.id)}
                  className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X className="w-3 h-3 text-white" />
                </Button>
                {image.uploaded && !image.uploading && (
                  <div className="absolute bottom-1 right-1 bg-green-600 rounded-full">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            ))}

            {images.length < 6 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/10 hover:border-muted-foreground/30 hover:bg-muted/20 transition-all duration-200 flex items-center justify-center group cursor-pointer"
              >
                <Plus className="w-6 h-6 text-muted-foreground/60 group-hover:text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InspirationSidebar;
