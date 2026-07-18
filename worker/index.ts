/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { runEngineCycle } from "../lib/engine/runner";
import type { EngineEnv } from "../lib/engine/types";

interface Env extends EngineEnv {
  ASSETS: Fetcher;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface ScheduledController {
  scheduledTime: number;
  cron: string;
  noRetry(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const response = await handler.fetch(request, env, ctx);
    const shouldWakeEngine = !url.pathname.startsWith("/_next/")
      && !url.pathname.startsWith("/_vinext/")
      && !url.pathname.startsWith("/api/operations/run")
      && !url.pathname.match(/\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|woff2?)$/i);
    if (shouldWakeEngine && env.DB) {
      ctx.waitUntil(runEngineCycle(env, "request").catch((error) => {
        console.error("Ganymede engine request wake failed", error);
      }));
    }
    return response;
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.DB) {
      controller.noRetry();
      return;
    }
    ctx.waitUntil(runEngineCycle(env, "scheduled", { force: true }).catch((error) => {
      console.error("Ganymede scheduled cycle failed", error);
      throw error;
    }));
  },
};

export default worker;
