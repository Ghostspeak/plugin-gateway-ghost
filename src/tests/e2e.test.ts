/**
 * E2E Tests for AI Gateway Plugin with ElizaOS
 *
 * Tests the AI Gateway model handlers through ElizaOS API endpoints.
 * Requires ElizaOS to be running with Caisper character.
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { spawn, type Subprocess } from 'bun';

const ELIZAOS_PORT = 3456;
const ELIZAOS_URL = `http://localhost:${ELIZAOS_PORT}`;

// Skip if no API key is provided
const API_KEY = process.env.AI_GATEWAY_API_KEY || 'vck_4xWq4ryNMa7otHji9RIHDG6Ls34VHgeZ0xM4vGCq2Iagyzkq7V1R8nbw';

let elizaProcess: Subprocess | null = null;

/**
 * Wait for ElizaOS to be ready
 */
async function waitForElizaOS(maxWaitMs = 60000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await fetch(`${ELIZAOS_URL}/api/system/version`);
      if (response.ok) {
        console.log('ElizaOS is ready!');
        return true;
      }
    } catch {
      // Not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

/**
 * Get agent info from ElizaOS
 */
async function getAgentId(): Promise<string | null> {
  try {
    const response = await fetch(`${ELIZAOS_URL}/api/agents`);
    if (!response.ok) return null;
    const data = await response.json();
    // Return first agent ID
    if (Array.isArray(data) && data.length > 0) {
      return data[0].id;
    }
    if (data.agents && data.agents.length > 0) {
      return data.agents[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error getting agent ID:', error);
    return null;
  }
}

/**
 * Send a message to an agent and get response
 */
async function sendMessage(agentId: string, message: string): Promise<string | null> {
  try {
    const response = await fetch(`${ELIZAOS_URL}/api/agents/${agentId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: { text: message },
        roomId: 'test-room-' + Date.now(),
        senderId: 'test-user',
      }),
    });

    if (!response.ok) {
      console.error('Message failed:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.response || data.text || JSON.stringify(data);
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

describe('AI Gateway E2E Tests with ElizaOS', () => {
  let agentId: string | null = null;

  beforeAll(async () => {
    console.log('Starting ElizaOS with Caisper...');

    // Check if ElizaOS is already running
    const alreadyRunning = await waitForElizaOS(2000);

    if (!alreadyRunning) {
      console.log('ElizaOS not detected, please start it manually with:');
      console.log(`  cd packages/plugin-ghostspeak && AI_GATEWAY_API_KEY=${API_KEY} bunx elizaos start --port ${ELIZAOS_PORT}`);
      console.log('');
      console.log('Waiting for ElizaOS to become available...');

      const ready = await waitForElizaOS(120000);
      if (!ready) {
        throw new Error('ElizaOS did not start in time. Please start it manually.');
      }
    }

    // Get agent ID
    agentId = await getAgentId();
    console.log('Agent ID:', agentId);

    if (!agentId) {
      // Try a few more times
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        agentId = await getAgentId();
        if (agentId) break;
      }
    }

    expect(agentId).toBeTruthy();
  }, 180000);

  afterAll(async () => {
    // We don't stop ElizaOS since we didn't start it
    console.log('E2E tests complete');
  });

  test('ElizaOS health check', async () => {
    const response = await fetch(`${ELIZAOS_URL}/api/system/version`);
    expect(response.ok).toBe(true);
    const data = await response.json();
    console.log('ElizaOS version:', data);
  });

  test('List agents', async () => {
    const response = await fetch(`${ELIZAOS_URL}/api/agents`);
    expect(response.ok).toBe(true);
    const data = await response.json();
    console.log('Agents:', JSON.stringify(data, null, 2).slice(0, 500));
  });

  test('Agent responds to greeting (TEXT_SMALL)', async () => {
    if (!agentId) {
      console.log('Skipping - no agent ID');
      return;
    }

    const response = await sendMessage(agentId, 'Hello! Who are you?');
    console.log('Response to greeting:', response?.slice(0, 200));

    expect(response).toBeTruthy();
    // Caisper should identify itself
    expect(response?.toLowerCase()).toMatch(/caisper|ghost|credential|reputation/i);
  }, 60000);

  test('Agent checks reputation (uses GhostSpeak action)', async () => {
    if (!agentId) {
      console.log('Skipping - no agent ID');
      return;
    }

    const response = await sendMessage(
      agentId,
      "What's the Ghost Score for agent address 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU?"
    );
    console.log('Reputation response:', response?.slice(0, 300));

    expect(response).toBeTruthy();
  }, 60000);

  test('Agent handles complex query (TEXT_LARGE)', async () => {
    if (!agentId) {
      console.log('Skipping - no agent ID');
      return;
    }

    const response = await sendMessage(
      agentId,
      'Explain how Ghost Scores work on the GhostSpeak network and what factors influence reputation.'
    );
    console.log('Complex query response:', response?.slice(0, 500));

    expect(response).toBeTruthy();
    expect(response!.length).toBeGreaterThan(100);
  }, 60000);
});

// Simple test that can run without ElizaOS
describe('AI Gateway Direct Handler Tests', () => {
  test('Configuration is valid', async () => {
    const { parseConfig } = await import('../config');
    const config = parseConfig({
      AI_GATEWAY_API_KEY: API_KEY,
    });

    expect(config.AI_GATEWAY_API_KEY).toBe(API_KEY);
    expect(config.AI_GATEWAY_TEXT_SMALL_MODEL).toBe('anthropic/claude-haiku-4.5');
    expect(config.AI_GATEWAY_TEXT_LARGE_MODEL).toBe('anthropic/claude-opus-4.5');
    expect(config.AI_GATEWAY_IMAGE_MODEL).toBe('bfl/flux-2-pro');
  });

  test('Text generation works directly', async () => {
    const { parseConfig } = await import('../config');
    const { createTextSmallHandler } = await import('../handlers');

    const config = parseConfig({
      AI_GATEWAY_API_KEY: API_KEY,
    });

    const handler = createTextSmallHandler(config);
    const result = await handler({} as any, {
      prompt: 'Say "test passed" and nothing else.',
      maxTokens: 50,
      temperature: 0,
    });

    console.log('Direct handler result:', result);
    expect(typeof result).toBe('string');
    expect((result as string).toLowerCase()).toContain('test');
  }, 30000);

  test('Embeddings work directly', async () => {
    const { parseConfig } = await import('../config');
    const { createTextEmbeddingHandler } = await import('../handlers');

    const config = parseConfig({
      AI_GATEWAY_API_KEY: API_KEY,
    });

    const handler = createTextEmbeddingHandler(config);
    const result = await handler({} as any, {
      text: 'Ghost Score reputation test',
    });

    console.log('Embedding dimensions:', result.length);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]).toBe('number');
  }, 30000);
});
