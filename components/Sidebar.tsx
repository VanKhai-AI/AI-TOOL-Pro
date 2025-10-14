
import React from 'react';
import { View } from '../App';

interface SidebarProps {
    activeView: View;
    setActiveView: (view: View) => void;
    isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{
    icon: string;
    label: string;
    view: View;
    activeView: View;
    onClick: () => void;
}> = ({ icon, label, view, activeView, onClick }) => {
    const isActive = activeView === view;
    return (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`flex items-center px-4 py-3 text-lg rounded-lg transition-colors duration-200 ${
                isActive
                    ? 'bg-blue-600/20 text-blue-600 dark:text-white font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
            <i className={`${icon} w-8 text-center`}></i>
            <span className="ml-4">{label}</span>
        </a>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setOpen }) => {
    const handleLinkClick = (view: View) => {
        setActiveView(view);
        if (window.innerWidth < 1024) { // Close sidebar on mobile after navigation
            setOpen(false);
        }
    };

    return (
        <>
            {/* Overlay for mobile */}
            <div 
                className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setOpen(false)}
            ></div>

            <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#1c1c1c] border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="flex items-center gap-3 mb-10">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-500 p-2 rounded-lg">
                        <i className="fas fa-brain text-2xl text-white"></i>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Hub</h1>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavLink icon="fas fa-home" label="Trang chủ" view="home" activeView={activeView} onClick={() => handleLinkClick('home')} />
                    <NavLink icon="fas fa-th-large" label="Công cụ" view="dashboard" activeView={activeView} onClick={() => handleLinkClick('dashboard')} />
                    <NavLink icon="fas fa-cog" label="Cài đặt" view="settings" activeView={activeView} onClick={() => handleLinkClick('settings')} />
                    <NavLink icon="fas fa-question-circle" label="Trợ giúp" view="help" activeView={activeView} onClick={() => handleLinkClick('help')} />
                </nav>

                <div className="mt-auto">
                    <div className="bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                        <h4 className="font-bold text-gray-900 dark:text-white">Nâng cấp lên Pro</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">Mở khóa tất cả các tính năng và truy cập không giới hạn.</p>
                        <button className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                            Nâng cấp ngay
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;