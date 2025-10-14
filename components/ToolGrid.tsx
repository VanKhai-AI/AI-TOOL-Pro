import React, { useState, useEffect } from 'react';
import { View } from '../App';
import { AI_TOOLS } from '../constants';
import ToolCard from './ToolCard';
import { AIToolCategory, AITool } from '../types';
import { useToolState } from '../contexts/ToolStateContext';

interface ToolGridProps {
  setActiveView: (view: View) => void;
}

const ToolGrid: React.FC<ToolGridProps> = ({ setActiveView }) => {
  const { searchQuery } = useToolState();
  const categoryOrder: AIToolCategory[] = [
    'Nghiên cứu & Phân tích',
    'AI Lịch sử',
    'AI Giáo dục/Giải trí',
  ];

  const [expandedCategories, setExpandedCategories] = useState<Set<AIToolCategory>>(() => {
    try {
      const savedState = localStorage.getItem('expandedCategories');
      if (savedState) {
        // Parse the saved array and convert it back to a Set
        return new Set(JSON.parse(savedState));
      }
    } catch (error) {
      console.error("Could not parse expanded categories from localStorage", error);
    }
    // Default to closed (an empty set) if nothing is saved or parsing fails
    return new Set();
  });

  // Save the state to localStorage whenever it changes
  useEffect(() => {
    try {
      // Convert Set to Array for JSON stringification
      localStorage.setItem('expandedCategories', JSON.stringify(Array.from(expandedCategories)));
    } catch (error) {
      console.error("Could not save expanded categories to localStorage", error);
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


  if (searchQuery.trim()) {
    const lowercasedQuery = searchQuery.trim().toLowerCase();
    const filteredTools = AI_TOOLS.filter(tool =>
        tool.title.toLowerCase().includes(lowercasedQuery) ||
        tool.description.toLowerCase().includes(lowercasedQuery)
    );

    return (
      <div className="animate-fade-in-down">
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Kết quả tìm kiếm cho "{searchQuery}"
          </h2>
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onClick={() => setActiveView(tool.id)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <i className="fas fa-search text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Không tìm thấy công cụ nào</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Hãy thử một từ khóa tìm kiếm khác.</p>
            </div>
          )}
        </section>
      </div>
    );
  }

  const groupedTools = AI_TOOLS.reduce((acc, tool) => {
    const category = tool.category;
    if (!acc.has(category)) {
      acc.set(category, []);
    }
    acc.get(category)!.push(tool);
    return acc;
  }, new Map<AIToolCategory, AITool[]>());
  
  return (
    <div className="animate-fade-in-down space-y-8">
        {/* All Tools Section */}
        <section>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Tất cả công cụ</h2>
            <div className="space-y-4">
            {categoryOrder.map((category) => {
                const toolsInCategory = groupedTools.get(category);
                if (!toolsInCategory || toolsInCategory.length === 0) {
                return null;
                }

                const isExpanded = expandedCategories.has(category);

                const categoryColor = {
                  'AI Lịch sử': 'border-amber-500',
                  'AI Giáo dục/Giải trí': 'border-teal-500',
                  'Nghiên cứu & Phân tích': 'border-sky-500'
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
                      className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                      style={{ transition: 'max-height 0.5s ease-in-out, opacity 0.3s ease-in-out' }}
                    >
                      <div className="p-6 pt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {toolsInCategory.map((tool) => (
                            <ToolCard key={tool.id} tool={tool} onClick={() => setActiveView(tool.id)} />
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

export default ToolGrid;