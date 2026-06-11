"use client";

import { Rating } from "@/components/ui/rating";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  readonly value?: number;
  readonly onValueChange?: (value: number) => void;
  readonly readOnly?: boolean;
  readonly className?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical):
 *
 * Display mode (readOnly=true):
 * +----------------------------+
 * | ★★★★☆  8.4/10             |
 * +----------------------------+
 *
 * Input mode (readOnly=false):
 * +----------------------------+
 * | Your rating  ★★★★☆        |
 * +----------------------------+
 *  5-star half-step input maps to 1-10 integer
 */
export function RatingStars({ value, onValueChange, readOnly = false, className }: RatingStarsProps) {
  const starValue = value ? value / 2 : 0;

  return (
    <Rating
      allowHalf
      className={cn(className)}
      count={5}
      onValueChange={(details) => onValueChange?.(Math.round(details.value * 2))}
      readOnly={readOnly}
      value={starValue}
    />
  );
}
