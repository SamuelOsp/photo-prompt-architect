import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  constructor() {}

  async generatePromptFromImage(base64Image: string, mimeType: string): Promise<string> {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ base64Image, mimeType })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to analyze image via server.';
        try {
          const errData = JSON.parse(errorText);
          errorMessage = errData.error || errorMessage;
        } catch {
          // ignore parsing error
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.text || '';
    } catch (error: any) {
      console.error('Gemini Service Client Error:', error);
      throw new Error(error.message || 'Failed to contact analysis server.');
    }
  }
}