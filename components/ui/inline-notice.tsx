import { cn } from "@/lib/utils";

type InlineNoticeType = "success" | "error" | "info";

type InlineNoticeProps = {
  type?: InlineNoticeType;
  message: string;
  className?: string;
};

const typeStyles: Record<InlineNoticeType, string> = {
  success: "border-primary/40 bg-primary/10 text-primary",
  error: "border-destructive/40 bg-destructive/10 text-destructive",
  info: "border-white/10 bg-white/5 text-muted-foreground",
};

export function InlineNotice({ type = "info", message, className }: InlineNoticeProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        typeStyles[type],
        className
      )}
    >
      {message}
    </div>
  );
}
