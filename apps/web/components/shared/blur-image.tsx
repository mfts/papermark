import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";
import { useState } from "react";

export function BlurImage(props: ImageProps) {
  const [isLoading, setLoading] = useState(true);

  return (
    <Image
      {...props}
      alt={props.alt}
      className={cn(isLoading ? "blur-[2px]" : "blur-0", props.className)}
      onLoadingComplete={async () => {
        setLoading(false);
      }}
    />
  );
}
