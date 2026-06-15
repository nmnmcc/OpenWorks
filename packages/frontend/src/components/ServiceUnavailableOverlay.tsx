"use client";

import { Duration, Effect, Fiber, Schedule } from "effect";
import { useEffect, useState } from "react";

const retrySchedule = Schedule.exponential("1 second").pipe(
  Schedule.modifyDelay((_, delay) => Effect.succeed(Duration.min(delay, Duration.seconds(30))))
);

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical):
 *
 * +--------------------------------------------------+
 * |                                                  |
 * |            bg-background/60 + blur               |
 * |                                                  |
 * |          "服务暂不可用"  (text-2xl)               |
 * |                                                  |
 * |                                                  |
 * +--------------------------------------------------+
 *   fixed inset-0 z-9999, flex items-center justify-center
 *
 * All breakpoints: fixed full-viewport overlay with centered text.
 * Conditionally rendered: null when service is available.
 * Width/height: inset-0 fills viewport — no breakpoint variation.
 */
export function ServiceUnavailableOverlay() {
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    const healthCheck = Effect.tryPromise({
      try: () =>
        fetch("/api/health", { cache: "no-store" }).then((res) => {
          if (!res.ok) throw res;
        }),
      catch: () => "unavailable" as const,
    });

    const monitor = healthCheck.pipe(
      Effect.tapError(() => Effect.sync(() => setIsUnavailable(true))),
      Effect.retry(retrySchedule),
      Effect.tap(() => Effect.sync(() => setIsUnavailable(false))),
      Effect.repeat(Schedule.spaced("30 seconds"))
    );

    const fiber = Effect.runFork(monitor);
    return () => {
      Effect.runFork(Fiber.interrupt(fiber));
    };
  }, []);

  if (!isUnavailable) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-background/60 backdrop-blur-md">
      <p className="text-2xl font-semibold text-foreground">服务暂不可用</p>
    </div>
  );
}
