import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { useToolState } from '../../contexts/ToolStateContext';
import { AI_TOOLS, SCRIPT_GENERATOR_MODEL } from '../../constants';
import Spinner from '../ui/Spinner';
import { DownloadIcon, CopyIcon, CheckIcon } from '../ui/Icon';
import ToolLayout from './common/ToolLayout';
import Textarea from './common/Textarea';

interface GeneratedPrompt {
    sentence: string;
    prompt: string;
}

const EdutainmentScriptImagePromptGenerator: React.FC = () => {
    const tool = AI_TOOLS.find(t => t.id === 'edutainment-image-prompts')!;
    const { getToolState, updateToolState } = useToolState();
    const state = getToolState('edutainment-image-prompts');
    const {
        scriptText = '',
        isLoading = false,
        error = null,
        generatedPrompts = []
    } = state;
    
    const [progress, setProgress] = useState(0);
    const [isCopied, setIsCopied] = useState(false);

    const getPromptForSentence = (sentence: string, forCopying?: boolean) => {
        if (!sentence) return '';
        
        const outputInstruction = forCopying
            ? `ĐỊNH DẠNG ĐẦU RA (Văn bản thuần túy):
Trả về một gợi ý hình ảnh duy nhất dưới dạng văn bản thuần túy bằng tiếng Anh.`
            : `ĐỊNH DẠNG ĐẦU RA (JSON):
Trả về một đối tượng JSON duy nhất có một khóa "imagePrompt". Giá trị là một chuỗi chứa gợi ý hình ảnh.
Ví dụ: { "imagePrompt": "A vibrant 3D render of..." }`;
        
        return `VAI TRÒ:
Bạn là một AI chuyên tạo gợi ý hình ảnh chi tiết và đầy sức biểu cảm cho một kênh edutainment hài hước sử dụng hoạt hình người que.

**NHÂN VẬT CHÍNH (QUAN TRỌNG NHẤT):**
Nhân vật chính của chúng ta là **Professor Stickman**. Hầu hết các hình ảnh nên có sự xuất hiện của ông ấy. Ông là người dẫn chuyện và là cầu nối với khán giả. Hãy mô tả hành động, biểu cảm (tò mò, sốc, vui mừng, tinh nghịch) và tư thế của ông ấy để minh họa một cách hài hước cho câu nói.
Mô tả nhân vật (ENGLISH DESCRIPTION - USE THIS): "A wise Professor Stickman with a large, round head, big expressive circular eyes with distinct black pupils, and small round intellectual glasses perched on his face. He has a few stray wisps of hair sticking up from the top of his head. His body is composed of simple straight lines - a vertical line for the torso and two short horizontal lines at the shoulders suggesting a scholarly blazer. His overall proportions are balanced and visually pleasing. He stands with his legs as two well-proportioned straight lines of medium length and simple oval feet, firmly planted on the ground. He sports a confident, knowing smirk. One arm is raised, pointing outward as if explaining an important concept, while the other hand holds a simple pointer stick."

PHONG CÁCH NGHỆ THUẬT:
Phong cách là hoạt hình người que 2D/3D tối giản, sạch sẽ và sống động. Ưu tiên hình ảnh có màu sắc tươi sáng, bố cục năng động để truyền tải thông tin một cách trực quan và vui nhộn.

NHIỆM VỤ:
Dựa trên MỘT câu duy nhất từ kịch bản dưới đây, hãy tạo một gợi ý hình ảnh bằng tiếng Anh để minh họa cho câu đó, đặt Professor Stickman làm trung tâm.

CÂU KỊCH BẢN:
"${sentence}"

QUY TẮC:
- Gợi ý hình ảnh phải bằng tiếng Anh.
- Gợi ý phải mô tả một cảnh duy nhất, có Professor Stickman.
- Gợi ý phải nắm bắt được giọng văn hài hước, thú vị của kịch bản.

${outputInstruction}
`;
    };

    const handleGenerate = useCallback(async () => {
        if (!scriptText) {
            updateToolState('edutainment-image-prompts', { error: "Kịch bản trống." });
            return;
        }
        updateToolState('edutainment-image-prompts', { isLoading: true, error: null, generatedPrompts: [] });
        setProgress(0);
        
        const sentences = scriptText.split('\n').filter(s => s.trim() !== '');
        const totalSentences = sentences.length;
        const newPrompts: GeneratedPrompt[] = [];

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const jsonSchema = { type: Type.OBJECT, properties: { imagePrompt: { type: Type.STRING } }, required: ["imagePrompt"] };

        for (let i = 0; i < totalSentences; i++) {
            try {
                const sentence = sentences[i];
                const prompt = getPromptForSentence(sentence, false);
                const response = await ai.models.generateContent({ model: SCRIPT_GENERATOR_MODEL, contents: prompt, config: { responseMimeType: "application/json", responseSchema: jsonSchema }});
                const result = JSON.parse(response.text) as { imagePrompt?: string };

                if (result && result.imagePrompt) {
                    newPrompts.push({ sentence, prompt: result.imagePrompt });
                    updateToolState('edutainment-image-prompts', { generatedPrompts: [...newPrompts] });
                    setProgress(((i + 1) / totalSentences) * 100);
                } else {
                     newPrompts.push({ sentence, prompt: "Lỗi: Không thể tạo gợi ý." });
                     updateToolState('edutainment-image-prompts', { generatedPrompts: [...newPrompts] });
                }
            } catch (e: any) {
                updateToolState('edutainment-image-prompts', { error: `Đã xảy ra lỗi ở câu ${i + 1}: ${e.message}. Quá trình đã dừng lại.` });
                updateToolState('edutainment-image-prompts', { isLoading: false });
                return;
            }
        }
        
        updateToolState('edutainment-image-prompts', { isLoading: false });
    }, [scriptText, updateToolState]);

    const handleDownload = () => {
        const content = generatedPrompts.map((p: GeneratedPrompt) => `[Câu kịch bản]: ${p.sentence}\n[Gợi ý hình ảnh]: ${p.prompt}\n\n====================\n`).join('');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gợi-ý-hình-ảnh-kịch-bản.txt';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleCopy = () => {
        const content = generatedPrompts.map((p: GeneratedPrompt) => p.prompt).join('\n\n');
        navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <ToolLayout tool={tool} language={'vi'} setLanguage={() => {}} getPrompt={() => getPromptForSentence('[Câu kịch bản mẫu]', true)}>
            <div className="flex flex-col gap-6">
                <Textarea label="Kịch bản từ Bước 3" id="script" value={scriptText} onChange={e => updateToolState('edutainment-image-prompts', { scriptText: e.target.value })} placeholder="Dán toàn bộ kịch bản đã tải về từ Bước 3..." rows={12} required />

                <button onClick={handleGenerate} disabled={isLoading || !scriptText} className={`w-full flex justify-center items-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-md ${isLoading ? 'bg-red-600' : 'bg-green-600 hover:bg-green-700 disabled:bg-zinc-500'}`}>
                    {isLoading ? <><Spinner/> Đang tạo...</> : 'Tạo Gợi Ý Hình Ảnh'}
                </button>
                
                {isLoading && (
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                )}

                {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
                 
                {generatedPrompts.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                             <h3 className="font-bold text-sky-500 dark:text-sky-400">Gợi ý đã tạo ({generatedPrompts.length})</h3>
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
                            <div className="space-y-4">
                                {generatedPrompts.map((p: GeneratedPrompt, index: number) => (
                                    <div key={index} className="bg-white dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
                                        <p className="text-sm italic text-zinc-600 dark:text-zinc-400 font-semibold">
                                            <span className="text-sky-500 dark:text-sky-400 not-italic font-bold mr-2">{index + 1}.</span>
                                            "{p.sentence}"
                                        </p>
                                        <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md">
                                            {p.prompt}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
};

export default EdutainmentScriptImagePromptGenerator;