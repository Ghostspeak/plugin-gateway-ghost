/**
 * Text-to-Speech Handler
 *
 * Handles TEXT_TO_SPEECH model type via REST API.
 */

import type { IAgentRuntime } from '@elizaos/core';
import type { TextToSpeechParams } from '@elizaos/core';
import type { AIGatewayConfig } from '../config';

/**
 * Create TEXT_TO_SPEECH handler
 */
export function createTextToSpeechHandler(
  config: AIGatewayConfig
): (runtime: IAgentRuntime, params: Record<string, unknown>) => Promise<Buffer> {
  return async (runtime: IAgentRuntime, params: Record<string, unknown>) => {
    // Handle different input formats
    let text: string;
    let voice: string;
    let speed: number | undefined;
    const typedParams = params as unknown as TextToSpeechParams | string;

    if (typeof typedParams === 'string') {
      text = typedParams;
      voice = config.AI_GATEWAY_TTS_VOICE;
    } else if (typedParams && typeof typedParams === 'object' && 'text' in typedParams) {
      text = (typedParams as TextToSpeechParams).text;
      voice = (typedParams as TextToSpeechParams).voice || config.AI_GATEWAY_TTS_VOICE;
      speed = (typedParams as TextToSpeechParams).speed;
    } else {
      throw new Error('Invalid TTS params: expected text string or TextToSpeechParams');
    }

    // Call the gateway REST API for TTS
    const response = await fetch(`${config.AI_GATEWAY_BASE_URL}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.AI_GATEWAY_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.AI_GATEWAY_TTS_MODEL,
        input: text,
        voice,
        speed: speed || 1.0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TTS failed: ${error}`);
    }

    // Return audio as Buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  };
}
