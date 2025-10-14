import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Type } from '@google/genai';
import { AI_TOOLS, SCRIPT_GENERATOR_MODEL, getToolThemeColors } from '../../constants';
import { type HistoryOutline, type HistoryOutlinePart, type TopicIdea } from '../../types';
import Spinner from '../ui/Spinner';
import { DownloadIcon, CopyIcon, CheckIcon } from '../ui/Icon';
import { useToolState } from '../../contexts/ToolStateContext';
import { slugify } from '../../utils/slugify';
import ToolLayout from './common/ToolLayout';
import Textarea from './common/Textarea';
import useGeminiApi from '../../hooks/useGeminiApi';
import Input from './common/Input';

const OutlineBlock: React.FC<{ title: string; metadata: string; content: string; onCopy: () => void; isCopied: boolean; textColor: string }> = 
({ title, metadata, content, onCopy, isCopied, textColor }) => {
    return (
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg p-4 relative">
            <div className="absolute top-2 right-2 flex items-center gap-2">
                <button onClick={onCopy} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors" title="Sao chép">
                    {isCopied ? <CheckIcon /> : <CopyIcon />}
                </button>
            </div>
            <h4 className={`font-semibold ${textColor} mb-1 pr-16`}>{title}</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 italic mb-2">{metadata}</p>
            <div className="whitespace-pre-wrap font-sans text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
                {content}
            </div>
        </div>
    );
};

const EdutainmentOutlineGenerator: React.FC = () => {
    const tool = AI_TOOLS.find(t => t.id === 'edutainment-outline')!;
    const themeColors = getToolThemeColors(tool.category);
    const toolId = 'edutainment-outline';
    const { getToolState, updateToolState } = useToolState();

    const topicState = getToolState('edutainment-topic');
    const selectedTopic: TopicIdea | null = topicState.generatedTopics?.[topicState.selectedTopicIndex] || null;

    const state = getToolState(toolId);
    const {
        documentaryTopic = '',
        mainMessage = '',
        duration = 10,
        readingSpeed = 150,
        teachingStyle = 'Edutainment',
        language = 'VI',
        error = null,
        generatedOutline = null
    } = state;
    
    useEffect(() => {
        if (selectedTopic) {
            const topicTitle = language === 'VI' ? selectedTopic.proposedTitleVI : selectedTopic.proposedTitle;
            const userIdeas = `Keywords: ${selectedTopic.trendAnalysis.mainKeywords.join(', ')}\nReason: ${language === 'VI' ? selectedTopic.trendAnalysis.attractionReasonVI : selectedTopic.trendAnalysis.attractionReason}\nCuriosity Hook: ${selectedTopic.effectivenessAnalysis.curiosityHook}\nLearning Value: ${selectedTopic.effectivenessAnalysis.learningValue}\nVisual Potential: ${selectedTopic.effectivenessAnalysis.visualPotential}\nSimplification Power: ${selectedTopic.effectivenessAnalysis.simplificationPower}`;
            updateToolState(toolId, { documentaryTopic: topicTitle, mainMessage: userIdeas });
        }
    }, [selectedTopic, language, updateToolState, toolId]);

    const { isLoading, error: apiError, result, generate, clear, cancel } = useGeminiApi();

    useEffect(() => {
      if (apiError) updateToolState(toolId, { error: apiError });
    }, [apiError, updateToolState]);

    useEffect(() => {
        if (result) {
            try {
                const cleanJson = result.text.replace(/```json\n?|```/g, '');
                const parsed = JSON.parse(cleanJson) as HistoryOutline;
                if (parsed && parsed.parts && Array.isArray(parsed.parts)) {
                    updateToolState(toolId, { generatedOutline: parsed });
                } else {
                    throw new Error("Không thể phân tích dàn ý đã tạo. Vui lòng thử lại.");
                }
            } catch (e: any) {
                updateToolState(toolId, { error: e.message || "Lỗi phân tích phản hồi JSON." });
            }
        }
    }, [result, updateToolState]);
    
    const [copiedStatus, setCopiedStatus] = useState<Record<string, boolean>>({});

    const totalWords = duration * readingSpeed;
    const paragraphWordCountAvg = 20;

    const getPrompt = () => {
      if (!documentaryTopic) return 'Vui lòng chọn một chủ đề từ Bước 1.';
      const channelName = getToolState('edutainment-topic').channelName || 'Curious Minds';
      
      return `{
  "role": "You are a brilliant and witty Content Architect for an Edutainment channel that makes learning hilarious and addictive. Your mission is to create a detailed, logically structured outline for the channel '${channelName}'.",
  "input_information": {
    "output_language": "${language}",
    "video_topic": "${documentaryTopic}",
    "user_ideas_main_message": "${mainMessage}",
    "teaching_style_reference": "A '${teachingStyle}' style that simplifies complex topics through **hilarious analogies**, charming animations, and a witty, conversational narrative style. The tone is curious, enthusiastic, and playfully intelligent, making learning feel like discovering a wonderful secret.",
    "desired_video_duration": "${duration}",
    "reading_speed": "${readingSpeed}",
    "target_total_words": "${totalWords}"
  },
  "internal_process_for_best_results": {
    "1_hook_analysis_and_ideation": "Brainstorm a powerful 'hook'. It must be a surprising fact, a counter-intuitive question, or a **relatable, funny problem** that immediately draws the viewer into the core question of the video.",
    "2_word_allocation_to_5_part_structure": "Allocate the total target words (${totalWords}) into a 5-part structure designed for maximum clarity and retention:\\n- **Part 1: Giới Thiệu & Hook (Introduction & Hook):** ~10% of words. Start with the compelling, often humorous, hook. Clearly state the central question.\\n- **Part 2: Bối Cảnh & Nền tảng (Context & Foundation):** ~20% of words. Explain the essential concepts using simple, funny analogies. This is the 'Before we explain the rocket, let's talk about why dropping a water balloon is so satisfying' section.\\n- **Part 3: Giải Thích Cốt Lõi (Core Explanation / Deep Dive):** ~45% of words. Break down the core topic step-by-step. This section should be rich with descriptions that suggest **charming animations and witty visual gags featuring Professor Stickman**.\\n- **Part 4: Ý Nghĩa & Ứng Dụng (Implications & Real-World Connection):** ~20% of words. Connect the topic to the real world. Why does this matter? What are the surprising connections to everyday life?\\n- **Part 5: Kết Luận & Kêu Gọi Hành Động (Conclusion & CTA):** ~5% of words. Briefly summarize the main takeaway in a memorable, often witty, way. End with a call to action."
  },
  "output_outline_rules": {
    "1_clear_part_naming": "The title of each part must be clear, descriptive, and curiosity-driven.",
    "2_paragraph_calculation": "For each part, calculate \`estimatedParagraphs\` by taking \`estimatedWords\` and dividing by ${paragraphWordCountAvg}, rounding to the nearest integer.",
    "3_language_and_tone": "The entire outline MUST be written in the **${language}** language. The tone should be curious, clear, enthusiastic, and **humorous**, perfect for an edutainment channel that doesn't take itself too seriously."
  },
  "json_output_format_required": "- You MUST return a single JSON object.\\n- The object must contain a 'title' key with the value '${documentaryTopic}'.\\n- It must also contain a 'parts' key, which is an array of part objects.\\n- Each object in the 'parts' array must have this structure:\\n    - **part**: Sequential number starting from 1.\\n    - **title**: Descriptive title for the part.\\n    - **description**: A brief summary of the content, highlighting opportunities for humor and simple analogies.\\n    - **estimatedWords**: Estimated word count for this part.\\n    - **estimatedParagraphs**: Estimated paragraph count for this part."
}`;
    };

    const handleGenerateOutline = useCallback(async () => {
        if (!documentaryTopic) {
            updateToolState(toolId, { error: "Vui lòng nhập chủ đề video." });
            return;
        }
        updateToolState(toolId, { error: null, generatedOutline: null });
        clear();
        
        const prompt = getPrompt();
        const jsonSchema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, parts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { part: { type: Type.NUMBER }, title: { type: Type.STRING }, description: { type: Type.STRING }, estimatedWords: { type: Type.NUMBER }, estimatedParagraphs: { type: Type.NUMBER } }, required: ["part", "title", "description", "estimatedWords", "estimatedParagraphs"] } } }, required: ["title", "parts"] };

        generate({ model: SCRIPT_GENERATOR_MODEL, contents: prompt, config: { responseMimeType: "application/json", responseSchema: jsonSchema } });
    }, [documentaryTopic, mainMessage, duration, readingSpeed, teachingStyle, language, generate]);

    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedStatus(prev => ({ ...prev, [id]: true }));
        setTimeout(() => setCopiedStatus(prev => ({ ...prev, [id]: false })), 2000);
    };
    
    const getFullOutlineText = () => {
        if (!generatedOutline) return '';
        let content = `${generatedOutline.title}\n\n========================================\n\n`;
        generatedOutline.parts.forEach((part: HistoryOutlinePart) => {
            content += `Part ${part.part}: ${part.title}\n(Est. Words: ${part.estimatedWords}, Est. Paragraphs: ${part.estimatedParagraphs})\n\n${part.description}\n\n\n`;
        });
        return content.trim();
    };

    const handleCopyAllOutline = () => {
        const content = getFullOutlineText();
        if (!content) return;
        handleCopy(content, 'all_outline');
    };

    const handleDownloadAllOutline = () => {
        const content = getFullOutlineText();
        if (!content || !generatedOutline) return;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `outline_${slugify(generatedOutline.title)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleContinueToScript = () => {
        if (!generatedOutline) return;
        updateToolState('edutainment-script', { 
            outlineText: getFullOutlineText(), 
            language: language,
            mainTitle: generatedOutline.title
        });
        alert("Đã sao chép dàn ý! Vui lòng chuyển sang công cụ '3. Tạo Kịch Bản Edutainment' để tiếp tục.");
    };

    return (
        <ToolLayout tool={tool} language={'vi'} setLanguage={(lang) => {}} getPrompt={getPrompt}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className={`text-2xl font-bold ${themeColors.text} mb-4`}>Cài đặt dàn ý</h2>
                    <div className="flex flex-col gap-6 bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-lg">
                        <Input label="Chủ đề phim tài liệu" id="topic" value={documentaryTopic} onChange={e => updateToolState(toolId, { documentaryTopic: e.target.value })} placeholder="Chọn một chủ đề từ Bước 1 để tự động điền..." ringColorClass={themeColors.ring} />
                        <Textarea label="Thông điệp chính / Ý tưởng người dùng" id="message" value={mainMessage} onChange={e => updateToolState(toolId, { mainMessage: e.target.value })} placeholder="Chi tiết từ Bước 1 sẽ xuất hiện ở đây..." rows={8} ringColorClass={themeColors.ring} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="duration" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Thời lượng (phút): <span className={`font-bold ${themeColors.text}`}>{duration}</span></label>
                                <input type="range" id="duration" min="1" max="60" value={duration} onChange={e => updateToolState(toolId, { duration: Number(e.target.value) })} className={`w-full h-2 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer ${themeColors.accent}`} />
                            </div>
                            <div>
                                <label htmlFor="readingSpeed" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Tốc độ đọc (từ/phút): <span className={`font-bold ${themeColors.text}`}>{readingSpeed}</span></label>
                                <input type="range" id="readingSpeed" min="100" max="250" step="5" value={readingSpeed} onChange={e => updateToolState(toolId, { readingSpeed: Number(e.target.value) })} className={`w-full h-2 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer ${themeColors.accent}`} />
                            </div>
                             <div>
                                <label htmlFor="teachingStyle" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Phong cách Video</label>
                                <select id="teachingStyle" value={teachingStyle} onChange={e => updateToolState(toolId, { teachingStyle: e.target.value })} className={`w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md p-2 focus:ring-2 ${themeColors.ring} ${themeColors.focusBorder}`}>
                                    <option value="Edutainment">Giáo dục giải trí (Edutainment)</option>
                                    <option value="Storytelling/Narrative">Kể chuyện / Tường thuật</option>
                                    <option value="Analytical/In-depth">Phân tích / Chuyên sâu</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={isLoading ? cancel : handleGenerateOutline} disabled={!documentaryTopic && !isLoading} className={`w-full flex justify-center items-center gap-2 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md ${isLoading ? 'bg-red-600 hover:bg-red-700' : `bg-gradient-to-br ${themeColors.buttonGradient} hover:opacity-90 disabled:from-zinc-500 disabled:to-zinc-400`}`}>
                           {isLoading ? <><Spinner /> Đang tạo...</> : 'Tạo dàn ý'}
                        </button>
                        {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2 text-center">{error}</p>}
                    </div>
                </div>
                <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <h2 className={`text-2xl font-bold ${themeColors.text}`}>Dàn ý đã tạo</h2>
                        {generatedOutline && generatedOutline.parts.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button onClick={handleCopyAllOutline} className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-bold py-2 px-3 rounded-md transition duration-300 text-sm">
                                    {copiedStatus['all_outline'] ? <CheckIcon /> : <CopyIcon />} Sao chép
                                </button>
                                <button onClick={handleDownloadAllOutline} className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-bold py-2 px-3 rounded-md transition duration-300 text-sm">
                                    <DownloadIcon /> Tải xuống
                                </button>
                                <button onClick={handleContinueToScript} className={`flex items-center gap-2 ${themeColors.buttonSolid} text-white font-bold py-2 px-3 rounded-md transition duration-300 text-sm`}>
                                    Tiếp tục
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex-grow h-[40rem] overflow-y-auto shadow-lg">
                        {!isLoading && !generatedOutline && <p className="text-zinc-500 dark:text-zinc-400 text-center italic mt-16">Nội dung dàn ý sẽ xuất hiện ở đây...</p>}
                        {generatedOutline && (
                            <div className="space-y-4">
                                <h3 className={`font-bold text-xl ${themeColors.text} p-4`}>{generatedOutline.title}</h3>
                                {generatedOutline.parts.map((part: HistoryOutlinePart, index: number) => {
                                    const partContent = `Part ${part.part}: ${part.title}\n(Est. Words: ${part.estimatedWords}, Est. Paragraphs: ${part.estimatedParagraphs})\n\n${part.description}`;
                                    return <OutlineBlock key={`part-${index}`} title={`Part ${part.part}: ${part.title}`} metadata={`${part.estimatedWords} words, ${part.estimatedParagraphs} paragraphs`} content={part.description} onCopy={() => handleCopy(partContent, `part-${index}`)} isCopied={!!copiedStatus[`part-${index}`]} textColor={themeColors.text} />;
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
};

export default EdutainmentOutlineGenerator;