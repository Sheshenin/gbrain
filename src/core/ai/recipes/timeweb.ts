import type { Recipe } from '../types.ts';

/**
 * Timeweb AI Cloud — OpenAI-compatible provider for embedding, chat, and expansion.
 * Base URL: https://api.timeweb.ai/v1
 * Docs: https://timeweb.cloud/docs/ai
 */
export const timeweb: Recipe = {
  id: 'timeweb',
  name: 'Timeweb AI Cloud',
  tier: 'openai-compat',
  implementation: 'openai-compatible',
  base_url_default: 'https://api.timeweb.ai/v1',
  auth_env: {
    required: ['TIMEWEB_API_KEY'],
    optional: ['TIMEWEB_BASE_URL'],
    setup_url: 'https://timeweb.cloud/docs/ai',
  },
  touchpoints: {
    embedding: {
      models: ['text-embedding-3-large', 'text-embedding-3-small'],
      default_dims: 1536,
      dims_options: [256, 512, 1024, 1536, 3072],
      cost_per_1m_tokens_usd: 0.13,
      price_last_verified: '2026-05-13',
      max_batch_tokens: 8192,
      chars_per_token: 4,
      safety_factor: 0.8,
    },
    expansion: {
      models: ['openai/gpt-4o-mini', 'openai/gpt-4o'],
      cost_per_1m_tokens_usd: 0.15,
      price_last_verified: '2026-05-13',
    },
    chat: {
      models: ['openai/gpt-4o-mini', 'openai/gpt-4o', 'openai/gpt-4.1', 'deepseek/deepseek-chat'],
      supports_tools: true,
      supports_subagent_loop: true,
      cost_per_1m_input_usd: 0.15,
      cost_per_1m_output_usd: 0.60,
      price_last_verified: '2026-05-13',
    },
  },
  setup_hint: 'Set TIMEWEB_API_KEY from your Timeweb AI Cloud account.',
};
