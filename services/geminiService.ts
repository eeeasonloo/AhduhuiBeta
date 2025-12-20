
import { GoogleGenAI } from "@google/genai";

export const modifyImageWithAI = async (base64Image: string, prompt: string): Promise<string | null> => {
  try {
    let apiKey = "";
    try {
      // @ts-ignore
      apiKey = process.env.API_KEY || "";
    } catch (e) {
      console.error("API Key access error:", e);
    }

    if (!apiKey) {
      console.warn("Gemini API Key is missing. Check your environment.");
      return null;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-2.5-flash-image for character transformations
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
            text: `ACT AS A CHARACTER ARTIST. 
            TASK: ${prompt}. 
            Maintain the user's exact pose, background, and lighting. 
            ONLY transform the person in the frame. 
            If 'Anime', use modern 2D high-res anime style. 
            If 'Zootopia', use Disney 3D anthropomorphic animal style. 
            Return ONLY the modified image.`,
          },
        ],
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      console.error("Empty response from Gemini API");
      return null;
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    console.warn("No image part found in Gemini response parts");
    return null;
  } catch (error) {
    console.error("Gemini AI Transformation failed:", error);
    return null;
  }
};
