import React, { useState } from 'react';
import { AITool } from '../../../types';

interface ToolLayoutProps {
  tool: AITool;
  children: React.ReactNode;
  language: 'vi' | 'en';
  setLanguage: (lang: 'vi' | 'en') => void;
  getPrompt: (lang: 'vi' | 'en', forCopying?: boolean) => string;
}

const ToolLayout: React.FC<ToolLayoutProps> = ({ tool, children, language, setLanguage, getPrompt }) => {
  const [isCopied, setIsCopied] = useState(false);
  
  const promptText = getPrompt ? getPrompt(language, true) : ''; // Get the user-friendly version for copying

  const handleCopyPrompt = () => {
    if (promptText) {
      navigator.clipboard.writeText(promptText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };


  return (
    <div className="animate-fade-in-down">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className={`text-4xl p-3 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center w-20 h-20 flex-shrink-0`}>
            {tool.icon}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{tool.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{tool.description}</p>
          </div>
        </div>
        {getPrompt && (
          <div className="flex items-center gap-2 self-start sm:self-center">
             <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'vi' | 'en')}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 pl-3 pr-8 rounded-lg text-sm transition-all appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"), url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center, right 0.5rem center',
                backgroundSize: '1.5em 1.5em',
                backgroundRepeat: 'no-repeat, no-repeat',
              }}
            >
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="en">🇬🇧 English</option>
            </select>
            <button
              onClick={handleCopyPrompt}
              disabled={!promptText || isCopied}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className={isCopied ? "fas fa-check" : "fas fa-copy"}></i>
              {isCopied ? 'Đã sao chép!' : 'Sao chép Prompt'}
            </button>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-lg p-6 sm:p-8 shadow-lg">
        {children}
      </div>
    </div>
  );
};

export default ToolLayout;