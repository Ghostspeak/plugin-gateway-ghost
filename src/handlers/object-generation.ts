/**
 * Object Generation Handlers
 *
 * Handles OBJECT_SMALL and OBJECT_LARGE model types for structured output.
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import type { IAgentRuntime } from '@elizaos/core';
import type { ObjectGenerationParams, JSONSchema } from '@elizaos/core';
import { getLanguageModel } from '../gateway';
import type { AIGatewayConfig } from '../config';

/**
 * Convert JSONSchema to Zod schema
 * This is a simplified converter for common schema patterns
 */
function jsonSchemaToZod(schema: JSONSchema): z.ZodTypeAny {
  switch (schema.type) {
    case 'string':
      return z.string();
    case 'number':
      return z.number();
    case 'integer':
      return z.number().int();
    case 'boolean':
      return z.boolean();
    case 'null':
      return z.null();
    case 'array':
      if (schema.items) {
        return z.array(jsonSchemaToZod(schema.items));
      }
      return z.array(z.unknown());
    case 'object':
      if (schema.properties) {
        const shape: Record<string, z.ZodTypeAny> = {};
        const required = schema.required || [];

        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const zodProp = jsonSchemaToZod(propSchema as JSONSchema);
          shape[key] = required.includes(key) ? zodProp : zodProp.optional();
        }

        return z.object(shape);
      }
      return z.record(z.unknown());
    default:
      return z.unknown();
  }
}

/**
 * Create object generation handler for a specific model
 */
export function createObjectHandler(
  config: AIGatewayConfig,
  modelId: string
): (runtime: IAgentRuntime, params: Record<string, unknown>) => Promise<Record<string, unknown>> {
  return async (runtime: IAgentRuntime, params: Record<string, unknown>) => {
    const objectParams = params as unknown as ObjectGenerationParams;
    const model = getLanguageModel(config, modelId);

    // Convert JSON schema to Zod if provided
    let zodSchema: z.ZodTypeAny | undefined;
    if (objectParams.schema) {
      zodSchema = jsonSchemaToZod(objectParams.schema);
    }

    // Handle enum output type
    if (objectParams.output === 'enum' && objectParams.enumValues) {
      const [first, ...rest] = objectParams.enumValues;
      const result = await generateObject({
        model,
        prompt: objectParams.prompt,
        output: 'enum',
        enum: [first, ...rest],
        temperature: objectParams.temperature,
      });
      return { value: result.object };
    }

    // Handle array output type
    if (objectParams.output === 'array') {
      if (!zodSchema) {
        zodSchema = z.array(z.unknown());
      }
      const result = await generateObject({
        model,
        prompt: objectParams.prompt,
        output: 'array',
        schema: zodSchema as z.ZodArray<z.ZodTypeAny>,
        temperature: objectParams.temperature,
      });
      return { items: result.object };
    }

    // Default: object output
    if (!zodSchema) {
      zodSchema = z.record(z.unknown());
    }

    const result = await generateObject({
      model,
      prompt: objectParams.prompt,
      schema: zodSchema,
      temperature: objectParams.temperature,
    });

    return result.object as Record<string, unknown>;
  };
}

/**
 * Create OBJECT_SMALL handler
 */
export function createObjectSmallHandler(config: AIGatewayConfig) {
  return createObjectHandler(config, config.AI_GATEWAY_TEXT_SMALL_MODEL);
}

/**
 * Create OBJECT_LARGE handler
 */
export function createObjectLargeHandler(config: AIGatewayConfig) {
  return createObjectHandler(config, config.AI_GATEWAY_TEXT_LARGE_MODEL);
}
