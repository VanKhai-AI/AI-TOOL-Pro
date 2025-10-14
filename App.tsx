import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Home from './components/Home';
import ToolGrid from './components/ToolGrid';
import Settings from './components/Settings';
import Help from './components/Help';
import ToolPage from './components/ToolPage';
import APIKeyStatus from './components/APIKeyStatus';
import { AI_TOOLS } from './constants';

// The view can be a standard page or a specific tool ID.
export type View = 'home' | 'dashboard' | 'settings' | 'help' | string;

function App() {
  const [activeView, setActiveView] = useState<View>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <Home setActiveView={setActiveView} />;
      case 'dashboard':
        return <ToolGrid setActiveView={setActiveView} />;
      case 'settings':
        return <Settings />;
      case 'help':
        return <Help />;
      default:
        // Check if it's a tool ID
        if (AI_TOOLS.some(tool => tool.id === activeView)) {
          return <ToolPage toolId={activeView} setActiveView={setActiveView} />;
        }
        // Fallback to home if view is unknown
        setActiveView('home');
        return <Home setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-100 font-sans">
      <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-slate-900 p-6 lg:p-8">
          <div className="container mx-auto max-w-7xl">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <div className="mt-8">
              {renderContent()}
            </div>
          </div>
        </main>
        <APIKeyStatus />
      </div>
    </div>
  );
}

export default App;