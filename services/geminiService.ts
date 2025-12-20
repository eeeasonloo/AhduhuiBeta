
import { GoogleGenAI } from "@google/genai";

export const modifyImageWithAI = async (base64Image: string, prompt: string): Promise<string | null> => {
  try {
    // Obtain the API key from process.env.API_KEY safely within the function execution context.
    // If process is undefined in a pure browser context, this allows the UI to catch the error
    // rather than crashing at module load.
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : "";
    
    if (!apiKey) {
      console.warn("Gemini API key not found in environment.");
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
