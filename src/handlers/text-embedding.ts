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

    // Handle empty text gracefully - ElizaOS tests with empty string during initialization
    if (!text || text.trim().length === 0) {
      // Return a zero vector for empty text (3072 dimensions for text-embedding-3-large)
      return new Array(3072).fill(0);
    }

    console.log(`[AI Gateway] Generating embedding for text (${text.length} chars)`);
    const model = getEmbeddingModel(config, config.AI_GATEWAY_EMBEDDING_MODEL);

    const result = await embed({
      model,
      value: text,
    });

    console.log(`[AI Gateway] Embedding generated (${result.embedding.length} dimensions)`);
    return result.embedding;
  };
}
