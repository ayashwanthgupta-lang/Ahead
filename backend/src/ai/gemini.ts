import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';
import {
  simplifiedInstructionsSchema,
  checklistSchema,
  translationResponseSchema,
} from '../validators/schemas';
import { z } from 'zod';

export interface AIServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class GeminiProvider {
  private ai: GoogleGenAI;
  private model: string;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY || '' });
    this.model = env.GEMINI_MODEL || 'gemini-3.8-flash';
  }

  /**
   * Generates a structured simplified visit guide
   */
  async simplifyAppointmentInstructions(
    instructions: string,
    appointmentDetails?: Record<string, any>,
    preferredLanguage: string = 'en'
  ): Promise<AIServiceResponse<z.infer<typeof simplifiedInstructionsSchema>>> {
    try {
      if (!env.GEMINI_API_KEY) {
        return { success: false, error: 'GEMINI_API_KEY is not configured on the server.' };
      }

      const prompt = `
You are AHEAD's AI Accessibility Assistant.
Your core mission: "Technology should adapt to people, not force people to adapt to technology."
Simplify the following appointment instructions for someone visiting a college administrative or student service.

Guidelines:
1. Accuracy: Preserve all factual details (dates, deadlines, requirements, documents). Never invent details.
2. Accessibility: Plain-language, short sentences, active voice, screen-reader friendly.
3. If details are missing or unclear, list them in missing_information.
4. Output must strictly be valid JSON matching the schema below.

Language requested: ${preferredLanguage}
Appointment Context: ${appointmentDetails ? JSON.stringify(appointmentDetails) : 'Not specified'}

Source Instructions:
"""
${instructions}
"""

Return JSON in this EXACT format without markdown blocks:
{
  "title": "Clear friendly title",
  "simple_summary": "Short 2-3 sentence summary in plain language",
  "important_details": [
    { "label": "Time & Location", "value": "..." }
  ],
  "steps": [
    { "step_number": 1, "instruction": "..." }
  ],
  "things_to_bring": ["Item 1", "Item 2"],
  "questions_to_ask": ["Helpful question 1"],
  "missing_information": [],
  "warnings": []
}
`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const validated = simplifiedInstructionsSchema.parse(parsed);

      return { success: true, data: validated };
    } catch (err: any) {
      console.error('[GeminiProvider.simplifyAppointmentInstructions]', err.message);
      return { success: false, error: err.message || 'Failed to simplify appointment instructions' };
    }
  }

  /**
   * Generates a personalized preparation checklist
   */
  async generateChecklist(
    instructions: string,
    accessibilityPreferences: string[] = []
  ): Promise<AIServiceResponse<z.infer<typeof checklistSchema>>> {
    try {
      if (!env.GEMINI_API_KEY) {
        return { success: false, error: 'GEMINI_API_KEY is not configured on the server.' };
      }

      const prompt = `
You are AHEAD's AI Assistant. Generate an actionable, step-by-step personalized preparation checklist for a visit.

Accessibility preferences indicated by the user:
${accessibilityPreferences.length > 0 ? accessibilityPreferences.join(', ') : 'None specified'}

Instructions/Context:
"""
${instructions}
"""

Return JSON matching this schema:
{
  "preparation_summary": "Brief encouraging summary of what to prepare",
  "checklist": [
    {
      "task": "Specific clear action",
      "reason": "Why this helps the visit go smoothly",
      "priority": "low | medium | high",
      "completed": false
    }
  ],
  "reminders": ["Important reminder 1"]
}
`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const validated = checklistSchema.parse(parsed);

      return { success: true, data: validated };
    } catch (err: any) {
      console.error('[GeminiProvider.generateChecklist]', err.message);
      return { success: false, error: err.message || 'Failed to generate checklist' };
    }
  }

  /**
   * Translates text into target language while preserving exact meaning
   */
  async translateText(
    text: string,
    sourceLanguage: string = 'en',
    targetLanguage: string
  ): Promise<AIServiceResponse<z.infer<typeof translationResponseSchema>>> {
    try {
      if (!env.GEMINI_API_KEY) {
        return { success: false, error: 'GEMINI_API_KEY is not configured on the server.' };
      }

      const prompt = `
You are AHEAD's Accessible Translation Service.
Translate the following user text from ${sourceLanguage} to ${targetLanguage}.
Preserve tone, clarity, and exact personal intent. Never invent details.

Text to translate:
"""
${text}
"""

Return JSON matching this schema:
{
  "original_text": "${text.replace(/"/g, '\\"')}",
  "translated_text": "Translated message here",
  "source_language": "${sourceLanguage}",
  "target_language": "${targetLanguage}",
  "translation_notes": []
}
`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const textRes = response.text || '';
      const cleanJson = textRes.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const validated = translationResponseSchema.parse(parsed);

      return { success: true, data: validated };
    } catch (err: any) {
      console.error('[GeminiProvider.translateText]', err.message);
      return { success: false, error: err.message || 'Failed to translate message' };
    }
  }
}

export const geminiService = new GeminiProvider();

