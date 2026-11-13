import { cn } from "@/lib/utils";
import { programNoteToPlain, programNoteToSafeHtml } from "@/utils/programNotePlain";

export type ProgramNoteBlockProps = {
  text?: string;
  imageUrl?: string;
  className?: string;
  /** Paragraf sınıfları; verilmezse ana sayfa/program için text-sm / lg:text-base. */
  textClassName?: string;
  centered?: boolean;
  /** /m gibi dar yerlerde not görselini küçültür */
  compactImage?: boolean;
};

/** Not + isteğe bağlı görsel; yalnız <b> ve <br>. */
export function ProgramNoteBlock({ text, imageUrl, className, textClassName, centered, compactImage }: ProgramNoteBlockProps) {
  const plain = programNoteToPlain(text);
  const hasText = Boolean(plain);
  const hasImage = Boolean(imageUrl?.trim());
  if (!hasText && !hasImage) return null;

  const safeHtml = hasText ? programNoteToSafeHtml(text) : "";

  /* Not görseli dairesi */
  const noteImageEl = (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-sm",
        compactImage
          ? "h-11 w-11"
          : "h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20",
        !hasText && "mx-auto",
      )}
    >
      <img src={imageUrl!} alt="" className="h-full w-full object-cover" loading="lazy" />
    </div>
  );

  const textEl = hasText ? (
    <p
      className={cn(
        textClassName ?? "text-sm leading-relaxed lg:text-base",
        "[&_b]:font-bold",
        hasImage && "min-w-0 flex-1 text-left",
        !hasImage && centered && "text-center",
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  ) : null;

  if (hasText && hasImage) {
    return (
      <div className={cn("w-full min-w-0 text-gray-text break-words", className)}>
        <div
          className={cn(
            "flex w-full min-w-0 flex-col items-start sm:flex-row sm:items-center sm:justify-start",
            compactImage ? "gap-2 sm:gap-2" : "gap-3 sm:gap-3",
          )}
        >
          {noteImageEl}
          {textEl}
        </div>
      </div>
    );
  }

  if (hasText) {
    return (
      <div className={cn("w-full min-w-0 text-gray-text break-words", centered && "text-center", className)}>
        {textEl}
      </div>
    );
  }

  return (
    <div className={cn("w-full min-w-0 text-gray-text", centered && "flex justify-center", className)}>
      {noteImageEl}
    </div>
  );
}
