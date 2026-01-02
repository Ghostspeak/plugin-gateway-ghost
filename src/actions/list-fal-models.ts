/**
 * List FAL Models Action
 *
 * Allows the agent to search and list available FAL.ai models dynamically.
 */

import type { Action, IAgentRuntime, Memory, State, HandlerCallback, ActionResult } from '@elizaos/core';
import {
  fetchFalModels,
  getImageModels,
  getVideoModels,
  get3DModels,
  searchModels,
  type FalModel,
  type FalModelSort,
} from '../handlers/fal-models';

/**
 * Format model for display
 */
function formatModel(model: FalModel): string {
  const tags = model.tags.length > 0 ? ` [${model.tags.join(', ')}]` : '';
  const status = model.deprecated ? ' (DEPRECATED)' : '';
  const updated = model.date ? ` - Added: ${new Date(model.date).toLocaleDateString()}` : '';

  return `- **${model.title}** (${model.id})${tags}${status}${updated}
  ${model.shortDescription || ''}`;
}

/**
 * List FAL Models Action
 */
export const listFalModelsAction: Action = {
  name: 'LIST_FAL_MODELS',
  description: 'Search and list available FAL.ai models for image, video, and 3D generation. Use this to discover the newest and best models.',
  similes: [
    'list fal models',
    'show fal models',
    'search fal models',
    'get fal models',
    'find fal models',
    'what models are available',
    'newest models',
    'latest models',
    'best image models',
    'best video models',
  ],
  examples: [
    [
      {
        name: 'user',
        content: { text: 'What are the newest image generation models on FAL?' },
      },
      {
        name: 'assistant',
        content: { text: 'Let me search for the newest FAL image models...', action: 'LIST_FAL_MODELS' },
      },
    ],
    [
      {
        name: 'user',
        content: { text: 'Show me video generation models' },
      },
      {
        name: 'assistant',
        content: { text: 'I\'ll list the available video generation models on FAL...', action: 'LIST_FAL_MODELS' },
      },
    ],
    [
      {
        name: 'user',
        content: { text: 'Search for FLUX models' },
      },
      {
        name: 'assistant',
        content: { text: 'Searching FAL for FLUX models...', action: 'LIST_FAL_MODELS' },
      },
    ],
  ],

  /**
   * Validate the action can run
   */
  validate: async (_runtime: IAgentRuntime, message: Memory, _state?: State): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';

    // Check for keywords that suggest model listing
    const keywords = [
      'fal model',
      'models available',
      'list model',
      'show model',
      'search model',
      'find model',
      'what model',
      'which model',
      'image model',
      'video model',
      '3d model',
      'newest model',
      'latest model',
      'best model',
      'flux',
      'minimax',
      'luma',
      'stable diffusion',
    ];

    return keywords.some((keyword) => text.includes(keyword));
  },

  /**
   * Handle the action
   */
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown> | undefined,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    const text = message.content?.text?.toLowerCase() || '';
    const settingValue = runtime.getSetting('FAL_API_KEY');
    const apiKey = typeof settingValue === 'string' ? settingValue : process.env.FAL_API_KEY;

    if (!apiKey) {
      if (callback) {
        await callback({
          text: 'FAL API key is not configured. Please set FAL_API_KEY to use model discovery.',
          action: 'LIST_FAL_MODELS',
        });
      }
      return { success: false, data: { error: 'FAL_API_KEY not configured' } };
    }

    try {
      // Determine category from message
      let category: 'image' | 'video' | '3d' | 'all' = 'all';
      if (text.includes('image') || text.includes('picture') || text.includes('photo')) {
        category = 'image';
      } else if (text.includes('video') || text.includes('animation')) {
        category = 'video';
      } else if (text.includes('3d') || text.includes('three-d') || text.includes('mesh')) {
        category = '3d';
      }

      // Determine sort preference
      let sort: FalModelSort = 'highlighted';
      if (text.includes('newest') || text.includes('latest') || text.includes('recent')) {
        sort = 'newest';
      } else if (text.includes('oldest')) {
        sort = 'oldest';
      } else if (text.includes('name') || text.includes('alphabetical')) {
        sort = 'name';
      }

      // Check for search query
      const searchMatch = text.match(/search(?:\s+for)?\s+["']?([^"']+)["']?/i);
      const queryMatch = text.match(/(?:find|show|list)\s+(?:me\s+)?["']?([a-zA-Z0-9\s]+)["']?\s+models?/i);
      const searchQuery = searchMatch?.[1] || queryMatch?.[1];

      let models: FalModel[] = [];
      let categoryLabel = '';

      if (searchQuery) {
        // Free-text search
        models = await searchModels(apiKey, searchQuery.trim(), { sort, limit: 20 });
        categoryLabel = `Search results for "${searchQuery.trim()}"`;
      } else if (category === 'image') {
        models = await getImageModels(apiKey, { sort, limit: 15 });
        categoryLabel = 'Image Generation Models (text-to-image)';
      } else if (category === 'video') {
        models = await getVideoModels(apiKey, { sort, limit: 15 });
        categoryLabel = 'Video Generation Models';
      } else if (category === '3d') {
        models = await get3DModels(apiKey, { sort, limit: 15 });
        categoryLabel = '3D Generation Models (image-to-3d)';
      } else {
        // Get top models from each category
        const [imageModels, videoModels] = await Promise.all([
          getImageModels(apiKey, { sort, limit: 8 }),
          getVideoModels(apiKey, { sort, limit: 8 }),
        ]);

        const responseText = `**FAL.ai Available Models** (sorted by ${sort})

## Image Generation (text-to-image)
${imageModels.map(formatModel).join('\n')}

## Video Generation
${videoModels.map(formatModel).join('\n')}

Use more specific queries like "show newest image models" or "search for FLUX models" for targeted results.`;

        if (callback) {
          await callback({
            text: responseText,
            action: 'LIST_FAL_MODELS',
          });
        }

        return {
          success: true,
          data: {
            imageModels: imageModels.map((m) => m.id),
            videoModels: videoModels.map((m) => m.id),
            sort,
          },
        };
      }

      // Format response for specific category or search
      const responseText = `**${categoryLabel}** (sorted by ${sort})

${models.length > 0 ? models.map(formatModel).join('\n\n') : 'No models found matching your criteria.'}

Total: ${models.length} model${models.length !== 1 ? 's' : ''}`;

      if (callback) {
        await callback({
          text: responseText,
          action: 'LIST_FAL_MODELS',
        });
      }

      return {
        success: true,
        data: {
          category,
          sort,
          searchQuery,
          models: models.map((m) => ({
            id: m.id,
            name: m.title,
            category: m.category,
            tags: m.tags,
            date: m.date,
          })),
          count: models.length,
        },
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (callback) {
        await callback({
          text: `Failed to fetch FAL models: ${errorMessage}`,
          action: 'LIST_FAL_MODELS',
        });
      }
      return { success: false, data: { error: errorMessage } };
    }
  },
};

export default listFalModelsAction;
