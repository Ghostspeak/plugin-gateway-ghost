/**
 * AI Gateway Plugin
 *
 * Unified Vercel AI Gateway plugin for ElizaOS.
 * One API key for all model types: text, embeddings, images, speech, and more.
 * Also supports FAL.ai for additional image and video generation models.
 *
 * January 2026 defaults:
 * - TEXT_SMALL/LARGE: Claude Haiku 4.5 / Opus 4.5
 * - IMAGE: FLUX 2 Pro (via Vercel Gateway or FAL)
 * - VIDEO: MiniMax (via FAL)
 * - VISION: Grok 2 Vision
 * - EMBEDDING: text-embedding-3-large
 */

import type { Plugin, IAgentRuntime, ModelHandler } from '@elizaos/core';
import { ModelType, logger } from '@elizaos/core';
import { parseConfig, type AIGatewayConfig } from './config';
import {
  createTextSmallHandler,
  createTextLargeHandler,
  createTextCompletionHandler,
  createTextReasoningSmallHandler,
  createTextReasoningLargeHandler,
  createTextEmbeddingHandler,
  createObjectSmallHandler,
  createObjectLargeHandler,
  createImageHandler,
  createImageDescriptionHandler,
  createTranscriptionHandler,
  createTextToSpeechHandler,
  createTokenizerEncodeHandler,
  createTokenizerDecodeHandler,
  createFalImageHandler,
  createFalVideoHandler,
} from './handlers';

const PLUGIN_NAME = '@ghostspeak/plugin-gateway-ghost';
const PRIORITY = 10; // High priority to override defaults

/**
 * Create all model handlers from configuration
 */
function createModelHandlers(config: AIGatewayConfig): Record<string, ModelHandler> {
  const handlers: Record<string, ModelHandler> = {
    // Text generation
    [ModelType.TEXT_SMALL]: {
      handler: createTextSmallHandler(config),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    },
    [ModelType.TEXT_LARGE]: {
      handler: createTextLargeHandler(config),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    },
    [ModelType.TEXT_COMPLETION]: {
      handler: createTextCompletionHandler(config),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    },
    [ModelType.TEXT_REASONING_SMALL]: {
      handler: createTextReasoningSmallHandler(config),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    },
    [ModelType.TEXT_REASONING_LARGE]: {
      handler: createTextReasoningLargeHandler(config),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    },

    // Embeddings
    [ModelType.TEXT_EMBEDDING]: {
      handler: createTextEmbeddingHandler(config),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    },

    // Object generation
    [ModelType.OBJECT_SMALL]: {
      handler: createObjectSmallHandler(config),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    },
    [ModelType.OBJECT_LARGE]: {
      handler: createObjectLargeHandler(config),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    },

    // Image generation - use FAL if preferred and configured, otherwise Vercel Gateway
    [ModelType.IMAGE]: {
      handler:
        config.FAL_API_KEY && config.FAL_PREFER_FOR_IMAGES
          ? createFalImageHandler(config)
          : createImageHandler(config),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    },

    // Vision/multimodal (Grok 2 Vision)
    [ModelType.IMAGE_DESCRIPTION]: {
      handler: createImageDescriptionHandler(config),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    },

    // Speech
    [ModelType.TRANSCRIPTION]: {
      handler: createTranscriptionHandler(config),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    },
    [ModelType.TEXT_TO_SPEECH]: {
      handler: createTextToSpeechHandler(config),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    },

    // Tokenizers (local, no API calls)
    [ModelType.TEXT_TOKENIZER_ENCODE]: {
      handler: createTokenizerEncodeHandler(),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    },
    [ModelType.TEXT_TOKENIZER_DECODE]: {
      handler: createTokenizerDecodeHandler(),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    },
  };

  // Add VIDEO handler if FAL is configured
  if (config.FAL_API_KEY) {
    handlers[ModelType.VIDEO] = {
      handler: createFalVideoHandler(config),
      provider: PLUGIN_NAME,
      priority: PRIORITY,
    };
  }

  return handlers;
}

/**
 * AI Gateway Plugin
 */
export const aiGatewayPlugin: Plugin = {
  name: PLUGIN_NAME,
  description:
    'Unified Vercel AI Gateway - one API key for all models (Claude, FLUX, Grok Vision, Whisper, etc.)',

  /**
   * Initialize plugin and register model handlers
   */
  init: async (pluginConfig: Record<string, string>, runtime: IAgentRuntime) => {
    try {
      // Parse configuration from plugin config or environment
      const config = parseConfig({
        AI_GATEWAY_API_KEY: pluginConfig.AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_API_KEY,
        AI_GATEWAY_BASE_URL: pluginConfig.AI_GATEWAY_BASE_URL || process.env.AI_GATEWAY_BASE_URL,
        AI_GATEWAY_TEXT_SMALL_MODEL:
          pluginConfig.AI_GATEWAY_TEXT_SMALL_MODEL || process.env.AI_GATEWAY_TEXT_SMALL_MODEL,
        AI_GATEWAY_TEXT_LARGE_MODEL:
          pluginConfig.AI_GATEWAY_TEXT_LARGE_MODEL || process.env.AI_GATEWAY_TEXT_LARGE_MODEL,
        AI_GATEWAY_EMBEDDING_MODEL:
          pluginConfig.AI_GATEWAY_EMBEDDING_MODEL || process.env.AI_GATEWAY_EMBEDDING_MODEL,
        AI_GATEWAY_IMAGE_MODEL:
          pluginConfig.AI_GATEWAY_IMAGE_MODEL || process.env.AI_GATEWAY_IMAGE_MODEL,
        AI_GATEWAY_VISION_MODEL:
          pluginConfig.AI_GATEWAY_VISION_MODEL || process.env.AI_GATEWAY_VISION_MODEL,
        AI_GATEWAY_TRANSCRIPTION_MODEL:
          pluginConfig.AI_GATEWAY_TRANSCRIPTION_MODEL || process.env.AI_GATEWAY_TRANSCRIPTION_MODEL,
        AI_GATEWAY_TTS_MODEL: pluginConfig.AI_GATEWAY_TTS_MODEL || process.env.AI_GATEWAY_TTS_MODEL,
        AI_GATEWAY_TTS_VOICE: pluginConfig.AI_GATEWAY_TTS_VOICE || process.env.AI_GATEWAY_TTS_VOICE,
        // FAL configuration
        FAL_API_KEY: pluginConfig.FAL_API_KEY || process.env.FAL_API_KEY,
        FAL_IMAGE_MODEL: pluginConfig.FAL_IMAGE_MODEL || process.env.FAL_IMAGE_MODEL,
        FAL_VIDEO_MODEL: pluginConfig.FAL_VIDEO_MODEL || process.env.FAL_VIDEO_MODEL,
        FAL_PREFER_FOR_IMAGES:
          pluginConfig.FAL_PREFER_FOR_IMAGES || process.env.FAL_PREFER_FOR_IMAGES,
      });

      // Create handlers
      const handlers = createModelHandlers(config);

      // Register all handlers with runtime
      for (const [modelType, registration] of Object.entries(handlers)) {
        runtime.registerModel(
          modelType,
          registration.handler,
          registration.provider,
          registration.priority
        );
      }

      logger.info(
        {
          plugin: PLUGIN_NAME,
          models: Object.keys(handlers).length,
          textSmall: config.AI_GATEWAY_TEXT_SMALL_MODEL,
          textLarge: config.AI_GATEWAY_TEXT_LARGE_MODEL,
          image: config.FAL_API_KEY && config.FAL_PREFER_FOR_IMAGES
            ? `FAL: ${config.FAL_IMAGE_MODEL}`
            : config.AI_GATEWAY_IMAGE_MODEL,
          video: config.FAL_API_KEY ? config.FAL_VIDEO_MODEL : 'not configured',
          vision: config.AI_GATEWAY_VISION_MODEL,
          falEnabled: !!config.FAL_API_KEY,
        },
        'AI Gateway plugin initialized'
      );
    } catch (error) {
      logger.error({ error, plugin: PLUGIN_NAME }, 'Failed to initialize AI Gateway plugin');
      throw error;
    }
  },

  // Export model handlers for static registration if needed
  models: {},
};

export default aiGatewayPlugin;
