import type { ContentBlock } from "@/types/lesson";

// Font sizes use cqw (container query width) so a slide scales proportionally
// whether it's a small dashboard preview or a full-window presentation —
// the parent must have `@container` set (see SlideViewer's frame).
export function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading": {
      const level = block.level ?? 2;
      const size =
        level === 1
          ? "text-[clamp(1.25rem,4.2cqw,2.5rem)]"
          : level === 2
          ? "text-[clamp(1.1rem,3.2cqw,2rem)]"
          : "text-[clamp(1rem,2.4cqw,1.5rem)]";
      const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      return <Tag className={`${size} font-semibold leading-snug`}>{block.text}</Tag>;
    }
    case "paragraph":
      return (
        <p className="text-[clamp(0.875rem,1.9cqw,1.25rem)] leading-relaxed text-foreground/90">
          {block.text}
        </p>
      );
    case "bulleted_list":
      return (
        <ul className="space-y-2">
          {(block.items ?? []).map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-[clamp(0.875rem,1.9cqw,1.25rem)] leading-relaxed"
            >
              <span className="mt-[0.55em] h-[0.4em] w-[0.4em] shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "numbered_list":
      return (
        <ol className="space-y-2">
          {(block.items ?? []).map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-[clamp(0.875rem,1.9cqw,1.25rem)] leading-relaxed"
            >
              <span className="shrink-0 font-semibold text-primary">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    case "image":
      return (
        <figure className="space-y-2">
          <img src={block.url} alt={block.alt ?? ""} className="max-w-full rounded-lg" />
          {block.caption && (
            <figcaption className="text-[clamp(0.7rem,1.1cqw,0.9rem)] text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "quote":
      return (
        <blockquote className="border-l-[3px] border-primary/50 pl-4 italic text-[clamp(0.95rem,2.1cqw,1.4rem)] text-foreground/80">
          {block.text}
          {block.attribution_text && (
            <footer className="mt-2 not-italic text-[clamp(0.75rem,1.3cqw,1rem)]">
              — {block.attribution_text}
            </footer>
          )}
        </blockquote>
      );
    case "divider":
      return <hr className="border-border" />;
    default:
      return null;
  }
}
