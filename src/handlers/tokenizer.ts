/**
 * Tokenizer Handlers
 *
 * Handles TEXT_TOKENIZER_ENCODE and TEXT_TOKENIZER_DECODE using js-tiktoken.
 * Uses local tokenization (no API calls required).
 */

import { encodingForModel, getEncoding, type Tiktoken } from 'js-tiktoken';
import type { IAgentRuntime } from '@elizaos/core';
import type { TokenizeTextParams, DetokenizeTextParams } from '@elizaos/core';

// Cache tokenizer instances
const tokenizers = new Map<string, Tiktoken>();

/**
 * Get or create a tokenizer for the specified model
 */
function getTokenizer(modelType: string): Tiktoken {
  if (!tokenizers.has(modelType)) {
    try {
      // Try to get encoding for specific model
      const encoding = encodingForModel(modelType as Parameters<typeof encodingForModel>[0]);
      tokenizers.set(modelType, encoding);
    } catch {
      // Fall back to cl100k_base (GPT-4 / Claude compatible)
      if (!tokenizers.has('cl100k_base')) {
        tokenizers.set('cl100k_base', getEncoding('cl100k_base'));
      }
      return tokenizers.get('cl100k_base')!;
    }
  }
  return tokenizers.get(modelType)!;
}

/**
 * Create TEXT_TOKENIZER_ENCODE handler
 */
export function createTokenizerEncodeHandler(): (
  runtime: IAgentRuntime,
  params: Record<string, unknown>
) => Promise<number[]> {
  return async (runtime: IAgentRuntime, params: Record<string, unknown>) => {
    const tokenParams = params as unknown as TokenizeTextParams;
    const tokenizer = getTokenizer(tokenParams.modelType);
    return Array.from(tokenizer.encode(tokenParams.prompt));
  };
}

/**
 * Create TEXT_TOKENIZER_DECODE handler
 */
export function createTokenizerDecodeHandler(): (
  runtime: IAgentRuntime,
  params: Record<string, unknown>
) => Promise<string> {
  return async (runtime: IAgentRuntime, params: Record<string, unknown>) => {
    const detokenParams = params as unknown as DetokenizeTextParams;
    const tokenizer = getTokenizer(detokenParams.modelType);
    return tokenizer.decode(detokenParams.tokens);
  };
}
