import React from 'react';
import { useToolState } from '../contexts/ToolStateContext';

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
    const { searchQuery, setSearchQuery } = useToolState();

    return (
        <header className="flex justify-between items-center w-full">
            {/* Left side: Menu button (mobile) and Welcome message */}
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white lg:hidden" aria-label="Open menu">
                    <i className="fas fa-bars text-xl"></i>
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white hidden sm:block">Chào mừng trở lại!</h1>
                    <p className="text-gray-500 dark:text-gray-400 hidden sm:block">Hãy bắt đầu sáng tạo điều gì đó mới mẻ hôm nay.</p>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:hidden">AI Hub</h1>
                </div>
            </div>

            {/* Right side: Search */}
            <div className="flex items-center gap-4 sm:gap-6">
                <div className="relative hidden md:block">
                    <input
                        type="text"
                        placeholder="Tìm kiếm công cụ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-64"
                    />
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
                </div>
            </div>
        </header>
    );
};

export default Header;