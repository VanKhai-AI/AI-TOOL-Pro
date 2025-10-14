import React, { useState, useEffect, useRef } from 'react';
import { useToolState } from '../contexts/ToolStateContext';

// Custom hook to handle dropdown logic (open/close, click outside)
const useDropdown = (initialState = false) => {
    const [isOpen, setIsOpen] = useState(initialState);
    const ref = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return { ref, isOpen, setIsOpen };
};


const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
    const { ref: notificationsRef, isOpen: notificationsOpen, setIsOpen: setNotificationsOpen } = useDropdown();
    const { ref: profileRef, isOpen: profileOpen, setIsOpen: setProfileOpen } = useDropdown();
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

            {/* Right side: Search, Notifications, Profile */}
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
                
                {/* Notifications Icon and Dropdown */}
                <div className="relative" ref={notificationsRef}>
                    <button 
                        onClick={() => setNotificationsOpen(!notificationsOpen)} 
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white relative"
                        aria-label="Thông báo"
                        aria-haspopup="true"
                        aria-expanded={notificationsOpen}
                    >
                        <i className="fas fa-bell text-xl"></i>
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                    </button>
                    {notificationsOpen && (
                        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 animate-fade-in-down">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h4 className="font-bold text-gray-900 dark:text-white">Thông báo</h4>
                                <a href="#" className="text-xs text-blue-500 dark:text-blue-400 hover:underline">Đánh dấu đã đọc</a>
                            </div>
                            <ul className="py-1 max-h-80 overflow-y-auto">
                                <li className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200">
                                    <p className="text-sm text-gray-800 dark:text-white font-semibold">🚀 Cập nhật công cụ mới!</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Công cụ chuyển đổi giọng nói đã được cập nhật với các tính năng mới.</p>
                                </li>
                                <li className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200">
                                    <p className="text-sm text-gray-800 dark:text-white font-semibold">🔧 Bảo trì hệ thống</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Sẽ có một đợt bảo trì ngắn vào 2 giờ sáng ngày mai để nâng cấp.</p>
                                </li>
                                <li className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200">
                                    <p className="text-sm text-gray-800 dark:text-white font-semibold">👋 Chào mừng đến với AI Hub!</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Khám phá các công cụ AI mạnh mẽ và bắt đầu sáng tạo ngay hôm nay.</p>
                                </li>
                            </ul>
                            <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
                                <a href="#" className="text-sm text-blue-500 dark:text-blue-400 hover:underline">Xem tất cả</a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Icon and Dropdown */}
                <div className="relative" ref={profileRef}>
                    <button 
                        onClick={() => setProfileOpen(!profileOpen)}
                        aria-label="User menu"
                        aria-haspopup="true"
                        aria-expanded={profileOpen}
                    >
                        <img
                            src="https://picsum.photos/100/100"
                            alt="User Avatar"
                            className="w-10 h-10 rounded-full border-2 border-blue-600 hover:ring-2 hover:ring-blue-400 transition-all"
                        />
                    </button>
                    {profileOpen && (
                        <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 animate-fade-in-down">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <p className="font-semibold text-gray-900 dark:text-white truncate">Người dùng</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">user@example.com</p>
                            </div>
                            <ul className="py-2">
                                <li>
                                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"><i className="fas fa-user-circle w-5 mr-3 text-gray-400"></i> Hồ sơ</a>
                                </li>
                                <li>
                                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"><i className="fas fa-cog w-5 mr-3 text-gray-400"></i> Cài đặt</a>
                                </li>
                                <li>
                                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"><i className="fas fa-question-circle w-5 mr-3 text-gray-400"></i> Trợ giúp</a>
                                </li>
                            </ul>
                             <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                                <a href="#" className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300 rounded-md transition-colors duration-200"><i className="fas fa-sign-out-alt w-5 mr-3"></i> Đăng xuất</a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;