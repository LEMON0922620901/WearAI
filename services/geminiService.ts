import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  // Always create a new instance to ensure we use the latest key from the environment
  // or the one injected by window.aistudio.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to convert base64 string to clean base64 data (stripping header)
const extractBase64Data = (base64Url: string): string => {
  return base64Url.split(',')[1];
};

// Helper to fetch an image from a URL and convert to Base64
export const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// AI Smart Prompt Enhancer
export const enhancePrompt = async (input: string): Promise<string> => {
  const ai = getAiClient();
  const prompt = `You are a high-end fashion designer.
  Rewrite the following simple user input into a detailed, professional fashion photography prompt for image generation.
  Focus on: Material textures, lighting, cut, style details, and color accuracy.
  Keep it concise (under 40 words) but descriptive.
  User Input: "${input}"
  
  Output ONLY the enhanced English prompt.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || input;
  } catch (e) {
    console.error("Prompt enhancement failed", e);
    return input;
  }
};

// AI Fashion Editor Critique
export const generateFashionCritique = async (personBase64: string, clothingBase64: string): Promise<string> => {
  const ai = getAiClient();
  const cleanPerson = extractBase64Data(personBase64);
  const cleanClothing = extractBase64Data(clothingBase64);

  const prompt = `你是《VOGUE》風格的時尚雜誌總編輯。
  請根據這兩張圖片（圖1：人物，圖2：服飾）想像穿搭效果。
  請用繁體中文寫一段 50-80 字的短評。
  
  要求：
  1. 語氣要專業、犀利但帶有幽默感。
  2. 點評這套搭配的風格、適合的場合，或是給人的氛圍。
  3. 像是一個很有品味的時尚人在說話。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanPerson } },
          { inlineData: { mimeType: 'image/jpeg', data: cleanClothing } },
          { text: prompt }
        ]
      }
    });
    return response.text?.trim() || "這套搭配展現了獨特的個人風格！";
  } catch (e) {
    console.error("Critique generation failed", e);
    return "時尚是自由的，這套搭配非常有潛力！";
  }
};

export const generateClothingImage = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  const fullPrompt = `Professional fashion catalog photography of ${prompt}, isolated on white background, studio lighting, high resolution, 4k.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Keep Flash for simple object generation speed
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Clothing generation error:", error);
    throw error;
  }
};

export const generateTryOnImage = async (personBase64: string, clothingBase64: string): Promise<string> => {
  const ai = getAiClient();
  
  // Clean base64 strings
  const cleanPerson = extractBase64Data(personBase64);
  const cleanClothing = extractBase64Data(clothingBase64);

  // Prompt engineering for virtual try-on using Pro model
  const prompt = `
    Advanced Virtual Try-On Task:
    1. Input 1: The model (Person).
    2. Input 2: The garment (Clothing).
    
    CRITICAL INSTRUCTION:
    - Generate a photorealistic image of the person from Input 1 WEARING the garment from Input 2.
    - DO NOT simply place the clothing next to the person. The clothing must physically WRAP around the body.
    - REPLACE the person's original upper/lower body clothing with the new garment.
    - PRESERVE the person's face, hair, head shape, and skin tone exactly.
    - Ensure natural fabric folds, shadows, and fit appropriate to the body pose.
    - High fashion editorial style, 4K resolution.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // Nano Banana Pro / Gemini 3 Pro Image
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanPerson
            }
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanClothing
            }
          },
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
            aspectRatio: "3:4",
            imageSize: "1K" 
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No try-on image generated.");

  } catch (error) {
    console.error("Try-on generation error:", error);
    throw error;
  }
};