import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AI_TOOLS, SCRIPT_GENERATOR_MODEL, getToolThemeColors } from '../../constants';
import Spinner from '../ui/Spinner';
import { DownloadIcon, PlayIcon, CopyIcon, CheckIcon } from '../ui/Icon';
import { type GeneratedScriptPart, type HistoryOutlinePart } from '../../types';
import { useToolState } from '../../contexts/ToolStateContext';
import ToolLayout from './common/ToolLayout';
import { slugify } from '../../utils/slugify';
import useGeminiApi from '../../hooks/useGeminiApi';

interface ParsedOutline {
    mainTitle: string;
    parts: HistoryOutlinePart[];
}

const EdutainmentScriptGenerator: React.FC = () => {
    const tool = AI_TOOLS.find(t => t.id === 'edutainment-script')!;
    const themeColors = getToolThemeColors(tool.category);
    const toolId = 'edutainment-script';
    const { getToolState, updateToolState } = useToolState();

    const outlineState = getToolState('edutainment-outline');
    
    const state = getToolState(toolId);
    const {
        outlineText = outlineState.outlineText || '',
        language = outlineState.language || 'VI',
        mainTitle = outlineState.mainTitle || 'Edutainment Video',
        generatedScriptParts = []
    } = state;
    
    const { generate, isLoading, cancel, error: apiError } = useGeminiApi();
    const [currentError, setCurrentError] = useState<string | null>(null);

    useEffect(() => {
        if (outlineState.outlineText && outlineState.outlineText !== outlineText) {
            updateToolState(toolId, { 
                outlineText: outlineState.outlineText,
                language: outlineState.language || 'VI',
                mainTitle: outlineState.generatedOutline?.title || 'Edutainment Video',
                generatedScriptParts: []
            });
        }
    }, [outlineState, outlineText, updateToolState, toolId]);

    const [currentlyGeneratingPart, setCurrentlyGeneratingPart] = useState<number | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const parsedOutline = useMemo((): ParsedOutline | null => {
        if (!outlineText) return null;
        try {
            const mainTitleMatch = outlineText.match(/^(.*?)\n={2,}/);
            const title = mainTitleMatch ? mainTitleMatch[1].trim() : mainTitle;
            
            const partRegex = /Part (\d+): (.+?)\s*\(Est. Words: (\d+), Est. Paragraphs: (\d+)\)\s*([\s\S]*?)(?=Part \d+:|\s*$)/g;
            const parts: HistoryOutlinePart[] = [];
            let match;
            while ((match = partRegex.exec(outlineText)) !== null) {
                parts.push({
                    part: parseInt(match[1], 10),
                    title: match[2].trim(),
                    estimatedWords: parseInt(match[3], 10),
                    estimatedParagraphs: parseInt(match[4], 10),
                    description: match[5].trim(),
                });
            }
            if (parts.length === 0) return null;
            return { mainTitle: title, parts };
        } catch (e) {
            console.error("Error parsing outline:", e);
            return null;
        }
    }, [outlineText, mainTitle]);

    const createPromptForPart = (part: HistoryOutlinePart, totalParts: number) => {
        if (!parsedOutline) return '';
        const channelName = getToolState('edutainment-topic')?.channelName || 'Curious Minds';
        
        return `ROLE: You are the head scriptwriter for a smash-hit Edutainment YouTube channel. Your signature style is making complex topics simple, fascinating, and genuinely funny. You write with the voice of a charismatic, slightly quirky professor (Professor Stickman). Your task is to write a single, complete part of a script in **${language}**.

---
**PRODUCTION BRIEF**
---
- DOCUMENTARY TITLE: ${parsedOutline.mainTitle}
- SCRIPT LANGUAGE: ${language}
- CHANNEL NAME: ${channelName}
- **NARRATOR PERSONA:** The script is for our host, **Professor Stickman**. He is wise, witty, charismatic, and loves using clever, funny analogies. Write in a conversational, first-person style (e.g., "So, what if I told you...", "This is where things get wonderfully weird...", "Let's break it down.").
- CURRENT PART DETAILS:
  - Part Number: ${part.part} of ${totalParts}
  - Part Title: ${part.title}
  - Part Description: ${part.description}
  - Target Paragraph Count: ${part.estimatedParagraphs} paragraphs (CRITICAL REQUIREMENT)

This script must make the viewer feel smart, fascinated, and like they've just had a great time. It should be rich with visual language that suggests fun animations.

---
**WRITING & FORMATTING RULES (STRICTLY ENFORCED)**
---
1.  **Paragraph Count (MOST IMPORTANT RULE):** You MUST generate **exactly ${part.estimatedParagraphs} paragraphs**.
2.  **Tone & Humor (CRITICAL):** The script MUST be engaging and witty. Inject humor through clever wordplay, relatable modern examples, funny analogies, and moments of playful self-awareness. The goal is to educate AND entertain simultaneously.
3.  **Seamless Flow:** The narrative must flow continuously. **DO NOT** add any introductory phrases like "In this part...".
4.  **Focus:** Write **ONLY** the content for Part ${part.part}.
5.  **Paragraph Structure:** Each paragraph is a complete thought for a voiceover, separated by a single blank line. Vary sentence length for good pacing.
6.  **No Extra Formatting:** Do **NOT** include titles, sub-headers, or cues like [SFX:]. Just the pure narrative script.
7.  **Cultural Nuance:** The vocabulary must be natural and modern for a **${language}**-speaking audience.

---
**YOUR TASK**
---
Write the complete script for Part ${part.part} now in **${language}**, in the voice of Professor Stickman, following all the rules above. Your highest priority is to match the target paragraph count of ${part.estimatedParagraphs} while being as entertaining as possible.`;
    };

    const handleStartGeneration = useCallback(async () => {
        if (!parsedOutline) {
            setCurrentError('Dàn ý không hợp lệ. Vui lòng dán dàn ý đã tạo từ Bước 2.');
            return;
        }
        setCurrentError(null);
        updateToolState(toolId, { generatedScriptParts: [] });
        const newParts: GeneratedScriptPart[] = [];

        for (let i = 0; i < parsedOutline.parts.length; i++) {
            const partToGenerate = parsedOutline.parts[i];
            setCurrentlyGeneratingPart(partToGenerate.part);
            
            const prompt = createPromptForPart(partToGenerate, parsedOutline.parts.length);
            
            try {
                const response = await generate({ model: SCRIPT_GENERATOR_MODEL, contents: prompt });
                
                if (response === null && !apiError) { // This means it was cancelled
                    setCurrentError("Tác vụ đã bị người dùng hủy.");
                    break;
                }

                if (response && response.text) {
                    const generatedContent = response.text.trim();
                    const newPart: GeneratedScriptPart = {
                        partIndex: i,
                        title: partToGenerate.title,
                        content: generatedContent,
                        paragraphCount: generatedContent.split('\n\n').length,
                    };
                    newParts.push(newPart);
                    updateToolState(toolId, { generatedScriptParts: [...newParts] });
                } else {
                    throw new Error(apiError || "API response was empty.");
                }
            } catch (e: any) {
                setCurrentError(`Lỗi Phần ${partToGenerate.part}: ${e.message}`);
                setCurrentlyGeneratingPart(null);
                return;
            }
        }
        setCurrentlyGeneratingPart(null);
    }, [parsedOutline, language, updateToolState, generate, apiError]);
    
    const getFullScriptTextForDownload = () => {
        if (generatedScriptParts.length === 0) return '';
        return generatedScriptParts
            .sort((a, b) => a.partIndex - b.partIndex)
            .map(part => part.content.trim())
            .join('\n\n---\n\n');
    };

    const getFullScriptTextForState = () => {
        if (!parsedOutline || generatedScriptParts.length === 0) return '';
        let fullScript = ``;
        generatedScriptParts.sort((a, b) => a.partIndex - b.partIndex).forEach((part) => {
            const partFromOutline = parsedOutline.parts.find(p => p.part === part.partIndex + 1);
            fullScript += `### ${partFromOutline?.title} ###\n\n`;
            fullScript += part.content.trim() + '\n\n';
        });
        return fullScript.trim();
    };

    const handleDownloadScript = () => {
        const fullScript = getFullScriptTextForDownload();
        if (!fullScript || !parsedOutline) return;
        const blob = new Blob([fullScript], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `script_${slugify(parsedOutline.mainTitle)}.txt`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };
    
    const handleCopyScript = () => {
        const fullScript = getFullScriptTextForDownload();
        if (!fullScript) return;
        navigator.clipboard.writeText(fullScript);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    const handleContinue = () => {
        const fullScriptForState = getFullScriptTextForState();
        if (!fullScriptForState || !parsedOutline) return;
        updateToolState('edutainment-image-assets', { scriptText: fullScriptForState, mainTitle: parsedOutline.mainTitle, language: language });
        updateToolState('edutainment-creative', { scriptText: fullScriptForState, mainTitle: parsedOutline.mainTitle, language: language });
        alert("Đã sao chép kịch bản! Vui lòng chuyển sang công cụ '4. Tạo Tài Sản Hình Ảnh' để tiếp tục.");
    };

    const totalWordsInOutline = parsedOutline?.parts.reduce((sum, p) => sum + p.estimatedWords, 0) || 0;
    const totalWordsInScript = generatedScriptParts.reduce((sum, p) => sum + p.content.split(/\s+/).filter(Boolean).length, 0);

    return (
        <ToolLayout tool={tool} language={'vi'} setLanguage={() => {}} getPrompt={() => ""}>
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg shadow-inner">
                        <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Tóm tắt Đầu vào (từ Dàn ý)</h4>
                        <p className={`text-lg font-bold ${themeColors.text}`}>{parsedOutline?.parts.length || 0} Phần / {totalWordsInOutline.toLocaleString()} Từ</p>
                    </div>
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg shadow-inner">
                        <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Tóm tắt Đầu ra (từ Kịch bản)</h4>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{generatedScriptParts.length} Phần / {totalWordsInScript.toLocaleString()} Từ</p>
                    </div>
                </div>

                <button 
                    onClick={isLoading ? cancel : handleStartGeneration} 
                    disabled={!outlineText && !isLoading} 
                    className={`w-full flex justify-center items-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-md ${
                        isLoading 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : `bg-gradient-to-br ${themeColors.buttonGradient} hover:opacity-90 disabled:from-zinc-500`
                    }`}
                >
                    {isLoading ? <><i className="fas fa-stop-circle mr-2"></i> Dừng tạo (Phần {currentlyGeneratingPart})...</> : <><PlayIcon /> Bắt đầu tạo tự động</>}
                </button>
                {(apiError || currentError) && <p className="text-red-500 dark:text-red-400 text-sm text-center">{apiError || currentError}</p>}
                {!parsedOutline && outlineText && <p className="text-yellow-500 dark:text-yellow-400 text-sm text-center">Định dạng dàn ý không hợp lệ. Vui lòng sao chép chính xác từ Bước 2.</p>}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[40rem]">
                    {/* Left Pane: Outline */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 h-[40rem] overflow-y-auto w-full shadow-inner">
                        <h3 className={`text-xl font-bold ${themeColors.text} mb-4`}>Dàn ý</h3>
                        {parsedOutline ? (
                             <div className="space-y-3">
                                {parsedOutline.parts.map((part, index) => {
                                    const isDone = generatedScriptParts.some(p => p.partIndex === index);
                                    const isGenerating = currentlyGeneratingPart === part.part;
                                    return (
                                        <div key={index} className={`p-3 rounded-md border-l-4 transition-all ${isDone ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : isGenerating ? `${themeColors.border} ${themeColors.selectedBg} animate-pulse` : 'border-zinc-300 dark:border-zinc-600'}`}>
                                            <p className="font-bold text-zinc-800 dark:text-zinc-200">Part {part.part}: {part.title}</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{part.estimatedWords} từ / {part.estimatedParagraphs} đoạn</p>
                                        </div>
                                    );
                                })}
                             </div>
                        ) : <p className="text-center text-zinc-500 dark:text-zinc-400 pt-16">Dữ liệu dàn ý từ Bước 2 sẽ xuất hiện ở đây.</p>}
                    </div>

                    {/* Right Pane: Script */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 h-[40rem] overflow-y-auto w-full prose dark:prose-invert prose-base max-w-none shadow-inner">
                        {generatedScriptParts.length === 0 && <p className="text-zinc-500 dark:text-zinc-400 text-center italic mt-16">Nội dung kịch bản sẽ xuất hiện ở đây...</p>}
                        {generatedScriptParts.length > 0 && (
                            <div className="space-y-8 p-2">
                                {generatedScriptParts.sort((a, b) => a.partIndex - b.partIndex).map((part) => (
                                    <div key={part.partIndex}>
                                        <h3 className={`font-bold ${themeColors.text}`}>Part {part.partIndex + 1}: {part.title}</h3>
                                        <div className="whitespace-pre-wrap font-sans">{part.content}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                 {generatedScriptParts.length > 0 && generatedScriptParts.length === parsedOutline?.parts.length && (
                     <div className="flex justify-center items-center gap-4">
                        <button onClick={handleCopyScript} className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-bold py-2 px-4 rounded-md transition duration-300 text-sm">
                            {isCopied ? <CheckIcon /> : <CopyIcon />} {isCopied ? 'Đã sao chép' : 'Copy Script'}
                        </button>
                        <button onClick={handleDownloadScript} className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-bold py-2 px-4 rounded-md transition duration-300 text-sm">
                            <DownloadIcon /> Download Script (.txt)
                        </button>
                        <button onClick={handleContinue} className={`flex items-center gap-2 ${themeColors.buttonSolid} text-white font-bold py-2 px-4 rounded-md transition duration-300 text-sm`}>
                            Tiếp tục
                        </button>
                    </div>
                 )}

            </div>
        </ToolLayout>
    );
};

export default EdutainmentScriptGenerator;