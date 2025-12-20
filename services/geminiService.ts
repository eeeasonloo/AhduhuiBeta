
import { GoogleGenAI } from "@google/genai";

export const modifyImageWithAI = async (base64Image: string, prompt: string): Promise<string | null> => {
  try {
    // Robust check for API key
    let apiKey = "";
    try {
      // @ts-ignore
      apiKey = process.env.API_KEY || "";
    } catch (e) {
      console.warn("Could not access process.env.API_KEY directly.");
    }

    if (!apiKey) {
      console.warn("Gemini API key not found. Please ensure process.env.API_KEY is configured in your environment variables.");
      return null;
    }

    const ai = new GoogleGenAI({ apiKey });
    
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
            text: `Please edit this image based on the following instruction: ${prompt}. Return only the edited image in response.`,
          },
        ],
      },
    });

    if (!response.candidates?.[0]?.content?.parts) return null;

    for (const part of response.candidates[0].content.parts) {
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
