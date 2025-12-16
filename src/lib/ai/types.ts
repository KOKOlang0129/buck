export type AIProviderName = 'openai' | 'gemini'

export interface AIRequest {
  prompt: string
  system?: string
  temperature?: number
  maxTokens?: number
}

export interface AIProvider {
  readonly name: AIProviderName
  generate(request: AIRequest): Promise<string>
}

