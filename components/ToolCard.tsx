import React from 'react';
import { AITool } from '../types';

interface ToolCardProps {
  tool: AITool;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  return (
    <div
      onClick={!tool.comingSoon ? onClick : undefined}
      className={`relative group bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col items-start gap-4 h-full transform transition-all duration-300 shadow-md hover:shadow-2xl hover:-translate-y-1 ${
        tool.comingSoon
          ? 'opacity-60 cursor-not-allowed'
          : 'cursor-pointer hover:border-blue-600'
      } ${tool.label ? 'mt-4' : ''}`}
    >
      {tool.label && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span
            className={`inline-flex items-center text-xs font-bold px-4 py-1 rounded-md whitespace-nowrap ${tool.label.bgColor} ${tool.label.textColor}`}
          >
            {tool.label.text}
          </span>
        </div>
      )}
      
      {tool.comingSoon && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
          SẮP RA MẮT
        </div>
      )}

      <div
        className={`text-3xl text-white p-3 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center w-16 h-16`}
      >
        {tool.icon}
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tool.title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">{tool.description}</p>
      
      {!tool.comingSoon && (
        <div className="text-blue-500 dark:text-blue-400 font-semibold text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          Bắt đầu <i className="fas fa-arrow-right"></i>
        </div>
      )}
    </div>
  );
};

export default ToolCard;