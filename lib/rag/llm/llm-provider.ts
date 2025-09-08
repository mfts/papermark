// Re-export the new LLM interface
export type { LLMProvider } from './llm-interface';
export {
    OpenAIProvider,
    LLMService,
    LLMServiceFactory
} from './llm-interface';

import { getDefaultLLMService } from './llm-interface';
export { getDefaultLLMService };
export const llmProvider = getDefaultLLMService();
