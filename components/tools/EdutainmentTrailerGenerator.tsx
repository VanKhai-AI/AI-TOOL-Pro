import React, { useMemo, useCallback, useEffect } from 'react';
import { Type } from "@google/genai";
import { useToolState } from '../../contexts/ToolStateContext';
import { type LanguageCode } from '../../types';
import { AI_TOOLS, SCRIPT_GENERATOR_MODEL } from '../../constants';
import Spinner from '../ui/Spinner';
import { TrailerResponse } from '../../types/aiResponse';
import ToolLayout from './common/ToolLayout';
import Textarea from './common/Textarea';
import { slugify } from '../../utils/slugify';
import { DownloadIcon } from '../ui/Icon';
import useGeminiApi from '../../hooks/useGeminiApi';

const EdutainmentTrailerGenerator: React.FC = () => {
    const tool = AI_TOOLS.find(t => t.id === 'edutainment-trailer')!;
    const toolId = 'edutainment-trailer';
    const { getToolState, updateToolState } = useToolState();
    const state = getToolState(toolId);
    const {
        scriptText = '',
        outlineText = '',
        trailerDuration = 20,
        includeTextNote = true,
        textNoteLanguage = 'VI',
        error = null,
        generatedTrailer = null
    } = state;

    const { isLoading, error: apiError, result, generate, clear } = useGeminiApi();

    useEffect(() => {
      if (apiError) updateToolState(toolId, { error: apiError });
    }, [apiError, updateToolState, toolId]);

    useEffect(() => {
        if (result) {
            try {
                const parsed = JSON.parse(result.text) as TrailerResponse;
                 if (parsed && parsed.trailerData) {
                    updateToolState(toolId, { generatedTrailer: parsed.trailerData });
                } else throw new Error('Invalid AI response for trailer.');
            } catch (e: any) {
                 updateToolState(toolId, { error: e.message || "Lỗi phân tích phản hồi JSON." });
            }
        }
    }, [result, updateToolState]);
    
    const mainTitle = useMemo(() => outlineText.match(/(?:Tiêu đề chính|CHỦ ĐỀ):\s*(.*)/)?.[1].trim() || 'Video Edutainment', [outlineText]);

    const getPrompt = (lang: 'vi' | 'en', forCopying?: boolean) => {
        if (!scriptText) return 'Vui lòng dán kịch bản vào đây để tạo prompt.';
        const targetWordCount = Math.round((trailerDuration / 60) * 150);
        
        const outputInstruction = forCopying 
            ? `ĐỊNH DẠNG ĐẦU RA (Văn bản):
Trình bày kết quả dưới dạng văn bản có cấu trúc rõ ràng:
1.  **Lời thoại Trailer:** Liệt kê các câu thoại của trailer, mỗi câu trên một dòng.
2.  **Gợi ý Hình ảnh:** Đối với mỗi câu thoại, cung cấp gợi ý hình ảnh tương ứng.`
            : `ĐỊNH DẠNG ĐẦU RA (JSON):
Phải là một đối tượng JSON duy nhất.
Cấu trúc: { "trailerData": { "trailerVoiceover": ["Câu thoại 1.", "Câu thoại 2."], "prompts": [{"textNote": "Câu thoại 1.", "imagePrompt": "..."}, {"textNote": "Câu thoại 2.", "imagePrompt": "..."}] } }`;

        return `VAI TRÒ:
Bạn là một đạo diễn trailer video Edutainment hài hước, có khả năng lan truyền. Nhiệm vụ của bạn là tạo ra một kịch bản trailer có nhịp độ nhanh, khơi gợi sự tò mò, đặt ra một câu hỏi hấp dẫn và hứa hẹn một lời giải thích trực quan tuyệt đẹp, vui nhộn.

PHONG CÁCH NGHỆ THUẬT GỢI Ý:
Phong cách nghệ thuật là hoạt hình người que 2D/3D tối giản, sạch sẽ và sống động, với nhân vật chính là Professor Stickman. Phong cách này phải vui tươi, hấp dẫn và hoàn hảo cho sự hài hước và rõ ràng.

THÔNG TIN ĐẦU VÀO:
- Chủ đề Video: ${mainTitle}
- Kịch bản đầy đủ: """${scriptText}"""
- Thời lượng Trailer (giây): ${trailerDuration}
- Tốc độ đọc (từ/phút): 150
- Số từ mục tiêu: ${targetWordCount}

NHIỆM VỤ:
1.  **Tạo Lời thoại Trailer:** Dựa trên kịch bản, hãy tạo ra một kịch bản lời thoại trailer ngắn gọn, hấp dẫn và dí dỏm. Lời thoại này phải được trả về dưới dạng một MẢNG các chuỗi.
2.  **Tạo Gợi ý Hình ảnh:** Đối với MỖI câu trong lời thoại, hãy tạo một gợi ý hình ảnh ('imagePrompt') tương ứng, đặt Professor Stickman làm trung tâm.
3.  **Ghi chú (Tùy chọn):** ${includeTextNote ? `Giá trị 'textNote' cho mỗi gợi ý phải chính xác là câu thoại tương ứng.` : `Để trống giá trị 'textNote'.` }

CÁC QUY TẮC CỰC KỲ QUAN TRỌNG:
1.  **TEASER, KHÔNG PHẢI TÓM TẮT:** Lời thoại chỉ nên đặt câu hỏi hấp dẫn để tạo sự tò mò tối đa.
2.  **SỐ TỪ NGHIÊM NGẶT:** Tổng số từ phải rất gần với "Số từ mục tiêu" (${targetWordCount} từ).
3.  **NGÔN NGỮ:** Lời thoại ('trailerVoiceover') phải bằng Tiếng Việt. Gợi ý hình ảnh ('imagePrompt') phải bằng Tiếng Anh.
4.  **NHÂN VẬT TRUNG TÂM:** Professor Stickman phải xuất hiện thường xuyên trong các gợi ý hình ảnh, phản ứng với thông tin bằng các biểu cảm hài hước.
5.  **ĐỒNG BỘ HÓA:** Số lượng gợi ý hình ảnh phải khớp chính xác với số câu thoại.

${outputInstruction}
`;
    };

    const handleCreateTrailer = useCallback(async () => {
        if (!scriptText) {
            updateToolState(toolId, { error: "Kịch bản trống." });
            return;
        }
        updateToolState(toolId, { error: null, generatedTrailer: null });
        clear();
        
        const prompt = getPrompt('vi', false);
        const jsonSchema = { type: Type.OBJECT, properties: { trailerData: { type: Type.OBJECT, properties: { trailerVoiceover: { type: Type.ARRAY, items: { type: Type.STRING } }, prompts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { textNote: { type: Type.STRING }, imagePrompt: { type: Type.STRING } }, required: ["imagePrompt"] } } }, required: ["trailerVoiceover", "prompts"] } }, required: ["trailerData"] };
        
        generate({ model: SCRIPT_GENERATOR_MODEL, contents: prompt, config: { responseMimeType: "application/json", responseSchema: jsonSchema } });
    }, [scriptText, mainTitle, trailerDuration, textNoteLanguage, includeTextNote, generate]);
    
    const handleDownloadTrailer = () => {
        if (!generatedTrailer) return;
        let content = `### LỜI ĐỌC TRAILER ###\n\n`;
        content += Array.isArray(generatedTrailer.trailerVoiceover) 
            ? generatedTrailer.trailerVoiceover.join('\n') 
            : generatedTrailer.trailerVoiceover;
        
        content += `\n\n\n### GỢI Ý HÌNH ẢNH ###\n\n`;
        
        generatedTrailer.prompts.forEach((p, i) => {
            if (p.textNote) {
                content += `[Câu ${i+1}: "${p.textNote}"]\n`;
            }
            content += `${p.imagePrompt}\n\n`;
        });
    
        const blob = new Blob([content.trim()], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trailer_${slugify(mainTitle)}.txt`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    return (
        <ToolLayout tool={tool} language={textNoteLanguage.toLowerCase() as 'vi' | 'en'} setLanguage={(lang) => updateToolState(toolId, { textNoteLanguage: lang.toUpperCase() as LanguageCode })} getPrompt={getPrompt}>
            <div className="flex flex-col gap-6">
                <Textarea label="Kịch bản từ Bước 3" id="script" value={scriptText} onChange={e => updateToolState(toolId, { scriptText: e.target.value })} placeholder="Dán toàn bộ kịch bản đã tải về từ Bước 3..." rows={8} required />
                <Textarea label="Dàn ý từ Bước 2 (Tùy chọn, để lấy tiêu đề)" id="outline" value={outlineText} onChange={e => updateToolState(toolId, { outlineText: e.target.value })} placeholder="Dán dàn ý để trích xuất tiêu đề chính xác..." rows={4} />
                
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <label htmlFor="trailerDuration" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Thời lượng trailer (giây): <span className="font-bold text-sky-600 dark:text-sky-400">{trailerDuration}</span></label>
                    <input type="range" id="trailerDuration" min="10" max="120" step="5" value={trailerDuration} onChange={e => updateToolState(toolId, { trailerDuration: Number(e.target.value) })} className="w-full h-2 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                </div>
                
                <button onClick={handleCreateTrailer} disabled={isLoading || !scriptText} className={`w-full flex justify-center items-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-md ${isLoading ? 'bg-red-600' : 'bg-green-600 hover:bg-green-700 disabled:bg-zinc-500'}`}>
                    {isLoading ? <><Spinner/> Đang tạo...</> : 'Tạo Trailer & Gợi ý Hình ảnh'}
                </button>
                
                 {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}

                 {generatedTrailer && (
                    <div className="mt-6 animate-fade-in-down">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-sky-600 dark:text-sky-400">Kết quả Trailer</h2>
                            <button onClick={handleDownloadTrailer} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-3 rounded-md transition duration-300 text-sm">
                                <DownloadIcon /> Tải xuống
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                <h3 className="font-bold text-sky-500 dark:text-sky-400 mb-2">Lời đọc Trailer</h3>
                                 <div className="text-sm space-y-2">
                                    {Array.isArray(generatedTrailer.trailerVoiceover) 
                                        ? generatedTrailer.trailerVoiceover.map((line, i) => <p key={i}>{line}</p>)
                                        : <p>{generatedTrailer.trailerVoiceover}</p>
                                    }
                                </div>
                            </div>
                     
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                <h3 className="font-bold text-sky-500 dark:text-sky-400 mb-2">Gợi ý Hình ảnh cho Trailer</h3>
                                <div className="space-y-4">
                                    {generatedTrailer.prompts.map((promptObj, index) => (
                                        <div key={index} className="bg-white dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
                                            {promptObj.textNote && (
                                                <p className="text-sm italic text-zinc-600 dark:text-zinc-400 font-semibold">
                                                    <span className="text-sky-500 dark:text-sky-400 not-italic font-bold mr-2">{index + 1}.</span>
                                                    "{promptObj.textNote}"
                                                </p>
                                            )}
                                            <pre className={`whitespace-pre-wrap font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md ${!promptObj.textNote ? 'mt-0' : 'mt-2'}`}>
                                                {promptObj.imagePrompt}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                 )}
            </div>
        </ToolLayout>
    );
};

export default EdutainmentTrailerGenerator;