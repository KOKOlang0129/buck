import { AIProvider, AIRequest } from './types'

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const

  private readonly apiKey = process.env.GEMINI_API_KEY
  private readonly model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  private readonly baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com'

  private ensureConfigured() {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not set')
    }
  }

  async generate(request: AIRequest): Promise<string> {
    this.ensureConfigured()

    const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`
    const body = {
      contents: [
        {
          parts: [
            {
              text: request.system ? `${request.system}\n\n${request.prompt}` : request.prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 512
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Gemini API error: ${response.status} ${text}`)
    }

    const data = (await response.json()) as any
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) {
      throw new Error('Gemini API returned no content')
    }

    return content
  }
}

