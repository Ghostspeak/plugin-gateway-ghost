/**
 * FAL.ai Model Discovery
 *
 * Fetch and filter available FAL models dynamically.
 * Uses the FAL /models API for real-time model discovery.
 *
 * @see https://docs.fal.ai/model-apis
 */

import type { AIGatewayConfig } from '../config';

const FAL_API_BASE = 'https://fal.ai/api';

/**
 * Model from FAL API (actual response format)
 */
export interface FalModel {
  id: string;
  modelId: string;
  title: string;
  category: string;
  tags: string[];
  shortDescription: string;
  thumbnailUrl: string;
  modelUrl: string;
  githubUrl?: string;
  licenseType?: 'commercial' | 'research' | 'private';
  date: string;
  creditsRequired?: number;
  group?: { key: string; label: string };
  machineType?: string;
  thumbnailAnimatedUrl?: string;
  durationEstimate?: number;
  highlighted: boolean;
  deprecated: boolean;
  isFavorited: boolean;
  kind?: 'inference' | 'training';
}

/**
 * Model metadata (normalized interface for compatibility)
 */
export interface FalModelMetadata {
  display_name: string;
  category: string;
  description: string;
  status: 'active' | 'deprecated';
  tags: string[];
  updated_at: string;
  is_favorited: boolean | null;
  thumbnail_url: string;
  model_url: string;
  date: string;
  highlighted: boolean;
  pinned: boolean;
  license_type?: 'commercial' | 'research' | 'private';
  duration_estimate?: number;
}

/**
 * Response from FAL /models API (actual format)
 */
export interface FalModelsResponse {
  items: FalModel[];
  nextCursor?: string;
}

/**
 * Sort options for model listing
 */
export type FalModelSort = 'newest' | 'oldest' | 'highlighted' | 'name';

/**
 * Filter options for model listing
 */
export interface FalModelFilters {
  /** Free-text search query */
  query?: string;
  /** Filter by category (e.g., 'text-to-image', 'image-to-video') */
  category?: string;
  /** Filter by status */
  status?: 'active' | 'deprecated';
  /** Sort order */
  sort?: FalModelSort;
  /** Maximum number of models to return */
  limit?: number;
  /** Pagination cursor */
  cursor?: string;
}

/**
 * Fetch models from FAL API
 */
export async function fetchFalModels(
  apiKey: string | undefined,
  filters: FalModelFilters = {}
): Promise<FalModelsResponse> {
  const params = new URLSearchParams();

  if (filters.query) {
    params.set('q', filters.query);
  }
  if (filters.category) {
    params.set('category', filters.category);
  }
  // FAL uses 'deprecated' boolean, we only show non-deprecated by default
  if (filters.status === 'active') {
    params.set('deprecated', 'false');
  } else if (filters.status === 'deprecated') {
    params.set('deprecated', 'true');
  }
  if (filters.limit) {
    params.set('limit', filters.limit.toString());
  }
  if (filters.cursor) {
    params.set('cursor', filters.cursor);
  }

  const url = `${FAL_API_BASE}/models${params.toString() ? `?${params.toString()}` : ''}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // API key is optional but provides higher rate limits
  if (apiKey) {
    headers['Authorization'] = `Key ${apiKey}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({ error: { message: response.statusText } }))) as {
      error?: { message?: string };
    };
    throw new Error(`FAL API error: ${errorData.error?.message || response.statusText}`);
  }

  let data: FalModelsResponse;
  try {
    data = (await response.json()) as FalModelsResponse;
  } catch {
    throw new Error('Failed to parse FAL API response');
  }

  // Apply client-side sorting if requested
  if (filters.sort && data.items.length > 0) {
    data.items = sortModels(data.items, filters.sort);
  }

  return data;
}

/**
 * Sort models by specified criteria
 */
function sortModels(models: FalModel[], sort: FalModelSort): FalModel[] {
  return [...models].sort((a, b) => {
    switch (sort) {
      case 'newest':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'oldest':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'highlighted':
        // Highlighted first, then by date
        if (b.highlighted !== a.highlighted) {
          return b.highlighted ? 1 : -1;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'name':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
}

/**
 * Fetch all models with pagination
 */
export async function fetchAllFalModels(
  apiKey: string | undefined,
  filters: Omit<FalModelFilters, 'cursor'> = {},
  maxPages = 10
): Promise<FalModel[]> {
  const allModels: FalModel[] = [];
  let cursor: string | undefined;
  let pages = 0;

  do {
    const response = await fetchFalModels(apiKey, { ...filters, cursor });
    allModels.push(...response.items);
    cursor = response.nextCursor;
    pages++;
  } while (cursor && pages < maxPages);

  // Apply sorting to all fetched models
  if (filters.sort) {
    return sortModels(allModels, filters.sort);
  }

  return allModels;
}

/**
 * Get image generation models
 */
export async function getImageModels(
  apiKey: string | undefined,
  options: { sort?: FalModelSort; limit?: number } = {}
): Promise<FalModel[]> {
  const response = await fetchFalModels(apiKey, {
    status: 'active',
    sort: options.sort || 'newest',
    limit: 100, // Fetch more to filter client-side
  });
  // Filter to only text-to-image models
  const imageModels = response.items.filter((m) => m.category === 'text-to-image');
  return imageModels.slice(0, options.limit || 50);
}

/**
 * Get video generation models
 */
export async function getVideoModels(
  apiKey: string | undefined,
  options: { sort?: FalModelSort; limit?: number } = {}
): Promise<FalModel[]> {
  const response = await fetchFalModels(apiKey, {
    status: 'active',
    sort: options.sort || 'newest',
    limit: 100, // Fetch more to filter client-side
  });
  // Filter to only video models (text-to-video and image-to-video)
  const videoModels = response.items.filter(
    (m) => m.category === 'text-to-video' || m.category === 'image-to-video'
  );
  return videoModels.slice(0, options.limit || 50);
}

/**
 * Get 3D generation models
 */
export async function get3DModels(
  apiKey: string | undefined,
  options: { sort?: FalModelSort; limit?: number } = {}
): Promise<FalModel[]> {
  const response = await fetchFalModels(apiKey, {
    status: 'active',
    sort: options.sort || 'newest',
    limit: 100, // Fetch more to filter client-side
  });
  // Filter to only 3D models
  const models3d = response.items.filter(
    (m) => m.category === 'image-to-3d' || m.category === 'text-to-3d'
  );
  return models3d.slice(0, options.limit || 50);
}

/**
 * Search models by query
 */
export async function searchModels(
  apiKey: string | undefined,
  query: string,
  options: { sort?: FalModelSort; limit?: number; category?: string } = {}
): Promise<FalModel[]> {
  const response = await fetchFalModels(apiKey, {
    query,
    category: options.category,
    status: 'active',
    sort: options.sort || 'highlighted',
    limit: options.limit || 50,
  });
  return response.items;
}

/**
 * Get a specific model by id
 */
export async function getModel(
  apiKey: string | undefined,
  modelId: string
): Promise<FalModel | null> {
  const url = `${FAL_API_BASE}/models?q=${encodeURIComponent(modelId)}&limit=1`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Key ${apiKey}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorData = (await response.json().catch(() => ({ error: { message: response.statusText } }))) as {
      error?: { message?: string };
    };
    throw new Error(`FAL API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = (await response.json()) as FalModelsResponse;
  // Find exact match by id
  return data.items.find((m) => m.id === modelId) || data.items[0] || null;
}

/**
 * Format a model for display
 */
function formatModelDisplay(m: FalModel): string {
  const tags = m.tags.length > 0 ? ` [${m.tags.join(', ')}]` : '';
  return `${m.title} (${m.id})${tags}`;
}

/**
 * Create a FAL models provider for ElizaOS
 * Returns model information as context for the agent
 */
export function createFalModelsProvider(config: AIGatewayConfig) {
  return {
    name: 'FAL_MODELS',
    description: 'Provides information about available FAL.ai models for image, video, and 3D generation',
    position: 50,
    get: async () => {
      if (!config.FAL_API_KEY) {
        return {
          text: 'FAL models: Not configured (FAL_API_KEY not set)',
          data: { configured: false },
        };
      }

      try {
        // Fetch top models from each category
        const [imageModels, videoModels] = await Promise.all([
          getImageModels(config.FAL_API_KEY, { sort: 'highlighted', limit: 5 }),
          getVideoModels(config.FAL_API_KEY, { sort: 'highlighted', limit: 5 }),
        ]);

        const text = `FAL.ai Models Available:

**Image Generation (text-to-image):**
${imageModels.map((m) => `- ${formatModelDisplay(m)}`).join('\n')}

**Video Generation:**
${videoModels.map((m) => `- ${formatModelDisplay(m)}`).join('\n')}

Current defaults:
- Image: ${config.FAL_IMAGE_MODEL}
- Video: ${config.FAL_VIDEO_MODEL}`;

        return {
          text,
          data: {
            configured: true,
            imageModels: imageModels.map((m) => ({
              id: m.id,
              name: m.title,
              tags: m.tags,
            })),
            videoModels: videoModels.map((m) => ({
              id: m.id,
              name: m.title,
              tags: m.tags,
            })),
            currentDefaults: {
              image: config.FAL_IMAGE_MODEL,
              video: config.FAL_VIDEO_MODEL,
            },
          },
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return {
          text: `FAL models: Error fetching models - ${message}`,
          data: { configured: true, error: message },
        };
      }
    },
  };
}
