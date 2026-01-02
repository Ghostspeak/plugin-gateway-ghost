/**
 * Error Handling Utilities
 */

/**
 * AI Gateway specific error
 */
export class AIGatewayError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AIGatewayError';
  }
}

/**
 * Wrap handler errors with context
 */
export function wrapHandlerError(modelType: string, error: unknown): never {
  if (error instanceof AIGatewayError) {
    throw error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error ? error : undefined;

  throw new AIGatewayError(`${modelType} handler failed: ${message}`, 'HANDLER_ERROR', undefined, cause);
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('rate limit') || error.message.includes('429');
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('401') || error.message.includes('unauthorized');
  }
  return false;
}
