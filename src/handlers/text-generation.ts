/**
 * Text Generation Handlers
 *
 * Handles TEXT_SMALL, TEXT_LARGE, TEXT_COMPLETION, TEXT_REASONING_SMALL, TEXT_REASONING_LARGE
 * with full streaming support.
 */

import { generateText, streamText } from 'ai';
import type { IAgentRuntime } from '@elizaos/core';
import type { GenerateTextParams, TextStreamResult } from '@elizaos/core';
import { getLanguageModel } from '../gateway';
import type { AIGatewayConfig } from '../config';

/**
 * Create a text generation handler for a specific model type
 */
export function createTextHandler(
  config: AIGatewayConfig,
  modelId: string
): (runtime: IAgentRuntime, params: Record<string, unknown>) => Promise<string | TextStreamResult> {
  return async (runtime: IAgentRuntime, params: Record<string, unknown>) => {
    const textParams = params as unknown as GenerateTextParams;
    const model = getLanguageModel(config, modelId);

    // Determine if we should stream
    const shouldStream = textParams.stream === true || (textParams.stream !== false && textParams.onStreamChunk);

    if (shouldStream) {
      // Streaming mode
      const result = await streamText({
        model,
        prompt: textParams.prompt,
        maxTokens: textParams.maxTokens,
        temperature: textParams.temperature,
        topP: textParams.topP,
        topK: textParams.topK,
        frequencyPenalty: textParams.frequencyPenalty,
        presencePenalty: textParams.presencePenalty,
        stopSequences: textParams.stopSequences,
      });

      // If there's a callback, pipe chunks to it
      if (textParams.onStreamChunk) {
        const callback = textParams.onStreamChunk;
        // Create async iterator that also calls the callback
        const textStreamWithCallback = (async function* () {
          for await (const chunk of result.textStream) {
            await callback(chunk);
            yield chunk;
          }
        })();

        return {
          textStream: textStreamWithCallback,
          text: result.text,
          usage: result.usage.then((u) =>
            u
              ? {
                  promptTokens: u.promptTokens,
                  completionTokens: u.completionTokens,
                  totalTokens: u.totalTokens,
                }
              : undefined
          ),
          finishReason: result.finishReason,
        } satisfies TextStreamResult;
      }

      // Return standard stream result
      return {
        textStream: result.textStream,
        text: result.text,
        usage: result.usage.then((u) =>
          u
            ? {
                promptTokens: u.promptTokens,
                completionTokens: u.completionTokens,
                totalTokens: u.totalTokens,
              }
            : undefined
        ),
        finishReason: result.finishReason,
      } satisfies TextStreamResult;
    }

    // Non-streaming mode
    const result = await generateText({
      model,
      prompt: textParams.prompt,
      maxTokens: textParams.maxTokens,
      temperature: textParams.temperature,
      topP: textParams.topP,
      topK: textParams.topK,
      frequencyPenalty: textParams.frequencyPenalty,
      presencePenalty: textParams.presencePenalty,
      stopSequences: textParams.stopSequences,
    });

    return result.text;
  };
}

/**
 * Create TEXT_SMALL handler (fast, efficient)
 */
export function createTextSmallHandler(config: AIGatewayConfig) {
  return createTextHandler(config, config.AI_GATEWAY_TEXT_SMALL_MODEL);
}

/**
 * Create TEXT_LARGE handler (best quality)
 */
export function createTextLargeHandler(config: AIGatewayConfig) {
  return createTextHandler(config, config.AI_GATEWAY_TEXT_LARGE_MODEL);
}

/**
 * Create TEXT_COMPLETION handler (same as TEXT_LARGE)
 */
export function createTextCompletionHandler(config: AIGatewayConfig) {
  return createTextHandler(config, config.AI_GATEWAY_TEXT_LARGE_MODEL);
}

/**
 * Create TEXT_REASONING_SMALL handler
 */
export function createTextReasoningSmallHandler(config: AIGatewayConfig) {
  return createTextHandler(config, config.AI_GATEWAY_TEXT_SMALL_MODEL);
}

/**
 * Create TEXT_REASONING_LARGE handler
 */
export function createTextReasoningLargeHandler(config: AIGatewayConfig) {
  return createTextHandler(config, config.AI_GATEWAY_TEXT_LARGE_MODEL);
}
