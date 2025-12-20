
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const modifyImageWithAI = async (base64Image: string, prompt: string): Promise<string | null> => {
  if (!API_KEY) {
    console.error("API Key not found");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png',
            },
          },
          {
            text: `Please edit this image based on the following instruction: ${prompt}. Return only the edited image.`,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    return null;
  }
};
