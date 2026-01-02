/**
 * Image Description Handler
 *
 * Handles IMAGE_DESCRIPTION model type using vision models (Grok 2 Vision).
 */

import { generateText } from 'ai';
import type { IAgentRuntime } from '@elizaos/core';
import type { ImageDescriptionParams } from '@elizaos/core';
import { getLanguageModel } from '../gateway';
import type { AIGatewayConfig } from '../config';

/**
 * Create IMAGE_DESCRIPTION handler
 */
export function createImageDescriptionHandler(
  config: AIGatewayConfig
): (
  runtime: IAgentRuntime,
  params: Record<string, unknown>
) => Promise<{ title: string; description: string }> {
  return async (runtime: IAgentRuntime, params: Record<string, unknown>) => {
    const imageParams = params as unknown as ImageDescriptionParams | string;
    // Handle string input (just image URL)
    let imageUrl: string;
    let prompt: string;

    if (typeof imageParams === 'string') {
      imageUrl = imageParams;
      prompt = 'Describe this image in detail. Provide a short title and a comprehensive description.';
    } else {
      imageUrl = imageParams.imageUrl;
      prompt =
        imageParams.prompt ||
        'Describe this image in detail. Provide a short title and a comprehensive description.';
    }

    const model = getLanguageModel(config, config.AI_GATEWAY_VISION_MODEL);

    // Use vision model with image content
    const result = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image: imageUrl },
            {
              type: 'text',
              text: `${prompt}\n\nRespond in this exact format:\nTITLE: [short title]\nDESCRIPTION: [detailed description]`,
            },
          ],
        },
      ],
    });

    // Parse the response
    const text = result.text;
    const titleMatch = text.match(/TITLE:\s*(.+?)(?:\n|DESCRIPTION:)/i);
    const descMatch = text.match(/DESCRIPTION:\s*(.+)/is);

    return {
      title: titleMatch?.[1]?.trim() || 'Image',
      description: descMatch?.[1]?.trim() || text,
    };
  };
}
