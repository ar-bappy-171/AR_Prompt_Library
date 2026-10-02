"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  showValue?: boolean;
}

const SIZES = {
  sm: "size-3.5",
  md: "size-4.5",
  lg: "size-6",
};

export function StarRating({ value, onChange, size = "sm", className, showValue }: StarRatingProps) {
  const [hover, setHover] = React.useState(0);
  const interactive = Boolean(onChange);
  const display = hover || value;

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : undefined}
      aria-label={interactive ? "Rating" : `Rated ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= display;
        const StarEl = (
          <Star
            className={cn(
              SIZES[size],
              "transition-colors",
              filled ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted-foreground/40",
              interactive && !filled && hover >= star && "text-amber-300"
            )}
          />
        );
        return interactive ? (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            className="rounded p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange?.(value === star ? 0 : star)}
          >
            {StarEl}
          </button>
        ) : (
          <span key={star}>{StarEl}</span>
        );
      })}
      {showValue && value > 0 && (
        <span className="ml-1 text-xs font-medium text-muted-foreground">{value}/5</span>
      )}
    </div>
  );
}
