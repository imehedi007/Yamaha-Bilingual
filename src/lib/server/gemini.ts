import { GoogleGenAI } from '@google/genai';

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return new GoogleGenAI({ apiKey });
};

export async function generatePersonaCopy(personaTitle: string, bikeModel: string) {
  const client = getClient();
  const model = process.env.AI_TEXT_MODEL || 'gemini-2.5-flash';

  const prompt = `Write a short, engaging, premium 2-sentence appreciation statement for a user whose riding personality is "${personaTitle}" and matched with the "${bikeModel}". Make it sound like a luxury automotive campaign.`;

  let retries = 3;
  let delay = 1000;
  
  while (retries > 0) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text;
    } catch (error: any) {
      if (error.status === 503 && retries > 1) {
        console.warn(`Gemini 503 error. Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        retries--;
        delay *= 2;
      } else {
        // Fallback text if the API completely fails
        console.error('Gemini text generation failed after retries:', error);
        return `Experience the thrill of the ride. You and the ${bikeModel} are a perfect match.`;
      }
    }
  }
  
  return `Experience the thrill of the ride. You and the ${bikeModel} are a perfect match.`;
}

export async function generateCinematicImage(
  base64Image: string,
  mimeType: string,
  prompt: string
) {
  getClient();
  const model = process.env.AI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';

  let retries = 3;
  let delay = 2000;
  const startedAt = Date.now();
  const referenceImageCopies = 3;

  console.log('[generateCinematicImage] starting request', {
    model,
    mimeType: mimeType || 'image/jpeg',
    promptLength: prompt.length,
    referenceImageCopies,
    referenceImageReason: 'intentional face-match boost',
    base64Chars: base64Image.length,
    approxInputBytes: Math.round((base64Image.length * 3) / 4),
  });

  while (retries > 0) {
    try {
      const attempt = 4 - retries;
      const attemptStartedAt = Date.now();
      const apiKey = process.env.GEMINI_API_KEY;
      const parts: any[] = [{ text: prompt }];
      // Intentionally send the same reference image 3 times to improve face matching.
      for (let i = 0; i < referenceImageCopies; i++) {
        parts.push({
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: base64Image
          }
        });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts
            }
          ],
          generationConfig: {
            responseModalities: ["IMAGE"],
            imageConfig: {
              aspectRatio: process.env.AI_IMAGE_ASPECT_RATIO || "3:4"
            }
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw { status: response.status, message: errorText };
      }

      const data = await response.json();
      
      const candidate = data.candidates?.[0];
      const resParts = candidate?.content?.parts;
      
      if (!Array.isArray(resParts)) {
        throw new Error("Gemini image response did not include any content parts.");
      }

      for (const part of resParts) {
        const base64Out = part?.inlineData?.data;
        const outMimeType = part?.inlineData?.mimeType || "image/png";
        if (typeof base64Out === "string" && base64Out.length > 0) {
          console.log('[generateCinematicImage] completed', {
            attempt,
            attemptMs: Date.now() - attemptStartedAt,
            totalMs: Date.now() - startedAt,
            outputMimeType: outMimeType,
            outputBase64Chars: base64Out.length,
          });
          return `data:${outMimeType};base64,${base64Out}`;
        }
      }

      throw new Error('No image payload found in response');
    } catch (err: any) {
      if (err.status === 503 && retries > 1) {
        const attempt = 4 - retries;
        console.warn('[generateCinematicImage] Gemini 503 error, retrying', {
          attempt,
          retryInMs: delay,
          elapsedMs: Date.now() - startedAt,
        });
        await new Promise(res => setTimeout(res, delay));
        retries--;
        delay *= 2;
      } else {
        console.error('[generateCinematicImage] failed', {
          elapsedMs: Date.now() - startedAt,
          error: err.message || err,
          status: err.status,
        });
        throw err;
      }
    }
  }
  
  throw new Error('Gemini image generation failed after retries');
}
