import React, { useEffect } from 'react';
import { AI_TOOLS, getToolThemeColors } from '../../constants';
import { TOOL_PROMPTS } from '../../constants/prompts';
import ToolLayout from './common/ToolLayout';
import Textarea from './common/Textarea';
import ResultDisplay from './common/ResultDisplay';
import { useToolState } from '../../contexts/ToolStateContext';
import useGeminiApi from '../../hooks/useGeminiApi';

const TextSummarizer: React.FC = () => {
    const toolId = 'text-summarizer';
    const tool = AI_TOOLS.find(t => t.id === toolId)!;
    const themeColors = getToolThemeColors(tool.category);
    const { getToolState, updateToolState } = useToolState();
    const state = getToolState(toolId);
    const { 
        input = '', 
        language = 'vi',
        format = 'paragraph', // 'paragraph' or 'bullets'
        result: storedResult = null,
    } = state;

    const { isLoading, error, result, generate, clear, cancel } = useGeminiApi();

    useEffect(() => {
        if (result) {
            updateToolState(toolId, { result: result.text });
        }
    }, [result, updateToolState, toolId]);
    
    useEffect(() => {
        updateToolState(toolId, { error });
    }, [error, updateToolState, toolId]);

    const handleGenerate = () => {
        if (!input) return;
        const prompt = TOOL_PROMPTS['text-summarizer'](input, format as 'paragraph' | 'bullets', language as 'vi' | 'en');
        generate({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
    };
    
    const handleClear = () => {
        clear();
        updateToolState(toolId, { result: null, error: null });
    };

    const getPromptForCopy = () => TOOL_PROMPTS['text-summarizer'](input || '[Paste your text here]', format as 'paragraph' | 'bullets', language as 'vi' | 'en');

    return (
        <ToolLayout
            tool={tool}
            language={language}
            setLanguage={(lang) => updateToolState(toolId, { language: lang })}
            getPrompt={getPromptForCopy}
        >
            <div className="space-y-4">
                <Textarea
                    id="input"
                    label="Văn bản cần tóm tắt"
                    value={input}
                    onChange={(e) => updateToolState(toolId, { input: e.target.value })}
                    rows={15}
                    placeholder="Dán bài báo, báo cáo, hoặc bất kỳ đoạn văn bản dài nào vào đây..."
                    ringColorClass={themeColors.ring}
                />
                <div>
                    <label htmlFor="format" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Định dạng tóm tắt</label>
                    <select
                        id="format"
                        value={format}
                        onChange={(e) => updateToolState(toolId, { format: e.target.value })}
                        className={`w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${themeColors.ring} transition-colors`}
                    >
                        <option value="paragraph">Đoạn văn</option>
                        <option value="bullets">Gạch đầu dòng</option>
                    </select>
                </div>
                <button
                    onClick={isLoading ? cancel : handleGenerate}
                    disabled={!input}
                    className={`w-full flex justify-center items-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:from-zinc-500 disabled:to-zinc-400 disabled:opacity-100 disabled:cursor-not-allowed ${
                        isLoading 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : `bg-gradient-to-br ${themeColors.buttonGradient} hover:opacity-90`
                    }`}
                >
                    {isLoading ? <><i className="fas fa-stop-circle mr-2"></i>Dừng</> : 'Tóm tắt'}
                </button>
            </div>
            <ResultDisplay isLoading={isLoading} result={storedResult} error={error} onClear={handleClear} />
        </ToolLayout>
    );
};

export default TextSummarizer;