/**
 * @ghostspeak/plugin-ai-gateway
 *
 * Unified Vercel AI Gateway plugin for ElizaOS.
 * One API key for all model types - text, embeddings, images, speech, and more.
 *
 * January 2026 model defaults:
 * - TEXT_SMALL: anthropic/claude-haiku-4.5
 * - TEXT_LARGE: anthropic/claude-opus-4.5
 * - IMAGE: bfl/flux-2-pro (not DALL-E)
 * - VISION: xai/grok-2-vision
 * - EMBEDDING: openai/text-embedding-3-large
 * - TTS: openai/tts-1-hd
 * - TRANSCRIPTION: openai/whisper-1
 */

// Main plugin export
export { aiGatewayPlugin } from './plugin';
export { default } from './plugin';

// Configuration
export { aiGatewayConfigSchema, parseConfig, getConfigWithDefaults, type AIGatewayConfig } from './config';

// Gateway client
export { createGatewayClient, getLanguageModel, getEmbeddingModel, clearGatewayCache } from './gateway';

// Handlers (for custom usage)
export {
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
  // FAL.ai handlers
  createFalImageHandler,
  createFalVideoHandler,
  FAL_MODELS,
  // FAL model discovery
  fetchFalModels,
  fetchAllFalModels,
  getImageModels,
  getVideoModels,
  get3DModels,
  searchModels,
  getModel,
  createFalModelsProvider,
  type FalModel,
  type FalModelMetadata,
  type FalModelsResponse,
  type FalModelSort,
  type FalModelFilters,
} from './handlers';

// Actions
export { listFalModelsAction } from './actions';

// Utilities
export { AIGatewayError, isRateLimitError, isAuthError } from './utils/error-handler';
