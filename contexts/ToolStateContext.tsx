import React, { createContext, useContext, useState, useCallback } from 'react';
import { AITool } from '../types';

// A type for the state of a single tool
type ToolState = { [key: string]: any };

// A type for the state of all tools, indexed by tool ID
type AllToolStates = {
  [toolId: string]: ToolState;
};

interface ToolStateContextType {
  getToolState: (toolId: string) => ToolState;
  updateToolState: (toolId: string, newState: Partial<ToolState>) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ToolStateContext = createContext<ToolStateContextType | undefined>(undefined);

export const ToolStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toolStates, setToolStates] = useState<AllToolStates>({});
  const [searchQuery, setSearchQuery] = useState('');

  const getToolState = useCallback((toolId: string): ToolState => {
    return toolStates[toolId] || {};
  }, [toolStates]);

  const updateToolState = useCallback((toolId:string, newState: Partial<ToolState>) => {
    setToolStates(prevStates => ({
      ...prevStates,
      [toolId]: {
        ...(prevStates[toolId] || {}),
        ...newState,
      },
    }));
  }, []);

  return (
    <ToolStateContext.Provider value={{ getToolState, updateToolState, searchQuery, setSearchQuery }}>
      {children}
    </ToolStateContext.Provider>
  );
};

export const useToolState = (): ToolStateContextType => {
  const context = useContext(ToolStateContext);
  if (context === undefined) {
    throw new Error('useToolState must be used within a ToolStateProvider');
  }
  return context;
};
