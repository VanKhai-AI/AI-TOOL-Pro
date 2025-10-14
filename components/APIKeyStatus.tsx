import React from 'react';
import { useAPIKey } from '../contexts/APIKeyContext';
import { APIKeyStatus as KeyStatusType } from '../types';

const APIKeyStatus: React.FC = () => {
    const { apiKeys, getActiveKey } = useAPIKey();

    const currentKey = getActiveKey();
    const totalKeys = apiKeys.length;
    const activeKeys = apiKeys.filter(k => k.status === 'active').length;

    const getStatusInfo = (status: KeyStatusType | undefined) => {
        switch (status) {
            case 'active':
                return {
                    color: 'text-green-500 dark:text-green-400',
                    text: 'Hoạt động'
                };
            case 'error':
                return {
                    color: 'text-red-500 dark:text-red-400',
                    text: 'Lỗi'
                };
            case 'unchecked':
                return {
                    color: 'text-yellow-500 dark:text-yellow-400',
                    text: 'Chưa kiểm tra'
                };
            default:
                 return {
                    color: 'text-slate-500 dark:text-slate-400',
                    text: 'Không có'
                };
        }
    };

    const statusInfo = getStatusInfo(currentKey?.status);

    const keysStatusColor = () => {
        if (totalKeys === 0) return 'text-slate-500 dark:text-slate-400';
        if (activeKeys === totalKeys) return 'text-green-500 dark:text-green-400';
        if (activeKeys > 0) return 'text-yellow-500 dark:text-yellow-400';
        return 'text-red-500 dark:text-red-400';
    }

    return (
        <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs py-2 px-4 flex items-center justify-center flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 dark:border-slate-700">
            <span>
                API Provider: <span className="font-semibold text-slate-800 dark:text-slate-100">Google Gemini</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>
                Keys: <span className={`font-bold ${keysStatusColor()}`}>{activeKeys}/{totalKeys}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>
                Current: <span className={`font-mono ${statusInfo.color}`}>
                    {currentKey ? `${currentKey.key.substring(0, 4)}...${currentKey.key.substring(currentKey.key.length - 4)}` : 'N/A'}
                </span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>
                Status: <span className={`font-semibold ${statusInfo.color}`}>{statusInfo.text}</span>
            </span>
        </div>
    );
};

export default APIKeyStatus;