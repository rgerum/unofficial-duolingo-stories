import type React from "react";

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
};

export default function Image({ fill, priority, style, ...props }: ImageProps) {
  const { alt, loading, ...imgProps } = props;
  const nextStyle = fill
    ? {
        ...style,
        height: "100%",
        left: 0,
        objectFit: style?.objectFit ?? "cover",
        position: "absolute" as const,
        top: 0,
        width: "100%",
      }
    : style;

  return (
    <img
      {...imgProps}
      alt={alt}
      loading={priority ? "eager" : loading}
      style={nextStyle}
    />
  );
}
