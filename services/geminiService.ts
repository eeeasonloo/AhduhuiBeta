
import { GoogleGenAI } from "@google/genai";

export const modifyImageWithAI = async (base64Image: string, prompt: string): Promise<string | null> => {
  try {
    let apiKey = "";
    try {
      // @ts-ignore
      apiKey = process.env.API_KEY || "";
    } catch (e) {
      console.warn("Could not access process.env.API_KEY.");
    }

    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    
    // We use gemini-2.5-flash-image for high-speed creative transformations
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
            text: `You are a master character designer and digital artist. 
            Instruction: ${prompt}. 
            Keep the original pose, composition, and background. 
            Transform the main subject only. 
            Return the final edited image as raw image data.`,
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
    console.error("Error transforming image:", error);
    return null;
  }
};
