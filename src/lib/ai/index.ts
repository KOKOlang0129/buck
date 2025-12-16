import { GeminiProvider } from './GeminiProvider'
import { OpenAIProvider } from './OpenAIProvider'
import { AIProvider, AIProviderName } from './types'

export const createAIProvider = (name?: AIProviderName): AIProvider => {
  const provider = (name || process.env.AI_PROVIDER || 'openai').toLowerCase() as AIProviderName

  switch (provider) {
    case 'gemini':
      return new GeminiProvider()
    case 'openai':
    default:
      return new OpenAIProvider()
  }
}

export * from './types'
export { OpenAIProvider, GeminiProvider }

