export interface ContentBlock {
  type:
    | "heading"
    | "paragraph"
    | "bulleted_list"
    | "numbered_list"
    | "image"
    | "quote"
    | "divider";
  text?: string;
  level?: 1 | 2 | 3;
  items?: string[];
  url?: string;
  alt?: string;
  caption?: string;
  attribution_text?: string;
}

export interface LessonSlide {
  id: string;
  order: number;
  title: string | null;
  layout: "default" | "split" | "image_full" | "title_only";
  content_blocks: ContentBlock[];
  background_image_url: string | null;
  background_colour: string | null;
}

export interface LessonResource {
  id: string;
  title: string;
  resource_type: string;
  role: string;
  kind: "link" | "text" | "file";
  url?: string;
  text?: string;
  file_format?: string;
}
