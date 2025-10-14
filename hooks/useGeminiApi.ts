import { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from '@google/genai';
import { useAPIKey } from '../contexts/APIKeyContext';

const isApiKeyError = (error: any): boolean => {
    // This is a simplified check. A more robust implementation would check for specific
    // status codes (e.g., 400, 403, 429) or error messages from the Gemini API.
    const message = (error.message || '').toLowerCase();
    return message.includes('api key not valid') || 
           message.includes('permission denied') || 
           message.includes('quota') ||
           message.includes('invalid argument');
};

const useGeminiApi = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<GenerateContentResponse | null>(null);
    const apiKeyContext = useAPIKey();
    const isCancelledRef = useRef(false);

    const generate = useCallback(async (params: GenerateContentParameters): Promise<GenerateContentResponse | null> => {
        isCancelledRef.current = false;
        setIsLoading(true);
        setError(null);
        setResult(null);

        if (apiKeyContext.apiKeys.length === 0) {
            setError("Chưa có API key nào được cấu hình. Vui lòng thêm key trong Cài đặt.");
            setIsLoading(false);
            return null;
        }

        let currentKey = apiKeyContext.getActiveKey();

        if (!currentKey) {
            setError("Không có API key nào đang hoạt động. Vui lòng kiểm tra các key trong Cài đặt.");
            setIsLoading(false);
            return null;
        }
        
        let attempts = 0;
        const maxAttempts = apiKeyContext.apiKeys.length;

        while (currentKey && attempts < maxAttempts) {
            if (isCancelledRef.current) break;
            attempts++;
            try {
                const ai = new GoogleGenAI({ apiKey: currentKey.key });
                const response = await ai.models.generateContent(params);
                
                if (isCancelledRef.current) return null;

                setResult(response);
                setIsLoading(false);
                return response; // Success!
            } catch (e: any) {
                if (isCancelledRef.current) break;

                console.error(`API call failed with key ...${currentKey.key.slice(-4)}:`, e);
                
                if (apiKeyContext.autoRotate && isApiKeyError(e)) {
                    apiKeyContext.markKeyAsInvalid(currentKey.id);
                    const nextKey = apiKeyContext.rotateToNextKey();
                    if (nextKey) {
                        currentKey = nextKey;
                        // Continue to the next iteration of the loop to retry
                    } else {
                        currentKey = null; // No more keys to try
                    }
                } else {
                    // Not a key error, or auto-rotate is off, so fail definitively
                    setError(e.message || "Đã xảy ra lỗi không xác định.");
                    setIsLoading(false);
                    return null;
                }
            }
        }
        
        if (isCancelledRef.current) {
             setError("Tác vụ đã bị người dùng hủy.");
        } else {
            // If we exit the loop, it means all keys failed.
            setError("Tất cả API key đều không hợp lệ hoặc đã hết hạn ngạch. Vui lòng thêm key mới trong Cài đặt.");
        }
        setIsLoading(false);
        return null;

    }, [apiKeyContext]);
    
    const cancel = useCallback(() => {
        isCancelledRef.current = true;
        setIsLoading(false);
        setError("Tác vụ đã bị người dùng hủy.");
    }, []);

    const clear = useCallback(() => {
        setError(null);
        setResult(null);
    }, []);

    return { isLoading, error, result, generate, clear, cancel };
};

export default useGeminiApi;