import { MoodBoardImage } from "@/hooks/use-styles";
import { Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import Image from "next/image";
import React from "react";

const UploadStatus = (image: {
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}) => {
  if (image.uploading) {
    return (
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  if (image.uploaded) {
    return (
      <div className="absolute top-2 right-2">
        <CheckCircle className="w-5 h-5 text-green-400" />
      </div>
    );
  }

  if (image.error) {
    return (
      <div className="absolute top-2 right-2">
        <AlertCircle className="w-5 h-5 text-red-400" />
      </div>
    );
  }

  return null;
};

type Props = {
  image: MoodBoardImage;
  removeImage: (id: string) => void;
  xOffset: number;
  yOffset: number;
  rotation: number;
  zIndex: number;
  marginLeft: string;
  marginTop: string;
};

const ImagesBoard = ({
  image,
  removeImage,
  xOffset,
  yOffset,
  rotation,
  zIndex,
  marginLeft,
  marginTop,
}: Props) => {
  return (
    <div
      key={`board-${image.id}`}
      className="absolute group"
      style={{
        transform: `translate(${xOffset}px, ${yOffset}px) rotate(${rotation}deg)`,
        left: "50%",
        top: "50%",
        zIndex: zIndex,
        marginLeft: marginLeft,
        marginTop: marginTop,
      }}
    >
      <div
        className="relative w-40 h-40 rounded-2xl overflow-hidden bg-white shadow-xl border border-border/20
hover:scale-105 transition-all duration-200"
      >
        <Image
          src={image.preview}
          alt="Mood board image"
          fill
          className="object-cover"
        />
        <UploadStatus
          uploading={image.uploading}
          uploaded={image.uploaded}
          error={image.error}
        />
        <button
          onClick={() => removeImage(image.id)}
          className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center
  justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

export default ImagesBoard;
