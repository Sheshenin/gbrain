import type { Recipe } from '../types.ts';

/** OpenRouter OpenAI-compatible gateway.
 * Used here for Andrey's second-brain MVP: cheap/free chat models plus
 * OpenRouter's embedding endpoint for gbrain vector search.
 */
export const openrouter: Recipe = {
  id: 'openrouter',
  name: 'OpenRouter',
  tier: 'openai-compat',
  implementation: 'openai-compatible',
  base_url_default: 'https://openrouter.ai/api/v1',
  auth_env: {
    required: ['OPENROUTER_API_KEY'],
    optional: [],
    setup_url: 'https://openrouter.ai/keys',
  },
  touchpoints: {
    embedding: {
      models: [
        'text-embedding-3-small',
        'text-embedding-3-large',
        'openai/text-embedding-3-small',
        'openai/text-embedding-3-large',
        'nvidia/llama-nemotron-embed-vl-1b-v2:free',
      ],
      default_dims: 2048,
      dims_options: [1536, 2048, 3072],
      price_last_verified: '2026-05-09',
    },
    expansion: {
      models: [
        'openrouter/free',
        'openai/gpt-oss-120b:free',
        'qwen/qwen3-coder:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'nousresearch/hermes-3-llama-3.1-405b:free',
      ],
      cost_per_1m_tokens_usd: 0,
      price_last_verified: '2026-05-09',
    },
    chat: {
      models: [
        'openrouter/free',
        'openai/gpt-oss-120b:free',
        'qwen/qwen3-coder:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'nousresearch/hermes-3-llama-3.1-405b:free',
      ],
      supports_tools: false,
      supports_subagent_loop: false,
      max_context_tokens: 131072,
      cost_per_1m_input_usd: 0,
      cost_per_1m_output_usd: 0,
      price_last_verified: '2026-05-09',
    },
  },
  setup_hint: 'Set OPENROUTER_API_KEY and use models like openrouter:openrouter/free or openrouter:text-embedding-3-small.',
};
