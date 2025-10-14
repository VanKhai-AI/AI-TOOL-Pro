import React, { useState, useEffect } from 'react';
import { AIToolCategory } from '../types';
import { AI_TOOLS } from '../constants';
import { USER_FACING_PROMPTS } from '../constants/prompts';
import { CheckIcon, CopyIcon } from './ui/Icon';

// Card component mới, có giao diện tương tự ToolCard nhưng có chức năng sao chép
const PromptDisplayCard: React.FC<{ promptKey: string }> = ({ promptKey }) => {
  const promptData = USER_FACING_PROMPTS[promptKey];
  const toolData = AI_TOOLS.find(t => t.id === promptKey);
  const [isCopied, setIsCopied] = useState(false);

  if (!promptData || !toolData) {
    return null;
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(promptData.prompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      className="relative group bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col items-start gap-4 h-full transform transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1"
    >
      <div
        className={`text-3xl text-white p-3 rounded-lg bg-gradient-to-br ${toolData.color} flex items-center justify-center w-16 h-16`}
      >
        {toolData.icon}
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{promptData.title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">{promptData.description}</p>
      
      <button
        onClick={handleCopy}
        className={`w-full mt-auto font-semibold text-sm flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
            isCopied 
            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white'
        }`}
      >
        {isCopied ? <CheckIcon /> : <CopyIcon />}
        {isCopied ? 'Đã sao chép!' : 'Sao chép Prompt'}
      </button>
    </div>
  );
};


const PromptLibrary: React.FC = () => {
    const categoryOrder: AIToolCategory[] = [
        'Nghiên cứu & Phân tích',
        'AI Lịch sử',
        'AI Giáo dục/Giải trí',
    ];

    const [expandedCategories, setExpandedCategories] = useState<Set<AIToolCategory>>(() => {
        try {
            const savedState = localStorage.getItem('expandedPromptCategories');
            if (savedState) {
                return new Set(JSON.parse(savedState));
            }
        } catch (error) {
            console.error("Could not parse expanded prompt categories from localStorage", error);
        }
        return new Set();
    });

    useEffect(() => {
        try {
            localStorage.setItem('expandedPromptCategories', JSON.stringify(Array.from(expandedCategories)));
        } catch (error) {
            console.error("Could not save expanded prompt categories to localStorage", error);
        }
    }, [expandedCategories]);

    const toggleCategory = (category: AIToolCategory) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const groupedPrompts = Object.keys(USER_FACING_PROMPTS).reduce((acc, key) => {
        const tool = AI_TOOLS.find(t => t.id === key);
        if (tool) {
            const category = tool.category;
            if (!acc.has(category)) {
                acc.set(category, []);
            }
            acc.get(category)!.push(key);
        }
        return acc;
    }, new Map<AIToolCategory, string[]>());

    return (
        <div className="animate-fade-in-down space-y-8">
            <section>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Thư viện Prompt</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Khám phá và sao chép các prompt mạnh mẽ đằng sau các công cụ AI của chúng tôi.</p>
                <div className="space-y-4">
                    {categoryOrder.map((category) => {
                        const promptsInCategory = groupedPrompts.get(category);
                        if (!promptsInCategory || promptsInCategory.length === 0) {
                            return null;
                        }
                        
                        const isExpanded = expandedCategories.has(category);

                        const categoryColor = {
                          'AI Lịch sử': 'border-amber-500',
                          'AI Giáo dục/Giải trí': 'border-teal-500',
                          'Nghiên cứu & Phân tích': 'border-sky-500',
                        }[category] || 'border-gray-500';

                        return (
                            <div key={category} className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden transition-all duration-300 shadow-md">
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className="w-full flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    aria-expanded={isExpanded}
                                    aria-controls={`category-panel-${category.replace(/[^a-zA-Z0-9]/g, '-')}`}
                                >
                                    <h3 className={`text-xl font-bold text-gray-900 dark:text-white border-l-4 pl-3 ${categoryColor}`}>
                                        {category}
                                    </h3>
                                    <i className={`fas fa-chevron-down text-gray-600 dark:text-gray-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                                </button>
                                <div
                                    id={`category-panel-${category.replace(/[^a-zA-Z0-9]/g, '-')}`}
                                    className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                                    style={{ transition: 'max-height 0.5s ease-in-out, opacity 0.3s ease-in-out' }}
                                >
                                    <div className="p-6 pt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                        {promptsInCategory.map((promptKey) => (
                                            <PromptDisplayCard key={promptKey} promptKey={promptKey} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default PromptLibrary;