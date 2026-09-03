import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * ============================================================================
 * Explication pour les non-informaticiens :
 * Ce fichier est notre "messager" avec l'Intelligence Artificielle (Groq).
 * Son rôle est d'envoyer nos questions (prompts) à l'IA de Groq de 
 * manière sécurisée. Groq est utilisé à la place de Claude car il est très 
 * rapide et gratuit.
 * ============================================================================
 */
@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GROQ_API_KEY') || '';
    this.model = 'qwen/qwen3.6-27b';
  }

  async completeJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    try {
      const finalSystem = systemPrompt + "\nYou must output solely valid JSON.";
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          temperature: 0.1,
          messages: [
            { role: "system", content: finalSystem },
            { role: "user", content: userPrompt }
          ]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Erreur Groq");

      let content = data.choices[0].message.content;
      content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      let start = content.indexOf('{');
      if (start !== -1) {
        let count = 0;
        for (let i = start; i < content.length; i++) {
          if (content[i] === '{') count++;
          else if (content[i] === '}') {
            count--;
            if (count === 0) {
              content = content.substring(start, i + 1);
              break;
            }
          }
        }
      }
      return JSON.parse(content) as T;
    } catch (err) {
      this.logger.error('Erreur appel Groq (JSON)', err as Error);
      throw new InternalServerErrorException('Service IA indisponible (Groq JSON)');
    }
  }

  async completeText(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          temperature: 0.3,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Erreur Groq");
      let content = data.choices[0].message.content;
      return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    } catch (err) {
      this.logger.error('Erreur appel Groq (Texte)', err as Error);
      throw new InternalServerErrorException('Service IA indisponible (Groq)');
    }
  }
}
