import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface UrlInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  invalidUrls: string[];
  placeholder?: string;
  label?: string;
  rows?: number;
  className?: string;
}

export function UrlInput({
  value,
  onChange,
  invalidUrls,
  placeholder = "Enter URLs (one per line or comma-separated)",
  label = "URLs",
  rows = 6,
  className = "",
}: UrlInputProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label htmlFor="urls">{label}</Label>
      <Textarea
        id="urls"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className="resize-none bg-muted"
      />
      {invalidUrls.length > 0 && (
        <p className="text-sm text-destructive">
          The following URLs are invalid: {invalidUrls.join(", ")}
        </p>
      )}
    </div>
  );
}
