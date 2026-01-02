/**
 * Text Embedding Handler
 *
 * Handles TEXT_EMBEDDING model type for vector embeddings.
 */

import { embed } from 'ai';
import type { IAgentRuntime } from '@elizaos/core';
import type { TextEmbeddingParams } from '@elizaos/core';
import { getEmbeddingModel } from '../gateway';
import type { AIGatewayConfig } from '../config';

/**
 * Create TEXT_EMBEDDING handler
 */
export function createTextEmbeddingHandler(
  config: AIGatewayConfig
): (runtime: IAgentRuntime, params: Record<string, unknown>) => Promise<number[]> {
  return async (runtime: IAgentRuntime, params: Record<string, unknown>) => {
    const embedParams = params as unknown as TextEmbeddingParams | string | null;
    // Handle different input formats
    let text: string;
    if (embedParams === null || embedParams === undefined) {
      throw new Error('Text is required for embedding');
    } else if (typeof embedParams === 'string') {
      text = embedParams;
    } else {
      text = embedParams.text;
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty for embedding');
    }

    const model = getEmbeddingModel(config, config.AI_GATEWAY_EMBEDDING_MODEL);

    const result = await embed({
      model,
      value: text,
    });

    return result.embedding;
  };
}
