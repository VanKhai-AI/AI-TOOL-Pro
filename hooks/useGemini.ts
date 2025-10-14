import { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, GenerateContentParameters, GroundingMetadata } from '@google/genai';

const useGemini = () => {
    const [result, setResult] = useState<string | null>(null);
    const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isCancelledRef = useRef(false);

    const clearResult = useCallback(() => {
        setResult(null);
        setGroundingMetadata(null);
        setError(null);
    }, []);
    
    const generateContent = useCallback(async (params: GenerateContentParameters) => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setGroundingMetadata(null);
        isCancelledRef.current = false;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const response = await ai.models.generateContent(params);
            
            if (isCancelledRef.current) return;
            
            setResult(response.text);

            if (response.candidates?.[0]?.groundingMetadata) {
                setGroundingMetadata(response.candidates[0].groundingMetadata);
            }

        } catch (e: any) {
            if (isCancelledRef.current) return;
            console.error("Gemini API Error:", e);
            setError(e.message || "An unknown error occurred.");
        } finally {
            if (!isCancelledRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    const cancelGeneration = useCallback(() => {
      isCancelledRef.current = true;
      setIsLoading(false);
    }, []);


    // Note: The History/Edutainment tools currently call the SDK directly.
    // This hook is primarily for the FactChecker tool for now.
    // It can be expanded and refactored into the other tools later for consistency.

    return { result, isLoading, error, generateContent, clearResult, groundingMetadata, cancelGeneration, isCancelledRef };
};

export default useGemini;