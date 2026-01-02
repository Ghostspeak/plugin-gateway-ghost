/**
 * Transcription Handler
 *
 * Handles TRANSCRIPTION model type using Whisper via REST API.
 */

import type { IAgentRuntime } from '@elizaos/core';
import type { TranscriptionParams } from '@elizaos/core';
import type { AIGatewayConfig } from '../config';

/**
 * Create TRANSCRIPTION handler
 */
export function createTranscriptionHandler(
  config: AIGatewayConfig
): (runtime: IAgentRuntime, params: Record<string, unknown>) => Promise<string> {
  return async (runtime: IAgentRuntime, params: Record<string, unknown>) => {
    // Handle different input formats
    let audioData: Buffer | Blob;
    const typedParams = params as unknown as TranscriptionParams | Buffer | string;

    if (Buffer.isBuffer(typedParams)) {
      audioData = typedParams;
    } else if (typeof typedParams === 'string') {
      // Fetch audio from URL
      const response = await fetch(typedParams);
      audioData = Buffer.from(await response.arrayBuffer());
    } else if (typedParams && typeof typedParams === 'object' && 'audioUrl' in typedParams) {
      const response = await fetch((typedParams as TranscriptionParams).audioUrl);
      audioData = Buffer.from(await response.arrayBuffer());
    } else {
      throw new Error('Invalid transcription params: expected audio URL, Buffer, or TranscriptionParams');
    }

    // Create form data for the API request
    const formData = new FormData();
    formData.append('file', new Blob([audioData]), 'audio.mp3');
    formData.append('model', config.AI_GATEWAY_TRANSCRIPTION_MODEL);

    // Call the gateway REST API for transcription
    const response = await fetch(`${config.AI_GATEWAY_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.AI_GATEWAY_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transcription failed: ${error}`);
    }

    const result = (await response.json()) as { text: string };
    return result.text;
  };
}
