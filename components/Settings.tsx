import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAPIKey } from '../contexts/APIKeyContext';
import { TrashIcon, CheckIcon, QuestionMarkIcon } from './ui/Icon';
import Spinner from './ui/Spinner';

const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-md">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        {children}
    </div>
);

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; setEnabled: () => void;}> = ({ label, enabled, setEnabled }) => (
    <div className="flex items-center justify-between">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <button
            onClick={setEnabled}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
        >
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    </div>
);

const APIKeyManager: React.FC = () => {
    const { 
        apiKeys, 
        setAllKeys, 
        removeKey, 
        checkAllKeys, 
        isChecking, 
        autoRotate, 
        toggleAutoRotate 
    } = useAPIKey();
    const [keysInput, setKeysInput] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        // Automatically open editor if no keys are present
        if (apiKeys.length === 0) {
            setIsEditing(true);
        }
    }, [apiKeys.length]);

    const handleSave = () => {
        if (keysInput.trim()) {
            setAllKeys(keysInput);
        } else {
            // If input is empty, clear all keys
            setAllKeys('');
        }
        setIsEditing(false);
    };
    
    const handleEdit = () => {
        setKeysInput(apiKeys.map(k => k.key).join('\n'));
        setIsEditing(true);
    };
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    setKeysInput(prev => `${prev}\n${text}`.trim());
                }
            };
            reader.readAsText(file);
        }
        // Reset file input to allow uploading the same file again
        if (event.target) {
            event.target.value = '';
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const getStatusIndicator = (status: 'unchecked' | 'active' | 'error') => {
        switch (status) {
            case 'active':
                return <span className="flex items-center gap-1.5 text-xs text-green-500"><CheckIcon className="w-4 h-4"/> Hoạt động</span>;
            case 'error':
                return <span className="flex items-center gap-1.5 text-xs text-red-500"><i className="fas fa-exclamation-triangle w-4 h-4"></i> Không hợp lệ</span>;
            default:
                return <span className="flex items-center gap-1.5 text-xs text-gray-500"><QuestionMarkIcon className="w-4 h-4"/> Chưa kiểm tra</span>;
        }
    };

    return (
        <SettingsCard title="Quản lý API Key">
            <div className="space-y-6">
                {isEditing ? (
                    <>
                        <div>
                            <label htmlFor="api-keys" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Dán API Keys (mỗi key một dòng)
                            </label>
                            <textarea
                                id="api-keys"
                                rows={8}
                                value={keysInput}
                                onChange={(e) => setKeysInput(e.target.value)}
                                placeholder="Dán API key của bạn vào đây..."
                                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                         <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleSave}
                                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                            >
                                Lưu API Keys
                            </button>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".txt"
                                className="hidden"
                            />
                            <button
                                onClick={triggerFileUpload}
                                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                            >
                                Tải lên file .txt
                            </button>
                            {apiKeys.length > 0 && (
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold"
                                >
                                    Hủy
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">Danh sách Keys ({apiKeys.length})</h4>
                                <ToggleSwitch label="Tự động xoay vòng key khi có lỗi" enabled={autoRotate} setEnabled={toggleAutoRotate} />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleEdit}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold"
                                >
                                    Chỉnh sửa Keys
                                </button>
                                <button
                                    onClick={checkAllKeys}
                                    disabled={isChecking}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isChecking ? <><Spinner /> Đang kiểm tra...</> : 'Kiểm tra API Key'}
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2">
                            {apiKeys.map(apiKey => (
                                <div key={apiKey.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        {getStatusIndicator(apiKey.status)}
                                        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                                            {apiKey.key.substring(0, 4)}...{apiKey.key.substring(apiKey.key.length - 4)}
                                        </span>
                                    </div>
                                    <button onClick={() => removeKey(apiKey.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))}
                             {apiKeys.length === 0 && (
                                <div className="text-center py-4">
                                    <p className="text-gray-500 dark:text-gray-400">Chưa có API key nào.</p>
                                    <button onClick={handleEdit} className="text-blue-500 hover:underline mt-2">Thêm ngay</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </SettingsCard>
    );
};


const Settings: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="space-y-8 animate-fade-in-down max-w-4xl mx-auto">
            <SettingsCard title="Hồ sơ">
                <div className="flex items-center space-x-6">
                    <img src="https://picsum.photos/100/100" alt="User Avatar" className="w-20 h-20 rounded-full" />
                    <div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold">
                            Tải ảnh lên
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Cho phép file JPG, GIF hoặc PNG. Tối đa 5MB.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Tên người dùng</label>
                        <input type="text" defaultValue="Người dùng" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Địa chỉ Email</label>
                        <input type="email" defaultValue="user@example.com" className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
            </SettingsCard>

            <APIKeyManager />

            <SettingsCard title="Giao diện">
                <ToggleSwitch label="Chế độ tối" enabled={theme === 'dark'} setEnabled={toggleTheme} />
            </SettingsCard>

            <SettingsCard title="Thông báo">
                <div className="space-y-4">
                    <div className="flex items-start">
                        <input id="email-notifications" type="checkbox" className="h-4 w-4 mt-1 rounded border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <div className="ml-3 text-sm">
                            <label htmlFor="email-notifications" className="font-medium text-gray-900 dark:text-white">Thông báo qua Email</label>
                            <p className="text-gray-600 dark:text-gray-400">Nhận thông báo về cập nhật sản phẩm và tin tức.</p>
                        </div>
                    </div>
                     <div className="flex items-start">
                        <input id="push-notifications" type="checkbox" className="h-4 w-4 mt-1 rounded border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-blue-600 focus:ring-blue-500" />
                        <div className="ml-3 text-sm">
                            <label htmlFor="push-notifications" className="font-medium text-gray-900 dark:text-white">Thông báo đẩy</label>
                            <p className="text-gray-600 dark:text-gray-400">Nhận thông báo đẩy trên trình duyệt của bạn.</p>
                        </div>
                    </div>
                </div>
            </SettingsCard>

             <SettingsCard title="Tài khoản">
                <div className="flex flex-col sm:flex-row gap-4">
                     <button className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold">
                        Đổi mật khẩu
                    </button>
                    <button className="w-full sm:w-auto px-4 py-2 bg-red-600 dark:bg-red-800 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-700 font-semibold">
                        Xóa tài khoản
                    </button>
                </div>
             </SettingsCard>
        </div>
    );
};

export default Settings;