import type { LessonSlide } from "@/types/lesson";
import { ContentBlockRenderer } from "./ContentBlockRenderer";

// 16:9 canvas that scales via container queries — same slide, same markup,
// looks right whether it's a small dashboard preview or a full popup window.
export function SlideViewer({ slide }: { slide: LessonSlide }) {
  const imageBlock = slide.content_blocks.find((b) => b.type === "image");
  const textBlocks = slide.content_blocks.filter((b) => b.type !== "image");

  const frameStyle = slide.background_colour ? { backgroundColor: slide.background_colour } : undefined;

  if (slide.layout === "image_full" && slide.background_image_url) {
    return (
      <div
        className="@container relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-cover bg-center"
        style={{ backgroundImage: `url(${slide.background_image_url})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative flex h-full flex-col justify-end gap-3 p-[4cqw] text-white">
          {slide.title && (
            <h2 className="text-[clamp(1.5rem,5cqw,3rem)] font-bold leading-tight">{slide.title}</h2>
          )}
          <div className="space-y-3">
            {textBlocks.map((block, i) => (
              <ContentBlockRenderer key={i} block={block} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (slide.layout === "title_only") {
    return (
      <div
        className="@container flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-[5cqw] text-center"
        style={frameStyle}
      >
        {slide.title && (
          <h2 className="text-[clamp(1.75rem,6cqw,3.5rem)] font-bold leading-tight">{slide.title}</h2>
        )}
        <div className="space-y-3 max-w-[80%]">
          {textBlocks.map((block, i) => (
            <ContentBlockRenderer key={i} block={block} />
          ))}
        </div>
      </div>
    );
  }

  if (slide.layout === "split" && imageBlock) {
    return (
      <div
        className="@container grid aspect-video w-full grid-cols-2 gap-[3cqw] overflow-hidden rounded-xl border border-border bg-card p-[4cqw]"
        style={frameStyle}
      >
        <div className="flex flex-col justify-center gap-3 overflow-hidden">
          {slide.title && (
            <h2 className="text-[clamp(1.25rem,4cqw,2.25rem)] font-bold leading-tight">{slide.title}</h2>
          )}
          <div className="space-y-3">
            {textBlocks.map((block, i) => (
              <ContentBlockRenderer key={i} block={block} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted">
          <ContentBlockRenderer block={imageBlock} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="@container flex aspect-video w-full flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-card p-[4cqw]"
      style={frameStyle}
    >
      {slide.title && (
        <h2 className="text-[clamp(1.5rem,4.5cqw,2.75rem)] font-bold leading-tight shrink-0">{slide.title}</h2>
      )}
      <div className="space-y-3">
        {slide.content_blocks.map((block, i) => (
          <ContentBlockRenderer key={i} block={block} />
        ))}
      </div>
    </div>
  );
}
