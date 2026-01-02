/**
 * AI Gateway Configuration
 *
 * Zod schema for validating environment variables and plugin configuration.
 * Uses Vercel AI Gateway with January 2026 model defaults.
 */

import { z } from 'zod';

/**
 * Configuration schema for the AI Gateway plugin
 */
export const aiGatewayConfigSchema = z.object({
  // Required: API key for Vercel AI Gateway
  AI_GATEWAY_API_KEY: z.string().min(1, 'AI_GATEWAY_API_KEY is required'),

  // Gateway endpoint (defaults to Vercel AI Gateway)
  AI_GATEWAY_BASE_URL: z
    .string()
    .url()
    .default('https://ai-gateway.vercel.sh/v1'),

  // Text generation models (January 2026 defaults)
  AI_GATEWAY_TEXT_SMALL_MODEL: z
    .string()
    .default('anthropic/claude-haiku-4.5'),
  AI_GATEWAY_TEXT_LARGE_MODEL: z
    .string()
    .default('anthropic/claude-opus-4.5'),

  // Embedding model
  AI_GATEWAY_EMBEDDING_MODEL: z
    .string()
    .default('openai/text-embedding-3-large'),

  // Image generation (FLUX is the current standard, not DALL-E)
  AI_GATEWAY_IMAGE_MODEL: z.string().default('bfl/flux-2-pro'),

  // Vision/multimodal
  AI_GATEWAY_VISION_MODEL: z.string().default('xai/grok-2-vision'),

  // Speech models
  AI_GATEWAY_TRANSCRIPTION_MODEL: z.string().default('openai/whisper-1'),
  AI_GATEWAY_TTS_MODEL: z.string().default('openai/tts-1-hd'),
  AI_GATEWAY_TTS_VOICE: z
    .enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'])
    .default('alloy'),
});

export type AIGatewayConfig = z.infer<typeof aiGatewayConfigSchema>;

/**
 * Parse and validate configuration from environment variables
 */
export function parseConfig(env: Record<string, string | undefined>): AIGatewayConfig {
  return aiGatewayConfigSchema.parse({
    AI_GATEWAY_API_KEY: env.AI_GATEWAY_API_KEY,
    AI_GATEWAY_BASE_URL: env.AI_GATEWAY_BASE_URL,
    AI_GATEWAY_TEXT_SMALL_MODEL: env.AI_GATEWAY_TEXT_SMALL_MODEL,
    AI_GATEWAY_TEXT_LARGE_MODEL: env.AI_GATEWAY_TEXT_LARGE_MODEL,
    AI_GATEWAY_EMBEDDING_MODEL: env.AI_GATEWAY_EMBEDDING_MODEL,
    AI_GATEWAY_IMAGE_MODEL: env.AI_GATEWAY_IMAGE_MODEL,
    AI_GATEWAY_VISION_MODEL: env.AI_GATEWAY_VISION_MODEL,
    AI_GATEWAY_TRANSCRIPTION_MODEL: env.AI_GATEWAY_TRANSCRIPTION_MODEL,
    AI_GATEWAY_TTS_MODEL: env.AI_GATEWAY_TTS_MODEL,
    AI_GATEWAY_TTS_VOICE: env.AI_GATEWAY_TTS_VOICE,
  });
}

/**
 * Get configuration with defaults (for optional config scenarios)
 */
export function getConfigWithDefaults(
  partial: Partial<AIGatewayConfig> & { AI_GATEWAY_API_KEY: string }
): AIGatewayConfig {
  return aiGatewayConfigSchema.parse(partial);
}
