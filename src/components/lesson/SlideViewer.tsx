import type { LessonSlide } from "@/types/lesson";
import { ContentBlockRenderer } from "./ContentBlockRenderer";

export function SlideViewer({ slide }: { slide: LessonSlide }) {
  return (
    <div
      className="rounded-lg border border-border p-6 min-h-[280px] space-y-4"
      style={slide.background_colour ? { backgroundColor: slide.background_colour } : undefined}
    >
      {slide.background_image_url && (
        <img
          src={slide.background_image_url}
          alt=""
          className="w-full max-h-40 object-cover rounded-md mb-2"
        />
      )}
      <h2 className="text-lg font-bold">{slide.title || "Untitled slide"}</h2>
      <div className="space-y-3">
        {slide.content_blocks.map((block, i) => (
          <ContentBlockRenderer key={i} block={block} />
        ))}
      </div>
    </div>
  );
}
