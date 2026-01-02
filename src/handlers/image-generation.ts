/**
 * Image Generation Handler
 *
 * Handles IMAGE model type using FLUX 2 Pro (the current standard, not DALL-E).
 * Uses the gateway's REST API directly since the AI SDK image model requires specific factories.
 */

import type { IAgentRuntime } from '@elizaos/core';
import type { ImageGenerationParams } from '@elizaos/core';
import type { AIGatewayConfig } from '../config';

/**
 * Create IMAGE handler using FLUX via REST API
 */
export function createImageHandler(
  config: AIGatewayConfig
): (runtime: IAgentRuntime, params: Record<string, unknown>) => Promise<{ url: string }[]> {
  return async (runtime: IAgentRuntime, params: Record<string, unknown>) => {
    const imageParams = params as unknown as ImageGenerationParams;

    // Parse size if provided (e.g., "1024x1024")
    let size: string | undefined;
    if (imageParams.size) {
      size = imageParams.size;
    }

    // Call the gateway REST API for image generation
    const response = await fetch(`${config.AI_GATEWAY_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.AI_GATEWAY_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.AI_GATEWAY_IMAGE_MODEL,
        prompt: imageParams.prompt,
        n: imageParams.count || 1,
        size: size || '1024x1024',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Image generation failed: ${error}`);
    }

    const result = (await response.json()) as {
      data: Array<{ url?: string; b64_json?: string }>;
    };

    // Return array of image URLs
    return result.data.map((img) => ({
      url: img.b64_json ? `data:image/png;base64,${img.b64_json}` : img.url || '',
    }));
  };
}
