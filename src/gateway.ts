/**
 * AI Gateway Client Factory
 *
 * Creates OpenAI-compatible clients for Vercel AI Gateway.
 * All models are accessed through a single endpoint with provider/model format.
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModelV1, EmbeddingModel } from 'ai';
import type { AIGatewayConfig } from './config';

// Singleton instance cache
let gatewayInstance: ReturnType<typeof createOpenAICompatible> | null = null;
let currentConfig: AIGatewayConfig | null = null;

/**
 * Create or return cached gateway client
 *
 * Uses OpenAI-compatible provider from Vercel AI SDK.
 * All models are accessed via provider/model-name format (e.g., anthropic/claude-opus-4.5)
 */
export function createGatewayClient(config: AIGatewayConfig) {
  // Return cached instance if config hasn't changed
  if (
    gatewayInstance &&
    currentConfig &&
    currentConfig.AI_GATEWAY_API_KEY === config.AI_GATEWAY_API_KEY &&
    currentConfig.AI_GATEWAY_BASE_URL === config.AI_GATEWAY_BASE_URL
  ) {
    return gatewayInstance;
  }

  // Create new gateway instance
  gatewayInstance = createOpenAICompatible({
    name: 'vercel-ai-gateway',
    baseURL: config.AI_GATEWAY_BASE_URL,
    headers: {
      Authorization: `Bearer ${config.AI_GATEWAY_API_KEY}`,
    },
  });

  currentConfig = config;
  return gatewayInstance;
}

/**
 * Get a language model from the gateway
 *
 * @param config - Gateway configuration
 * @param modelId - Full model ID (e.g., "anthropic/claude-opus-4.5")
 */
export function getLanguageModel(config: AIGatewayConfig, modelId: string): LanguageModelV1 {
  const gateway = createGatewayClient(config);
  return gateway.languageModel(modelId);
}

/**
 * Get an embedding model from the gateway
 *
 * @param config - Gateway configuration
 * @param modelId - Full model ID (e.g., "openai/text-embedding-3-large")
 */
export function getEmbeddingModel(config: AIGatewayConfig, modelId: string): EmbeddingModel<string> {
  const gateway = createGatewayClient(config);
  return gateway.textEmbeddingModel(modelId);
}

/**
 * Clear the gateway cache (useful for testing or config changes)
 */
export function clearGatewayCache() {
  gatewayInstance = null;
  currentConfig = null;
}
