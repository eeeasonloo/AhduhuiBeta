
import { GoogleGenAI } from "@google/genai";

export const modifyImageWithAI = async (base64Image: string, prompt: string): Promise<string | null> => {
  try {
    // Initialize AI client using the provided environment variable
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-2.5-flash-image for high-quality image editing/transformations
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
            text: `ACT AS A PROFESSIONAL POLAROID ARTIST. 
            TASK: Transform this photo based on the following instruction: "${prompt}". 
            Maintain the user's basic composition and pose. 
            Ensure the result looks like a high-quality artistic photograph.
            Return ONLY the modified image.`,
          },
        ],
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      console.error("No content parts in Gemini response");
      return null;
    }

    // Iterate through parts to find the image data, as per SDK guidelines
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    console.warn("No inlineData found in response parts");
    return null;
  } catch (error: any) {
    if (error?.message?.includes("entity was not found")) {
      console.error("API Key error or Model not found. Check Vercel Environment Variables.");
    }
    console.error("Gemini AI Transformation failed:", error);
    return null;
  }
};
