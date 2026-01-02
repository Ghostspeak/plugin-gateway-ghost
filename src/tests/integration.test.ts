/**
 * Integration Tests for AI Gateway Plugin
 *
 * Tests real API calls to Vercel AI Gateway
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { parseConfig } from '../config';
import {
  createTextSmallHandler,
  createTextLargeHandler,
  createTextEmbeddingHandler,
  createObjectSmallHandler,
  createImageDescriptionHandler,
  createImageHandler,
} from '../handlers';

// Test configuration
const API_KEY = 'vck_4xWq4ryNMa7otHji9RIHDG6Ls34VHgeZ0xM4vGCq2Iagyzkq7V1R8nbw';

const config = parseConfig({
  AI_GATEWAY_API_KEY: API_KEY,
});

// Mock runtime (minimal implementation for testing)
const mockRuntime = {
  agentId: 'test-agent',
  character: { name: 'TestAgent' },
  getSetting: () => undefined,
  getService: () => undefined,
} as any;

describe('AI Gateway Integration Tests', () => {
  beforeAll(() => {
    console.log('Testing with Vercel AI Gateway...');
    console.log('Models:', {
      textSmall: config.AI_GATEWAY_TEXT_SMALL_MODEL,
      textLarge: config.AI_GATEWAY_TEXT_LARGE_MODEL,
      embedding: config.AI_GATEWAY_EMBEDDING_MODEL,
    });
  });

  describe('Text Generation', () => {
    test('TEXT_SMALL generates text', async () => {
      const handler = createTextSmallHandler(config);
      const result = await handler(mockRuntime, {
        prompt: 'Say "Hello World" and nothing else.',
        maxTokens: 50,
        temperature: 0,
      });

      console.log('TEXT_SMALL result:', result);
      expect(typeof result).toBe('string');
      expect((result as string).toLowerCase()).toContain('hello');
    }, 30000);

    test('TEXT_LARGE generates text', async () => {
      const handler = createTextLargeHandler(config);
      const result = await handler(mockRuntime, {
        prompt: 'What is 2 + 2? Reply with just the number.',
        maxTokens: 10,
        temperature: 0,
      });

      console.log('TEXT_LARGE result:', result);
      expect(typeof result).toBe('string');
      expect((result as string)).toContain('4');
    }, 30000);

    test('TEXT_SMALL with streaming returns TextStreamResult', async () => {
      const handler = createTextSmallHandler(config);
      const chunks: string[] = [];

      const result = await handler(mockRuntime, {
        prompt: 'Say "hi".',
        maxTokens: 10,
        temperature: 0,
        stream: true,
      });

      // With stream: true, result should be a TextStreamResult with textStream
      expect(result).toBeTruthy();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('textStream');
      expect(result).toHaveProperty('text');

      // Consume stream to get text
      const streamResult = result as { textStream: AsyncIterable<string>; text: Promise<string> };
      for await (const chunk of streamResult.textStream) {
        chunks.push(chunk);
      }

      const fullText = await streamResult.text;
      console.log('Streamed text:', fullText);
      console.log('Chunks:', chunks.length);
      expect(fullText.toLowerCase()).toContain('hi');
    }, 30000);
  });

  describe('Text Embedding', () => {
    test('generates embeddings for text', async () => {
      const handler = createTextEmbeddingHandler(config);
      const result = await handler(mockRuntime, {
        text: 'Hello world, this is a test.',
      });

      console.log('Embedding dimensions:', result.length);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(typeof result[0]).toBe('number');
    }, 30000);

    test('generates embeddings from string param', async () => {
      const handler = createTextEmbeddingHandler(config);
      const result = await handler(mockRuntime, 'Simple text input' as any);

      console.log('Embedding from string:', result.length, 'dimensions');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Object Generation', () => {
    test('generates structured object', async () => {
      const handler = createObjectSmallHandler(config);
      const result = await handler(mockRuntime, {
        prompt: 'Generate a user profile with name "John" and age 30.',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
          },
          required: ['name', 'age'],
        },
      });

      console.log('Generated object:', result);
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('age');
    }, 30000);
  });

  describe('Image Generation (FLUX)', () => {
    test('generates an image from prompt', async () => {
      const handler = createImageHandler(config);
      const result = await handler(mockRuntime, {
        prompt: 'A simple red circle on a white background',
        size: '512x512',
        count: 1,
      });

      console.log('Image generation result:', result);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('url');
      expect(result[0].url.length).toBeGreaterThan(0);

      // Check if it's a data URL or regular URL
      const isValidUrl = result[0].url.startsWith('data:image/') || result[0].url.startsWith('http');
      expect(isValidUrl).toBe(true);
      console.log('Generated image URL type:', result[0].url.substring(0, 50) + '...');
    }, 120000); // Image gen can take longer
  });

  describe('Image Description (Vision)', () => {
    test('describes an image from URL', async () => {
      const handler = createImageDescriptionHandler(config);
      // Use a simple test image
      const result = await handler(mockRuntime, {
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/300px-PNG_transparency_demonstration_1.png',
        prompt: 'What do you see in this image?',
      });

      console.log('Image description:', result);
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result.description.length).toBeGreaterThan(0);
    }, 60000);
  });
});

describe('Configuration', () => {
  test('parses config with defaults', () => {
    const cfg = parseConfig({ AI_GATEWAY_API_KEY: 'test-key' });
    expect(cfg.AI_GATEWAY_TEXT_SMALL_MODEL).toBe('anthropic/claude-haiku-4.5');
    expect(cfg.AI_GATEWAY_TEXT_LARGE_MODEL).toBe('anthropic/claude-opus-4.5');
    expect(cfg.AI_GATEWAY_IMAGE_MODEL).toBe('bfl/flux-2-pro');
    expect(cfg.AI_GATEWAY_VISION_MODEL).toBe('xai/grok-2-vision');
  });

  test('throws on missing API key', () => {
    expect(() => parseConfig({})).toThrow();
  });
});
