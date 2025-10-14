import React, { useState, useCallback } from 'react';
import { Type } from "@google/genai";
import { useToolState } from '../../contexts/ToolStateContext';
import { AI_TOOLS, SCRIPT_GENERATOR_MODEL, PROMPT_TEMPLATES } from '../../constants';
// FIX: Added 'ScriptPartImagePrompts' to the import from '../../types'. This type will be created in types.ts.
import { ScriptPartImagePrompts } from '../../types';
import Spinner from '../ui/Spinner';
import { DownloadIcon, CopyIcon, CheckIcon } from '../ui/Icon';
import ToolLayout from './common/ToolLayout';
import Textarea from './common/Textarea';
import useGeminiApi from '../../hooks/useGeminiApi';

interface ScriptPart {
    partIndex: number;
    title: string;
    content: string;
}

const HistoryScriptPromptGenerator: React.FC = () => {
    const tool = AI_TOOLS.find(t => t.id === 'history-image-prompts')!;
    const toolId = 'history-image-prompts';
    const { getToolState, updateToolState } = useToolState();
    const state = getToolState(toolId);
    const {
        scriptText = '',
        generatedScriptPrompts = null
    } = state;
    
    const { generate } = useGeminiApi();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [progress, setProgress] = useState(0);
    const [isCopied, setIsCopied] = useState(false);

    const getPromptForSentence = (sentence: string, forCopying?: boolean) => {
        if (!sentence) return '';
        
        const outputInstruction = forCopying
            ? `ĐỊNH DẠNG ĐẦU RA (Văn bản thuần túy):
Trả về một gợi ý hình ảnh duy nhất dưới dạng văn bản thuần túy bằng tiếng Anh.`
            : `ĐỊNH DẠNG ĐẦU RA (JSON):
Trả về một đối tượng JSON duy nhất có một khóa "imagePrompt". Giá trị là một chuỗi chứa gợi ý hình ảnh.
Ví dụ: { "imagePrompt": "cinematic digital painting of..." }`;
        
        const artStyleGuide = forCopying 
            ? ''
            : `PHONG CÁCH NGHỆ THUẬT:
Luôn tuân thủ nghiêm ngặt hướng dẫn phong cách nghệ thuật sau đây:
${PROMPT_TEMPLATES.HISTORICAL_ART_STYLE}\n\n`;

        return `VAI TRÒ:
Bạn là một AI chuyên tạo gợi ý hình ảnh (image prompts) chi tiết, đậm chất điện ảnh cho video tài liệu lịch sử.
${artStyleGuide}
NHIỆM VỤ:
Dựa trên MỘT câu duy nhất từ kịch bản được cung cấp dưới đây, hãy tạo một gợi ý hình ảnh bằng tiếng Anh để minh họa cho câu đó.

CÂU KỊCH BẢN:
"${sentence}"

QUY TẮC:
- Gợi ý hình ảnh phải bằng tiếng Anh.
- Gợi ý phải mô tả một cảnh duy nhất, gắn kết.
- Gợi ý phải tuân thủ nghiêm ngặt PHONG CÁCH NGHỆ THUẬT đã được xác định.

${outputInstruction}
`;
    };

    const handleGenerate = useCallback(async () => {
        if (!scriptText) {
            setError("Kịch bản trống.");
            return;
        }

        const partRegex = /###\s*(.*?)\s*###\n\n([\s\S]*?)(?=\n\n###|$)/g;
        const parsedParts: ScriptPart[] = [];
        let match;
        let partIndex = 0;
        while ((match = partRegex.exec(scriptText)) !== null) {
            parsedParts.push({
                partIndex: partIndex++,
                title: match[1].trim(),
                content: match[2].trim(),
            });
        }

        if (parsedParts.length === 0) {
             setError("Không tìm thấy phần nào trong kịch bản. Vui lòng đảm bảo kịch bản được định dạng với các tiêu đề như '### Part 1: Title ###'.");
             return;
        }

        setIsLoading(true);
        setError(null);
        updateToolState(toolId, { generatedScriptPrompts: null });
        setProgress(0);
        
        const allSentences = parsedParts.flatMap(p => p.content.split('\n').filter(s => s.trim() !== ''));
        const totalSentences = allSentences.length;
        let sentencesProcessed = 0;

        const newPrompts: ScriptPartImagePrompts = { parts: {} };

        const jsonSchema = { type: Type.OBJECT, properties: { imagePrompt: { type: Type.STRING } }, required: ["imagePrompt"] };

        for (const part of parsedParts) {
            const sentences = part.content.split('\n').filter(s => s.trim() !== '');
            newPrompts.parts[part.partIndex] = [];

            for (const sentence of sentences) {
                 try {
                    const prompt = getPromptForSentence(sentence, false);
                    const response = await generate({ model: SCRIPT_GENERATOR_MODEL, contents: prompt, config: { responseMimeType: "application/json", responseSchema: jsonSchema }});
                    
                    if (response) {
                        // FIX: Cast the parsed JSON to a specific type to avoid 'unknown' type errors.
                        const result = JSON.parse(response.text) as { imagePrompt: string };
                        if (result && result.imagePrompt) {
                            newPrompts.parts[part.partIndex].push({ textNote: sentence, imagePrompt: result.imagePrompt });
                        } else {
                            newPrompts.parts[part.partIndex].push({ textNote: sentence, imagePrompt: "Lỗi: Không thể tạo gợi ý." });
                        }
                    } else {
                        throw new Error("API call failed.");
                    }
                 } catch (e: any) {
                    setError(`Đã xảy ra lỗi ở câu "${sentence.substring(0, 30)}...": ${e.message}. Quá trình đã dừng lại.`);
                    setIsLoading(false);
                    return;
                } finally {
                    sentencesProcessed++;
                    setProgress((sentencesProcessed / totalSentences) * 100);
                    updateToolState(toolId, { generatedScriptPrompts: { ...newPrompts } });
                }
            }
        }
        
        setIsLoading(false);
    }, [scriptText, updateToolState, generate]);

    const handleDownload = () => {
        if (!generatedScriptPrompts) return;
        let content = '';
        Object.keys(generatedScriptPrompts.parts).forEach(partIndex => {
            const partTitle = scriptText.match(new RegExp(`###\\s*(Part ${Number(partIndex) + 1}:.*?)\\s*###`));
            const prompts = generatedScriptPrompts.parts[Number(partIndex)];
            content += `==================== ${partTitle ? partTitle[1] : `PART ${Number(partIndex) + 1}`} ====================\n\n`;
            prompts.forEach(p => {
                content += `[Câu kịch bản]: ${p.textNote}\n[Gợi ý hình ảnh]: ${p.imagePrompt}\n\n`;
            });
        });
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gợi-ý-hình-ảnh-kịch-bản.txt';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleCopy = () => {
        if (!generatedScriptPrompts) return;
        const content = Object.values(generatedScriptPrompts.parts).flat().map(p => p.imagePrompt).join('\n\n');
        navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const promptCount = generatedScriptPrompts ? Object.values(generatedScriptPrompts.parts).flat().length : 0;
    
    const getPartTitle = (partIndex: number) => {
        const partRegex = /###\s*(.*?)\s*###/g;
        const titles = Array.from(scriptText.matchAll(partRegex), m => m[1]);
        return titles[partIndex] || `Phần ${partIndex + 1}`;
    };

    return (
        <ToolLayout tool={tool} language={'vi'} setLanguage={() => {}} getPrompt={() => getPromptForSentence('[Câu kịch bản mẫu]', true)}>
            <div className="flex flex-col gap-6">
                <Textarea label="Kịch bản từ Bước 3" id="script" value={scriptText} onChange={e => updateToolState(toolId, { scriptText: e.target.value })} placeholder="Dán toàn bộ kịch bản đã tải về từ Bước 3 (phải bao gồm các tiêu đề phần như '### Part 1:... ###')." rows={12} required />

                <button onClick={handleGenerate} disabled={isLoading || !scriptText} className={`w-full flex justify-center items-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-md ${isLoading ? 'bg-red-600' : 'bg-green-600 hover:bg-green-700 disabled:bg-zinc-500'}`}>
                    {isLoading ? <><Spinner/> Đang tạo...</> : 'Tạo Gợi Ý Hình Ảnh'}
                </button>
                
                {isLoading && (
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                )}

                {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
                 
                {generatedScriptPrompts && promptCount > 0 && (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                             <h3 className="font-bold text-sky-500 dark:text-sky-400">Gợi ý đã tạo ({promptCount})</h3>
                             <div className="flex items-center gap-2">
                                <button onClick={handleCopy} className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-bold py-2 px-3 rounded-md transition duration-300 text-sm">
                                    {isCopied ? <CheckIcon/> : <CopyIcon/>} {isCopied ? 'Đã sao chép' : 'Sao chép tất cả'}
                                </button>
                                <button onClick={handleDownload} className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-bold py-2 px-3 rounded-md transition duration-300 text-sm">
                                    <DownloadIcon/> Tải xuống
                                </button>
                             </div>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 h-[30rem] overflow-y-auto">
                            <div className="space-y-6">
                                {Object.keys(generatedScriptPrompts.parts).map(partIndexStr => {
                                    const partIndex = Number(partIndexStr);
                                    const prompts = generatedScriptPrompts.parts[partIndex];
                                    return (
                                        <div key={partIndex}>
                                            <h4 className="font-bold text-lg text-cyan-600 dark:text-cyan-400 mb-2">{getPartTitle(partIndex)}</h4>
                                            <div className="space-y-4 pl-4 border-l-2 border-cyan-500/50">
                                                {prompts.map((p, index) => (
                                                    <div key={index} className="bg-white dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
                                                        <p className="text-sm italic text-zinc-600 dark:text-zinc-400 font-semibold">
                                                            "{p.textNote}"
                                                        </p>
                                                        <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md">
                                                            {p.imagePrompt}
                                                        </pre>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
};

export default HistoryScriptPromptGenerator;