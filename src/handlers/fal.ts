/**
 * FAL.ai Handlers
 *
 * Handles image and video generation using FAL.ai's serverless infrastructure.
 * FAL provides access to FLUX, MiniMax Video, Luma Dream Machine, and other models.
 *
 * @see https://docs.fal.ai/examples
 */

import { fal } from '@fal-ai/client';
import type { IAgentRuntime } from '@elizaos/core';
import type { ImageGenerationParams } from '@elizaos/core';
import type { AIGatewayConfig } from '../config';

/**
 * Video generation parameters
 */
interface VideoGenerationParams {
  prompt: string;
  image_url?: string;
  duration?: number;
}

/**
 * Initialize FAL client with API key
 */
function initFalClient(apiKey: string): void {
  fal.config({
    credentials: apiKey,
  });
}

/**
 * Create IMAGE handler using FAL
 * Uses FLUX models for high-quality image generation
 */
export function createFalImageHandler(
  config: AIGatewayConfig
): (runtime: IAgentRuntime, params: Record<string, unknown>) => Promise<{ url: string }[]> {
  return async (_runtime: IAgentRuntime, params: Record<string, unknown>) => {
    if (!config.FAL_API_KEY) {
      throw new Error('FAL_API_KEY is required for FAL image generation');
    }

    initFalClient(config.FAL_API_KEY);

    const imageParams = params as unknown as ImageGenerationParams;

    // Parse size if provided (e.g., "1024x1024")
    let width = 1024;
    let height = 1024;
    if (imageParams.size) {
      const [w, h] = imageParams.size.split('x').map(Number);
      if (w && h) {
        width = w;
        height = h;
      }
    }

    const result = await fal.subscribe(config.FAL_IMAGE_MODEL, {
      input: {
        prompt: imageParams.prompt,
        image_size: {
          width,
          height,
        },
        num_images: imageParams.count || 1,
      },
    });

    // FAL returns images in various formats depending on the model
    const images = (result.data as { images?: Array<{ url: string }>; url?: string })?.images ||
      [(result.data as { url: string })];

    return images.map((img: { url: string }) => ({ url: img.url }));
  };
}

/**
 * Create VIDEO handler using FAL
 * Uses MiniMax, Luma Dream Machine, or Kling for video generation
 */
export function createFalVideoHandler(
  config: AIGatewayConfig
): (runtime: IAgentRuntime, params: Record<string, unknown>) => Promise<{ url: string }> {
  return async (_runtime: IAgentRuntime, params: Record<string, unknown>) => {
    if (!config.FAL_API_KEY) {
      throw new Error('FAL_API_KEY is required for FAL video generation');
    }

    initFalClient(config.FAL_API_KEY);

    const videoParams = params as unknown as VideoGenerationParams;

    const input: Record<string, unknown> = {
      prompt: videoParams.prompt,
    };

    // Add image_url for image-to-video models
    if (videoParams.image_url) {
      input.image_url = videoParams.image_url;
    }

    const result = await fal.subscribe(config.FAL_VIDEO_MODEL, {
      input,
    });

    // Extract video URL from result
    const data = result.data as { video?: { url: string }; url?: string };
    const videoUrl = data.video?.url || data.url;

    if (!videoUrl) {
      throw new Error('No video URL returned from FAL');
    }

    return { url: videoUrl };
  };
}

/**
 * Available FAL models for reference
 */
export const FAL_MODELS = {
  // Image generation
  IMAGE: {
    FLUX_DEV: 'fal-ai/flux/dev',
    FLUX_PRO: 'fal-ai/flux-pro',
    FLUX_SCHNELL: 'fal-ai/flux/schnell',
    RECRAFT_V3: 'fal-ai/recraft-v3',
    SD_V35_LARGE: 'fal-ai/stable-diffusion-v35-large',
  },
  // Video generation
  VIDEO: {
    MINIMAX: 'fal-ai/minimax-video/image-to-video',
    LUMA_DREAM_MACHINE: 'fal-ai/luma-dream-machine/image-to-video',
    KLING_V1: 'fal-ai/kling-video/v1/standard/image-to-video',
  },
} as const;
