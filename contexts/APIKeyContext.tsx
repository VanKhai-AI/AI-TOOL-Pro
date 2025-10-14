import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { APIKey } from '../types';

interface APIKeyContextType {
  apiKeys: APIKey[];
  isChecking: boolean;
  autoRotate: boolean;
  addKeys: (keysString: string) => void;
  setAllKeys: (keysString: string) => void;
  removeKey: (id: string) => void;
  checkAllKeys: () => Promise<void>;
  toggleAutoRotate: () => void;
  getActiveKey: () => APIKey | null;
  rotateToNextKey: () => APIKey | null;
  markKeyAsInvalid: (id: string) => void;
}

const APIKeyContext = createContext<APIKeyContextType | undefined>(undefined);

const STORAGE_KEYS = {
  API_KEYS: 'gemini_api_keys',
  CURRENT_KEY_INDEX: 'gemini_current_key_index',
  AUTO_ROTATE: 'gemini_auto_rotate'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const APIKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [currentKeyIndex, setCurrentKeyIndex] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem(STORAGE_KEYS.API_KEYS);
      const storedIndex = localStorage.getItem(STORAGE_KEYS.CURRENT_KEY_INDEX);
      const storedAutoRotate = localStorage.getItem(STORAGE_KEYS.AUTO_ROTATE);

      if (storedKeys) {
        setApiKeys(JSON.parse(storedKeys));
      }
      if (storedIndex) {
        setCurrentKeyIndex(JSON.parse(storedIndex));
      }
       if (storedAutoRotate) {
        setAutoRotate(JSON.parse(storedAutoRotate));
      }
    } catch (error) {
      console.error("Failed to load API keys from storage:", error);
      localStorage.removeItem(STORAGE_KEYS.API_KEYS);
    }
  }, []);

  const saveToStorage = (keys: APIKey[], index: number, rotate: boolean) => {
    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys));
    localStorage.setItem(STORAGE_KEYS.CURRENT_KEY_INDEX, JSON.stringify(index));
    localStorage.setItem(STORAGE_KEYS.AUTO_ROTATE, JSON.stringify(rotate));
  };
  
  const addKeys = useCallback((keysString: string) => {
    const newKeyStrings = keysString.split(/[\n, ]+/).map(k => k.trim()).filter(Boolean);
    const newKeys: APIKey[] = newKeyStrings.map(key => ({
      id: self.crypto.randomUUID(),
      key,
      status: 'unchecked',
      lastChecked: null,
      errorCount: 0
    }));
    
    setApiKeys(prev => {
      const updatedKeys = [...prev, ...newKeys];
      saveToStorage(updatedKeys, currentKeyIndex, autoRotate);
      return updatedKeys;
    });
  }, [currentKeyIndex, autoRotate]);

  const setAllKeys = useCallback((keysString: string) => {
    const keyStrings = keysString.split(/[\n, ]+/).map(k => k.trim()).filter(Boolean);
    const newKeys: APIKey[] = keyStrings.map(key => ({
        id: self.crypto.randomUUID(),
        key,
        status: 'unchecked',
        lastChecked: null,
        errorCount: 0
    }));
    const newIndex = 0;
    setApiKeys(newKeys);
    setCurrentKeyIndex(newIndex);
    saveToStorage(newKeys, newIndex, autoRotate);
  }, [autoRotate]);


  const removeKey = useCallback((id: string) => {
    setApiKeys(prev => {
      const updatedKeys = prev.filter(k => k.id !== id);
      const newIndex = Math.min(currentKeyIndex, updatedKeys.length - 1);
      setCurrentKeyIndex(newIndex < 0 ? 0 : newIndex);
      saveToStorage(updatedKeys, newIndex, autoRotate);
      return updatedKeys;
    });
  }, [currentKeyIndex, autoRotate]);
  
  const checkKey = async (key: string): Promise<boolean> => {
      try {
          // A low-cost, simple call to verify the key
          const ai = new GoogleGenAI({ apiKey: key });
          await ai.models.generateContent({model: 'gemini-2.5-flash', contents: "hi"});
          return true;
      } catch (error) {
          console.error(`API Key validation failed for key ending in ...${key.slice(-4)}:`, error);
          return false;
      }
  };

  const checkAllKeys = useCallback(async () => {
    setIsChecking(true);
    const updatedKeys = [...apiKeys];
    let activeKeyFoundAndSet = false;

    for (let i = 0; i < updatedKeys.length; i++) {
      const isValid = await checkKey(updatedKeys[i].key);
      updatedKeys[i].status = isValid ? 'active' : 'error';
      updatedKeys[i].lastChecked = new Date().toISOString();
      if(isValid && !activeKeyFoundAndSet) {
        setCurrentKeyIndex(i);
        activeKeyFoundAndSet = true;
      }

      // Add a delay to avoid hitting rate limits (e.g., 60 RPM for free tier).
      // A 1.1 second delay between requests is a safe buffer.
      if (i < updatedKeys.length - 1) {
        await delay(1100);
      }
    }
    
    // If no active keys were found, reset index to 0
    if (!activeKeyFoundAndSet) {
        setCurrentKeyIndex(0);
    }
    
    setApiKeys(updatedKeys);
    saveToStorage(updatedKeys, activeKeyFoundAndSet ? currentKeyIndex : 0, autoRotate);
    setIsChecking(false);
  }, [apiKeys, currentKeyIndex, autoRotate]);

  const toggleAutoRotate = useCallback(() => {
    setAutoRotate(prev => {
      const newState = !prev;
      saveToStorage(apiKeys, currentKeyIndex, newState);
      return newState;
    });
  }, [apiKeys, currentKeyIndex]);

  const getActiveKey = useCallback((): APIKey | null => {
    if (apiKeys.length === 0) return null;
    return apiKeys[currentKeyIndex];
  }, [apiKeys, currentKeyIndex]);

  const rotateToNextKey = useCallback((): APIKey | null => {
    if (apiKeys.length <= 1) return null;
    let nextIndex = (currentKeyIndex + 1) % apiKeys.length;
    
    // Find the next available 'active' or 'unchecked' key
    for (let i = 0; i < apiKeys.length; i++) {
        if (apiKeys[nextIndex].status !== 'error') {
            setCurrentKeyIndex(nextIndex);
            saveToStorage(apiKeys, nextIndex, autoRotate);
            return apiKeys[nextIndex];
        }
        nextIndex = (nextIndex + 1) % apiKeys.length;
    }
    
    // All keys are in an error state
    return null; 
  }, [apiKeys, currentKeyIndex, autoRotate]);
  
  const markKeyAsInvalid = useCallback((id: string) => {
    setApiKeys(prev => {
        const updated = prev.map(k => k.id === id ? { ...k, status: 'error' as const, errorCount: k.errorCount + 1 } : k);
        saveToStorage(updated, currentKeyIndex, autoRotate);
        return updated;
    });
  }, [currentKeyIndex, autoRotate]);

  return (
    <APIKeyContext.Provider value={{ apiKeys, isChecking, autoRotate, addKeys, setAllKeys, removeKey, checkAllKeys, toggleAutoRotate, getActiveKey, rotateToNextKey, markKeyAsInvalid }}>
      {children}
    </APIKeyContext.Provider>
  );
};

export const useAPIKey = (): APIKeyContextType => {
  const context = useContext(APIKeyContext);
  if (context === undefined) {
    throw new Error('useAPIKey must be used within an APIKeyProvider');
  }
  return context;
};