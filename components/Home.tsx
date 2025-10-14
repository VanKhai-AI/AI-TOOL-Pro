import React from 'react';
import { View } from '../App';
import { AI_TOOLS } from '../constants';
import ToolCard from './ToolCard';

interface HomeProps {
  setActiveView: (view: View) => void;
}

const Home: React.FC<HomeProps> = ({ setActiveView }) => {
  const featuredTools = AI_TOOLS.filter(tool => !tool.isPromptOnly).slice(0, 4);

  return (
    <div className="animate-fade-in-down space-y-12">
      {/* Hero Section */}
      <section className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/10 dark:from-blue-900/50 dark:via-slate-900 dark:to-indigo-900/50 border border-gray-200 dark:border-gray-800 shadow-lg">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          Giải phóng sự sáng tạo của bạn với AI Hub
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          Một bộ công cụ AI mạnh mẽ được thiết kế để hợp lý hóa quy trình làm việc của bạn, từ viết kịch bản đến tạo nội dung.
        </p>
        <button
          onClick={() => setActiveView('dashboard')}
          className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-transform transform hover:scale-105"
        >
          Khám phá tất cả công cụ
        </button>
      </section>

      {/* Featured Tools Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Công cụ nổi bật</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onClick={() => setActiveView(tool.id)} />
          ))}
        </div>
      </section>
      
    </div>
  );
};

export default Home;