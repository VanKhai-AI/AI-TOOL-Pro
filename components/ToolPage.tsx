import React from 'react';
import { View } from '../App';
import { AI_TOOLS } from '../constants';
import { toolComponents } from './tools';

interface ToolPageProps {
  toolId: string;
  setActiveView: (view: View) => void;
}

const ToolPage: React.FC<ToolPageProps> = ({ toolId, setActiveView }) => {
  const tool = AI_TOOLS.find((t) => t.id === toolId);
  const ToolComponent = toolComponents[toolId];

  if (!tool || !ToolComponent) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-500">Lỗi: Không tìm thấy công cụ</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Công cụ bạn đang tìm kiếm không tồn tại.</p>
        <button
          onClick={() => setActiveView('dashboard')}
          className="mt-4 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Quay lại Bảng điều khiển
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <i className="fas fa-arrow-left"></i>
          <span>Quay lại tất cả công cụ</span>
        </button>
      </div>
      <ToolComponent />
    </div>
  );
};

export default ToolPage;