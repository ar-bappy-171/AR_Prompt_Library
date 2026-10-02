"use client";

import * as React from "react";
import { ImagePlus, Link2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PromptImage } from "@/lib/prompt-vault/types";
import { fileToStoredImage, generateId, urlToStoredImage } from "@/lib/prompt-vault/utils";

interface ImagePickerProps {
  images: PromptImage[];
  onChange: (images: PromptImage[]) => void;
  type: "input" | "result";
  label: string;
}

export function ImagePicker({ images, onChange, type, label }: ImagePickerProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [urlValue, setUrlValue] = React.useState("");
  const [urlOpen, setUrlOpen] = React.useState(false);

  const own = images.filter((i) => i.type === type);

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const added: PromptImage[] = [];
      for (const file of Array.from(files).slice(0, 4)) {
        if (!file.type.startsWith("image/")) continue;
        const src = await fileToStoredImage(file);
        added.push({ id: generateId(), src, type });
      }
      if (added.length > 0) onChange([...images, ...added]);
      toast.success(`Image${added.length > 1 ? "s" : ""} added`);
    } catch {
      toast.error("Failed to read image");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addUrl = async () => {
    const url = urlValue.trim();
    if (!url) return;
    setBusy(true);
    try {
      const src = await urlToStoredImage(url);
      onChange([...images, { id: generateId(), src, type }]);
      setUrlValue("");
      setUrlOpen(false);
      toast.success("Image added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load image from URL");
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) => onChange(images.filter((i) => i.id !== id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label} <span className="opacity-60">({own.length}/6)</span>
        </span>
        <div className="flex items-center gap-1">
          <Popover open={urlOpen} onOpenChange={setUrlOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="iconXs" aria-label="Add image from URL" className="text-muted-foreground">
                <Link2 className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="end">
              <div className="flex gap-1.5">
                <Input
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="https://… image url"
                  className="h-8 text-xs"
                  onKeyDown={(e) => e.key === "Enter" && addUrl()}
                />
                <Button type="button" size="sm" className="h-8" disabled={busy} onClick={addUrl}>
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Add"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="ghost"
            size="iconXs"
            aria-label="Upload image"
            className="text-muted-foreground"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
          </Button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
        aria-label={`Upload ${label.toLowerCase()}`}
      />

      {own.length === 0 ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
        >
          <ImagePlus className="size-4" />
          Click to upload {label.toLowerCase()}
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          {own.map((img) => (
            <div key={img.id} className="group relative">
              <img
                src={img.src}
                alt={label}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="size-16 rounded-lg border object-cover"
              />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => remove(img.id)}
                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background opacity-90 shadow transition-transform hover:scale-110"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {own.length < 6 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex size-16 items-center justify-center rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
              aria-label="Add more images"
            >
              <ImagePlus className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
