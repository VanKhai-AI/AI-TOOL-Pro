import React, { useEffect } from 'react';
import { AI_TOOLS, getToolThemeColors } from '../../constants';
import ToolLayout from './common/ToolLayout';
import Textarea from './common/Textarea';
import ResultDisplay from './common/ResultDisplay';
import { useToolState } from '../../contexts/ToolStateContext';
import useGeminiApi from '../../hooks/useGeminiApi';
import Spinner from '../ui/Spinner';

const FactChecker: React.FC = () => {
    const toolId = 'fact-checker';
    const tool = AI_TOOLS.find(t => t.id === toolId)!;
    const themeColors = getToolThemeColors(tool.category);
    const { getToolState, updateToolState } = useToolState();
    const state = getToolState(toolId);
    const { 
        input = '', 
        language = 'vi',
        result: storedResult = null,
        groundingMetadata: storedMetadata = null,
    } = state;

    const { isLoading, error, result, generate, clear, cancel } = useGeminiApi();

    useEffect(() => {
        if (result) {
            updateToolState(toolId, { 
                result: result.text,
                groundingMetadata: result.candidates?.[0]?.groundingMetadata ?? null
            });
        }
    }, [result, updateToolState, toolId]);
    
    useEffect(() => {
        updateToolState(toolId, { error: error });
    }, [error, updateToolState, toolId]);

    const getPrompt = (claims: string, lang: 'vi' | 'en') => {
        const langSpecifics = lang === 'vi' 
            ? { 
                role: "Bạn là một người kiểm tra sự thật tỉ mỉ và khách quan.", 
                task: "Phân tích văn bản được cung cấp, xác định tất cả các tuyên bố có thể kiểm chứng được và sử dụng Google Search để xác minh tính chính xác của chúng.", 
                outputReq: "Tạo một bảng markdown chi tiết với 4 cột sau:", 
                columns: ["Tuyên bố", "Xếp hạng", "Phân tích", "Nguồn chính"], 
                ranks: `"Đúng", "Sai", "Gây hiểu lầm", "Không thể xác minh"`
              }
            : { 
                role: "You are a meticulous and objective fact-checker.", 
                task: "Analyze the provided text, identify all verifiable claims, and use Google Search to verify their accuracy.", 
                outputReq: "Generate a detailed markdown table with the following 4 columns:", 
                columns: ["Claim", "Rating", "Analysis", "Primary Source"], 
                ranks: `"True", "False", "Misleading", "Unverifiable"` 
              };
    
        return `
VAI TRÒ CỦA BẠN: ${langSpecifics.role}

NHIỆM VỤ CHÍNH: ${langSpecifics.task}

VĂN BẢN ĐỂ PHÂN TÍCH:
---
${claims}
---

YÊU CẦU ĐẦU RA:
${langSpecifics.outputReq}
- **${langSpecifics.columns[0]}:** Trích dẫn chính xác tuyên bố từ văn bản gốc.
- **${langSpecifics.columns[1]}:** Đánh giá tính chính xác của tuyên bố. Chỉ sử dụng một trong các xếp hạng sau: ${langSpecifics.ranks}.
- **${langSpecifics.columns[2]}:** Cung cấp một lời giải thích ngắn gọn, dựa trên bằng chứng cho xếp hạng của bạn. Giải thích tại sao tuyên bố đó đúng, sai hoặc gây hiểu lầm. Đối với các tuyên bố "Không thể xác minh", hãy giải thích tại sao không thể tìm thấy thông tin xác nhận.
- **${langSpecifics.columns[3]}:** Liệt kê MỘT nguồn đáng tin cậy nhất mà bạn đã sử dụng để xác minh.

QUY TẮC BẮT BUỘC:
- Chỉ đánh giá các tuyên bố khách quan, có thể kiểm chứng được. Bỏ qua các ý kiến, quan điểm chủ quan hoặc các tuyên bố mang tính suy đoán.
- Phân tích toàn bộ văn bản và không bỏ sót bất kỳ tuyên bố nào.
- Luôn giữ giọng điệu trung lập và khách quan trong phân tích của bạn.
`;
    };

    const handleGenerate = () => {
        if (!input) return;
        const prompt = getPrompt(input, language);
        generate({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
    };

    const handleClear = () => {
        clear();
        updateToolState(toolId, { result: null, groundingMetadata: null, error: null });
    };
    
    const getPromptForCopy = () => getPrompt(input || '[Dán văn bản của bạn vào đây]', language);

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
                    label="Văn bản cần kiểm tra"
                    value={input}
                    onChange={(e) => updateToolState(toolId, { input: e.target.value })}
                    rows={15}
                    placeholder="Dán đoạn văn bản, bài báo hoặc các tuyên bố bạn muốn kiểm tra sự thật vào đây..."
                    ringColorClass={themeColors.ring}
                />
                <button
                    onClick={isLoading ? cancel : handleGenerate}
                    disabled={!input}
                    className={`w-full flex justify-center items-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:from-zinc-500 disabled:to-zinc-400 disabled:opacity-100 disabled:cursor-not-allowed ${
                        isLoading 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : `bg-gradient-to-br ${themeColors.buttonGradient} hover:opacity-90`
                    }`}
                >
                    {isLoading ? <><i className="fas fa-stop-circle mr-2"></i>Dừng</> : 'Kiểm tra sự thật'}
                </button>
            </div>
            <ResultDisplay isLoading={isLoading} result={storedResult} error={error} onClear={handleClear} groundingMetadata={storedMetadata} />
        </ToolLayout>
    );
};

export default FactChecker;