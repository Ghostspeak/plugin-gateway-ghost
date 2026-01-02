# @ghostspeak/plugin-gateway-ghost

Unified Vercel AI Gateway plugin for ElizaOS - **one API key** for all model types.

## Features

- **Single API Key**: One `AI_GATEWAY_API_KEY` for all model operations
- **January 2026 Models**: Claude Haiku/Opus 4.5, FLUX 2 Pro, Grok 2 Vision
- **Full Model Coverage**: Text, embeddings, images, vision, speech, transcription
- **Streaming Support**: Full async streaming for text generation
- **Local Tokenization**: Uses js-tiktoken, no API calls needed

## Supported Model Types

| ModelType | Default Model | Description |
|-----------|---------------|-------------|
| TEXT_SMALL | `anthropic/claude-haiku-4.5` | Fast, efficient text |
| TEXT_LARGE | `anthropic/claude-opus-4.5` | Best quality reasoning |
| TEXT_EMBEDDING | `openai/text-embedding-3-large` | 3072-dim embeddings |
| OBJECT_SMALL | `anthropic/claude-haiku-4.5` | Structured JSON output |
| OBJECT_LARGE | `anthropic/claude-opus-4.5` | Complex structured output |
| IMAGE | `bfl/flux-2-pro` | Image generation (FLUX) |
| IMAGE_DESCRIPTION | `xai/grok-2-vision` | Vision/multimodal |
| TRANSCRIPTION | `openai/whisper-1` | Speech-to-text |
| TEXT_TO_SPEECH | `openai/tts-1-hd` | Text-to-speech (HD) |
| TEXT_TOKENIZER_* | (local) | Token encode/decode |

## Installation

```bash
npm install @ghostspeak/plugin-gateway-ghost
# or
bun add @ghostspeak/plugin-gateway-ghost
```

## Configuration

### Environment Variables

```bash
# Required
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key

# Optional (with defaults)
AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v1
AI_GATEWAY_TEXT_SMALL_MODEL=anthropic/claude-haiku-4.5
AI_GATEWAY_TEXT_LARGE_MODEL=anthropic/claude-opus-4.5
AI_GATEWAY_EMBEDDING_MODEL=openai/text-embedding-3-large
AI_GATEWAY_IMAGE_MODEL=bfl/flux-2-pro
AI_GATEWAY_VISION_MODEL=xai/grok-2-vision
AI_GATEWAY_TRANSCRIPTION_MODEL=openai/whisper-1
AI_GATEWAY_TTS_MODEL=openai/tts-1-hd
AI_GATEWAY_TTS_VOICE=alloy
```

### Character Configuration

```json
{
  "name": "YourAgent",
  "plugins": ["@ghostspeak/plugin-gateway-ghost"],
  "bio": "Your agent bio..."
}
```

## Usage

The plugin automatically registers model handlers when loaded. ElizaOS will use these handlers for all model operations:

```typescript
// The plugin registers handlers for:
// - runtime.generateText() -> TEXT_SMALL/TEXT_LARGE
// - runtime.embed() -> TEXT_EMBEDDING
// - runtime.generateObject() -> OBJECT_SMALL/OBJECT_LARGE
// - runtime.generateImage() -> IMAGE
// - etc.
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Test (requires AI_GATEWAY_API_KEY)
AI_GATEWAY_API_KEY=your_key bun test
```

## License

MIT
