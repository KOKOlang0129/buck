import { AIProvider, AIRequest } from './types'

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const

  private readonly apiKey = process.env.OPENAI_API_KEY
  private readonly baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  private readonly model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  private ensureConfigured() {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not set')
    }
  }

  async generate(request: AIRequest): Promise<string> {
    this.ensureConfigured()

    const body = {
      model: this.model,
      messages: [
        request.system ? { role: 'system' as const, content: request.system } : null,
        { role: 'user' as const, content: request.prompt }
      ].filter(Boolean),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 512
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`OpenAI API error: ${response.status} ${text}`)
    }

    const data = (await response.json()) as any
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('OpenAI API returned no content')
    }

    return content
  }
}

