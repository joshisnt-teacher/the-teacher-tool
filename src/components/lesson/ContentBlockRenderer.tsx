import type { ContentBlock } from "@/types/lesson";

export function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading": {
      const level = block.level ?? 2;
      if (level === 1) return <h1 className="text-2xl font-bold">{block.text}</h1>;
      if (level === 2) return <h2 className="text-xl font-semibold">{block.text}</h2>;
      return <h3 className="text-lg font-semibold">{block.text}</h3>;
    }
    case "paragraph":
      return <p className="text-sm leading-relaxed">{block.text}</p>;
    case "bulleted_list":
      return (
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {(block.items ?? []).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "numbered_list":
      return (
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          {(block.items ?? []).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    case "image":
      return (
        <figure className="space-y-1">
          <img src={block.url} alt={block.alt ?? ""} className="max-w-full rounded-md" />
          {block.caption && (
            <figcaption className="text-xs text-muted-foreground">{block.caption}</figcaption>
          )}
        </figure>
      );
    case "quote":
      return (
        <blockquote className="border-l-2 border-primary/40 pl-3 italic text-sm text-muted-foreground">
          {block.text}
          {block.attribution_text && (
            <footer className="mt-1 not-italic text-xs">— {block.attribution_text}</footer>
          )}
        </blockquote>
      );
    case "divider":
      return <hr className="border-border" />;
    default:
      return null;
  }
}
