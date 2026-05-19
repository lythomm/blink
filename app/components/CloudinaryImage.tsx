"use client";

import { CldImage, getCldImageUrl } from "next-cloudinary";
import { useState } from "react";

export const PHOTO_EFFECTS = [{ art: "primavera" }, { sharpen: "100" }, { noise: "15" }];

type CropMode =
  | "fill"
  | "scale"
  | "crop"
  | "thumb"
  | "fit"
  | "limit"
  | "mfit"
  | "pad"
  | "lpad"
  | "mpad"
  | "fill_pad";

interface CloudinaryImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  crop?: CropMode;
  aspectRatio?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  effects?: object[];
  onError?: () => void;
}

export function CloudinaryImage({
  src,
  alt,
  className,
  fill,
  crop = "fill",
  aspectRatio,
  width,
  height,
  priority,
  sizes,
  effects,
  onError,
}: CloudinaryImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
    if (onError) {
      onError();
    }
  };

  const activeEffects =
    effects !== undefined ? effects : hasError ? [] : PHOTO_EFFECTS;

  return (
    <CldImage
      src={src}
      deliveryType="upload"
      alt={alt}
      fill={fill}
      crop={crop}
      aspectRatio={fill ? undefined : aspectRatio}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      priority={priority}
      sizes={sizes}
      effects={activeEffects}
      onError={handleError}
      className={className}
      data-debug-url={getCldImageUrl({
        src,
        deliveryType: "upload",
        width: width || 600,
        height: height || 800,
        crop,
        effects: activeEffects,
      })}
    />
  );
}
