import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Type } from '@google/genai';
import { AI_TOOLS, SCRIPT_GENERATOR_MODEL, getLanguageName, SUPPORTED_LANGUAGES, getToolThemeColors } from '../../constants';
import { type HistoryOutline, type HistoryOutlinePart, type LanguageCode, type HistoryTopicIdea } from '../../types';
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

const HistoryOutlineGenerator: React.FC = () => {
    const tool = AI_TOOLS.find(t => t.id === 'history-outline')!;
    const themeColors = getToolThemeColors(tool.category);
    const toolId = 'history-outline';
    const { getToolState, updateToolState } = useToolState();
    
    const topicState = getToolState('history-topic');
    const selectedTopic: HistoryTopicIdea | null = topicState.generatedTopics?.[topicState.selectedTopicIndex] || null;

    const state = getToolState(toolId);
    const {
        documentaryTopic = '',
        mainMessage = '',
        duration = 15,
        readingSpeed = 150,
        teachingStyle = 'Người Kể Chuyện Sử Thi (Diễn đạt hùng tráng, giàu cảm xúc theo phong cách điện ảnh)',
        language = 'VI',
        error = null,
        generatedOutline = null
    } = state;

    useEffect(() => {
        if (selectedTopic) {
            const topicTitle = language === 'VI' ? selectedTopic.proposedTitleVI : selectedTopic.proposedTitle;
            const userIdeas = `Keywords: ${selectedTopic.trendAnalysis.mainKeywords.join(', ')}\nReason: ${language === 'VI' ? selectedTopic.trendAnalysis.attractionReasonVI : selectedTopic.trendAnalysis.attractionReason}\nAsymmetry: ${selectedTopic.effectivenessAnalysis.asymmetry}\nStrategic Wit: ${selectedTopic.effectivenessAnalysis.strategicWit}\nSpirit & Heroism: ${selectedTopic.effectivenessAnalysis.spiritAndHeroism}\nSurvival: ${selectedTopic.effectivenessAnalysis.survival}`;
            updateToolState(toolId, { documentaryTopic: topicTitle, mainMessage: userIdeas });
        }
    }, [selectedTopic, language, updateToolState]);
    
    const { isLoading, error: apiError, result, generate, clear, cancel } = useGeminiApi();

    useEffect(() => {
      if (apiError) updateToolState(toolId, { error: apiError });
    }, [apiError, updateToolState]);

    useEffect(() => {
        if (result) {
            try {
                const cleanJson = result.text.replace(/```json\n?|```/g, '');
                const parsed = JSON.parse(cleanJson) as { title: string; parts: HistoryOutlinePart[] };
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

    const getPrompt = () => {
      if (!documentaryTopic) return 'Vui lòng chọn một chủ đề từ Bước 1.';
      const paragraphWordCountAvg = 22;

      return `{
  "role": "You are a World-Class Historical Narrative Architect and Cinematic Storyteller for YouTube, specializing in epic military history and great resistance wars. Your mission is to create a detailed, historically accurate, and emotionally gripping video outline for the channel 'HistoryWhy', adhering strictly to its cinematic style, in-depth analysis, and strategic content formulas.",
  "input_information": {
    "output_language": "${language}",
    "video_topic": "${documentaryTopic}",
    "user_ideas_main_message": "${mainMessage}",
    "teaching_style_reference": "A '${teachingStyle}' style that vividly reconstructs historical events, focusing on the 'Why' behind great conflicts and the 'How' of epic victories. The narrative must be dramatic, emotional, and historically accurate, emphasizing the bravery, ingenuity, and sacrifices of key figures and forces. It should leverage strong visual descriptions (reminiscent of high-quality historical reenactments, animated strategic maps, and impactful graphics) to create an immersive, movie-like experience. The tone should evoke national pride, a sense of awe for ancient warfare, and appreciation for deep historical context, while maintaining an authoritative and well-researched voice.",
    "desired_video_duration": "${duration}",
    "reading_speed": "${readingSpeed}",
    "target_total_words": "${totalWords}"
  },
  "internal_process_for_best_results": {
    "1_hook_analysis_and_ideation": "Based on the given video topic (which should already be in the 'EPIC CRUSHED' format), brainstorm a powerful 'hook' that immediately grabs the audience's attention. This must be a dramatic question, a shocking visual scenario, or a bold statement about the scale and potential world-changing consequences of the event. It should directly lead into the core 'Why' of the story, sparking curiosity about the historical context and the dramatic turns of the battle. The hook must promise a deep, cinematic dive into the conflict, emphasizing its 'epic' and 'war' elements as per 'HistoryWhy's signature style.",
    "2_word_allocation_to_5_part_narrative_structure": "You must allocate the total target words (${totalWords} words, ideally between 2000-4000 for a 15-30 minute video) into a 5-part narrative structure, strictly following 'HistoryWhy's content strategy and word distribution. Maintain the in-depth, cinematic, and historically accurate storytelling throughout:\\n- **Part 1: Giới Thiệu & Hook (Introduction & Hook):** ~8% of total words. Open with a gripping scene or a provocative question. Introduce the main battle/event, highlighting its immense scale, potential impact, and the central 'Why' the audience should care. This sets the dramatic stage.\\n- **Part 2: Bối Cảnh Lịch Sử (Historical Context):** ~22% of total words. Delve deep into the political, social, and economic factors leading to the conflict. Identify the key players, their motivations, and the overall geopolitical landscape. This section provides the essential foundation for understanding the dramatic stakes.\\n- **Part 3: Diễn Biến Trận Chiến/Sự Kiện Chính (Main Battle/Event Progression):** ~48% of total words. This is the core cinematic storytelling. Detail the phases of the conflict: troop preparations, initial strategies, major clashes, critical turning points, and unique tactical innovations (e.g., animated map descriptions). Emphasize moments of bravery, cunning, and the raw intensity of warfare, making it feel like a dramatic movie sequence.\\n- **Part 4: Hậu Quả & Ý Nghĩa Lịch Sử (Consequences & Historical Significance):** ~17% of total words. Analyze the immediate outcomes and long-term implications of the event. Discuss the impact on all involved parties, changes in power, territorial shifts, and the lasting lessons learned – militarily, politically, and culturally. Connect the event's significance to national identity or world history.\\n- **Part 5: Kết Luận & Kêu Gọi Hành Động (Conclusion & Call to Action):** ~5% of total words. Briefly summarize the enduring legacy of the historical event. Hint at future related content or similar 'epic' histories. End with a clear call to action: encourage viewers to subscribe for more cinematic history, like the video, comment with their thoughts, and share it to grow the 'HistoryWhy' community."
  },
  "output_outline_rules": {
    "1_part_length_constraint": "The final outline must be divided into multiple 'parts'. The estimated words (\`estimatedWords\`) for **EACH PART MUST NOT EXCEED 1000 WORDS**.",
    "2_narrative_structure_mapping": "You must map the 5-part narrative structure above to the output 'parts'. This means a large narrative section like 'Diễn Biến Trận Chiến/Sự Kiện Chính' (48%) **MUST** be split into multiple output parts if it exceeds 1000 words to ensure flow and manageability.",
    "3_clear_part_naming": "The title of each part must be clear, descriptive, cinematic, and inspiring, reflecting the 'epic', 'war', and 'in-depth' style of 'HistoryWhy'. The first part must have a title containing 'Giới Thiệu' or 'Introduction'. The last part must have a title containing 'Kết Luận' or 'Conclusion'.",
    "4_paragraph_calculation": "For each part you create, calculate \`estimatedParagraphs\` by taking \`estimatedWords\` and dividing by ${paragraphWordCountAvg}, rounding to the nearest integer.",
    "5_language_and_tone": "The entire outline (titles, descriptions) MUST be written in the **${language}** language. The style and expression must be natural, appropriate for the culture and language use of native speakers, maintaining a dramatic, authoritative, historically accurate, and inspiring tone suitable for an epic history channel."
  },
  "json_output_format_required": "- You MUST return a single JSON object.\\n- The JSON object must contain a 'title' key with the value '${documentaryTopic}'.\\n- It must also contain a 'parts' key, which is an array of part objects.\\n- Each object in the 'parts' array must have the following structure:\\n    - **part**: Sequential number starting from 1.\\n    - **title**: Descriptive title for the part (e.g., 'Giới Thiệu: Bí Mật Đằng Sau Cuộc Chinh Phục Một Triệu Quân Mông Cổ').\\n    - **description**: A brief summary of the content and the part's role in advancing the cinematic historical narrative, emphasizing dramatic stakes, in-depth analysis, and the 'epic' nature of the content.\\n    - **estimatedWords**: Estimated word count for this part (MUST be <= 1000).\\n    - **estimatedParagraphs**: Estimated paragraph count for this part."
}`;
    };

    const handleGenerateOutline = useCallback(async () => {
        if (!documentaryTopic) {
            updateToolState(toolId, { error: "Vui lòng chọn chủ đề từ Bước 1 hoặc nhập chủ đề video." });
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
        const content = getFullOutlineText();
        if (!content) return;
        updateToolState('history-script', { outlineText: content, language: language, readingSpeed: readingSpeed });
        alert("Đã sao chép dàn ý! Vui lòng chuyển sang công cụ '3. Tạo Kịch Bản Lịch Sử' để tiếp tục.");
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
                                <label htmlFor="teachingStyle" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Phong cách Giảng dạy</label>
                                <select id="teachingStyle" value={teachingStyle} onChange={e => updateToolState(toolId, { teachingStyle: e.target.value })} className={`w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md p-2 focus:ring-2 ${themeColors.ring} ${themeColors.focusBorder}`}>
                                    <option value="Nhà Sử Học Quân Sự (Phân tích sâu sắc chiến thuật và bối cảnh lịch sử)">Nhà Sử Học Quân Sự</option>
                                    <option value="Người Kể Chuyện Sử Thi (Diễn đạt hùng tráng, giàu cảm xúc theo phong cách điện ảnh)">Người Kể Chuyện Sử Thi</option>
                                    <option value="Chiến Lược Gia Tài Ba (Mổ xẻ các mưu lược và quyết định chiến lược then chốt)">Chiến Lược Gia Tài Ba</option>
                                    <option value="Nhà Phân Tích Địa Chính Trị Lịch Sử (Đặt các cuộc chiến vào bối cảnh quốc tế rộng lớn)">Nhà Phân Tích Địa Chính Trị</option>
                                    <option value="Chuyên Gia Văn Hóa & Xã Hội Cổ Đại (Khám phá bối cảnh xã hội và văn hóa đằng sau các sự kiện)">Chuyên Gia Văn Hóa & Xã Hội</option>
                                    <option value="Kỹ Sư Trận Địa (Giải thích cấu trúc phòng thủ, vũ khí và địa hình chiến trường)">Kỹ Sư Trận Địa</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={isLoading ? cancel : handleGenerateOutline} disabled={!documentaryTopic && !isLoading} className={`w-full flex justify-center items-center gap-2 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md ${isLoading ? 'bg-red-600 hover:bg-red-700' : `bg-gradient-to-br ${themeColors.buttonGradient} hover:opacity-90 disabled:from-zinc-500 disabled:to-zinc-400`}`}>
                            {isLoading ? <><Spinner /> Đang tạo...</> : 'Tạo dàn ý'}
                        </button>
                        {(error || apiError) && <p className="text-red-500 dark:text-red-400 text-sm mt-2 text-center">{error || apiError}</p>}
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

export default HistoryOutlineGenerator;