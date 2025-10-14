import React, { useState, useCallback, useEffect } from 'react';
import { Type } from '@google/genai';
import { AI_TOOLS, TOPIC_GENERATOR_MODEL, SUPPORTED_LANGUAGES, getLanguageName, getToolThemeColors } from '../../constants';
import { type HistoryTopicIdea, type LanguageCode } from '../../types';
import Spinner from '../ui/Spinner';
import { DownloadIcon, CopyIcon, CheckIcon } from '../ui/Icon';
import { useToolState } from '../../contexts/ToolStateContext';
import ToolLayout from './common/ToolLayout';
import Input from './common/Input';
import useGeminiApi from '../../hooks/useGeminiApi';
import { slugify } from '../../utils/slugify';

const HistoryTopicGenerator: React.FC = () => {
    const tool = AI_TOOLS.find(t => t.id === 'history-topic')!;
    const themeColors = getToolThemeColors(tool.category);
    const toolId = 'history-topic';
    const { getToolState, updateToolState } = useToolState();
    const state = getToolState(toolId);
    const {
        topicCount = 3,
        channelName = 'HistoryWhy',
        userTopic = 'Đại Việt 3 lần kháng chiến chống Mông Nguyên',
        language = 'VI',
        error = null,
        generatedTopics = [],
        selectedTopicIndex = null,
    } = state;

    const { isLoading, error: apiError, result, generate, clear, cancel } = useGeminiApi();
    
    useEffect(() => {
      if (apiError) updateToolState(toolId, { error: apiError });
    }, [apiError, updateToolState]);

    useEffect(() => {
        if (result) {
            try {
                const cleanResult = result.text.replace(/```json\n?|```/g, '');
                const parsed = JSON.parse(cleanResult) as HistoryTopicIdea[];
                if (parsed && Array.isArray(parsed)) {
                    updateToolState(toolId, { generatedTopics: parsed, selectedTopicIndex: null });
                } else {
                    throw new Error("Không thể phân tích chủ đề từ phản hồi của AI.");
                }
            } catch (e: any) {
                updateToolState(toolId, { error: e.message || "Lỗi phân tích phản hồi JSON." });
            }
        }
    }, [result, updateToolState, toolId]);

    const [isCopied, setIsCopied] = useState(false);

    const getPrompt = () => {
        return `ROLE: You are a world-class YouTube Title Generation Expert specializing in cinematic, epic historical, and military documentary content for the '${channelName}' channel. Your mission is to apply proven title formulas to create compelling, dramatic, and historically rich title ideas optimized for views, strictly adhering to the established 'HistoryWhy' content style and tone. 

OBJECTIVE: Generate exactly ${topicCount} unique YouTube title ideas in ENGLISH for historical and military documentary videos. For each idea, provide a full analysis in the required JSON format. 

CHANNEL STYLE ANALYSIS (STRICTLY ENFORCE):
- Core Keywords: Prioritize words and phrases like "Epic", "War Movie", "Historical Movie", "Sử Thi", "Hùng Tráng", "Vietnam", "Đại Việt", "Mongols", "Quân Nguyên", "CRUSHED" (Đánh bại tan tác), "DESTROYED" (Hủy diệt), "CONQUERED" (Chinh phục), "VS" (Đối đầu), "Battle", "Campaign", "Invasion", "Strategy", "Tactics", "Hero", "Empire", "Legend", "Rebellion", "Resistance", "Last Stand", "Ultimate Battle", "Unstoppable", "Unbelievable", "Defeat", "Victory", "Turning Point", "Decisive", "Ancient", "Medieval". Always use large numbers to convey scale and tension (e.g., '500,000 Mongols', '1 Million Army', '200,000 vs 500,000', '600 Warriors vs 50,000 Invaders').
- Delivery Style: Emphasize cinematic and majestic storytelling, in-depth analysis, dramatic and emotional narrative, and historically accurate presentation. Use phrases and structures like "HOW [Subject] CRUSHED...", "The EPIC Story Of...", "Unveiling the Strategy...", "The ULTIMATE Battle...", "A CINEMATIC HISTORICAL MOVIE", "Sử Thi Hùng Tráng", "Giải Mã Chiến Thuật". The tone must be grand, dramatic, authoritative, inspiring, and patriotic, fostering national pride and fascination with military genius.
- Hook Elements: Deeply tap into fascination with **grand scale and scope of historical conflicts**, **dramatic confrontations**, **stories of unbelievable odds and underdog victories**, **brilliant military strategies and tactics**, **heroic figures and their sacrifices**, **pivotal moments that altered history**, and **lasting historical impact**. Titles must appeal to patriotism, curiosity about lesser-known or underrated historical events, and admiration for courage in the face of overwhelming challenges.

USER-PROVIDED SUBJECT:
${userTopic}

3 TITLE FORMULAS (MANDATORY APPLICATION):
You must generate titles based on the following 3 formulas. Aim for a balanced number of titles from each formula to reach the total of ${topicCount}.

Formula 1: Direct Clash and Decisive Outcome (Công Thức "EPIC CRUSHED" - emphasis on direct confrontation and conclusive results)
• Structure: \`[EPIC WAR MOVIE/HISTORICAL DOCUMENTARY]: [Subject 1] + [Powerful Verb (CRUSHED/DESTROYED/CONQUERED/VS)] + [Subject 2] + [Scale/Numbers, e.g., '1 Million Troops'] + [Specific Detail (e.g., 'in YYYY', 'Part Z')]\`
• Purpose: Highlights a major conflict and its dramatic, conclusive result, emphasizing the 'EPIC' and 'WAR' aspects and the decisive nature of the outcome. Example: \`Epic Historical Movie: HOW Đại Việt CONQUERED The 1 Million Mongol Army - Part 3\`

Formula 2: Unbelievable Odds and Strategic Brilliance/Heroism (Công Thức "HOW Vietnam CRUSHED" - emphasis on underdog victories and ingenuity)
• Structure: \`[HOW/The EPIC Story Of/The Last Stand Of] + [Subject 1] + [Confronted/Defeated/Held Off] + [Vast Invaders/Overwhelming Forces, e.g., '500,000 Mongols'] + [Specific Event/Battle] + [A CINEMATIC HISTORICAL MOVIE]\`
• Purpose: Piques curiosity by highlighting an underdog scenario and implying strategic genius, brilliant tactics, or incredible heroism against impossible odds. Example: \`EPIC WAR Movie: The Last Stand of 700 Vietnamese Warriors Against 20,000 Invaders\`

Formula 3: Anticipation/Pivotal Moment/Series Continuation (Công Thức "TRAILER/Ultimate Battle" - emphasis on key events and multi-part narratives)
• Structure: \`[OFFICIAL TRAILER/ULTIMATE BATTLE/TURNING POINT]: [Subject 1]'s + [Specific Campaign/Battle] + [Against Subject 2] + [Scale/Numbers] + [Part Z (if applicable)]\`
• Purpose: Generates excitement for a key historical event, or positions the content as a must-watch 'trailer' or a clear indicator of a multi-part series, building a sense of grand narrative. Example: \`Official Trailer: VIETNAM'S ULTIMATE BATTLE vs 100,000 Invaders\`

Notes for all titles:
• Each title must be written in ENGLISH.
• Each title must maintain the cinematic, epic, dramatic, and historically accurate style outlined in the CHANNEL STYLE ANALYSIS.
• Each title should be 8–18 words long, using direct, powerful language to convey the scale, drama, and historical significance, avoiding ambiguity.
________________________________________
REQUIRED OUTPUT FORMAT:
You MUST return a JSON array of objects. For each of the ${topicCount} ideas, you must create an object with the following structure:
• proposedTitle: The English title, strictly following one of the 3 formulas above.
• proposedTitleVI: A Vietnamese translation of the title, with correct diacritics.
• trendAnalysis:
  o mainKeywords: An array of 2-4 main SEO keywords from the title, directly relevant to the historical topic.
  o attractionReason: A brief explanation in ENGLISH of why this title is compelling to viewers, focusing on historical drama, scale, and curiosity.
  o attractionReasonVI: The same explanation, translated into VIETNAMESE, emphasizing historical drama, scale, and curiosity.
• effectivenessAnalysis: Interpretation of these keys in the context of a historical war documentary:
  o asymmetry: What historical misconception, overwhelming odds, or surprising strategic advantage challenges the perceived power balance of the conflict, captivating viewers with an unexpected truth or twist?
  o strategicWit: What ingenious military tactics, brilliant leadership decisions, or strategic insights led to an unexpected victory or decisive turning point, showcasing exceptional ingenuity and historical significance?
  o spiritAndHeroism: What acts of extraordinary courage, resilience in the face of immense suffering, or unwavering national spirit define the heroism of the historical figures and people involved, resonating with a sense of pride and inspiration?
  o survival: What profound long-term impact did the battle or campaign have on the fate of the nation, its people, or the broader historical landscape, and what enduring legacy does it leave for future generations?`;
    };

    const handleGenerateTopics = useCallback(async () => {
        updateToolState(toolId, { error: null, generatedTopics: [], selectedTopicIndex: null });
        clear();

        const prompt = getPrompt();
        const jsonSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    proposedTitle: { type: Type.STRING },
                    proposedTitleVI: { type: Type.STRING },
                    trendAnalysis: {
                        type: Type.OBJECT,
                        properties: {
                            mainKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                            attractionReason: { type: Type.STRING },
                            attractionReasonVI: { type: Type.STRING },
                        },
                        required: ["mainKeywords", "attractionReason", "attractionReasonVI"]
                    },
                    effectivenessAnalysis: {
                        type: Type.OBJECT,
                        properties: {
                            asymmetry: { type: Type.STRING },
                            strategicWit: { type: Type.STRING },
                            spiritAndHeroism: { type: Type.STRING },
                            survival: { type: Type.STRING },
                        },
                         required: ["asymmetry", "strategicWit", "spiritAndHeroism", "survival"]
                    },
                },
                 required: ["proposedTitle", "proposedTitleVI", "trendAnalysis", "effectivenessAnalysis"]
            }
        };

        generate({ model: TOPIC_GENERATOR_MODEL, contents: prompt, config: { responseMimeType: "application/json", responseSchema: jsonSchema }});
    }, [topicCount, channelName, userTopic, generate, updateToolState, clear]);
    
    const handleDownloadTopics = () => {
        let content = '';
        generatedTopics.forEach((topic: HistoryTopicIdea, index: number) => {
            content += `Title (EN): ${topic.proposedTitle}\nTitle (VI): ${topic.proposedTitleVI}\n\n`;
            content += `Reason (EN): ${topic.trendAnalysis.attractionReason}\nReason (VI): ${topic.trendAnalysis.attractionReasonVI}\n\n`;
            content += `Keywords: ${topic.trendAnalysis.mainKeywords.join(', ')}\n`;
            content += `Asymmetry: ${topic.effectivenessAnalysis.asymmetry}\n`;
            content += `Strategic Wit: ${topic.effectivenessAnalysis.strategicWit}\n`;
            content += `Spirit and Heroism: ${topic.effectivenessAnalysis.spiritAndHeroism}\n`;
            content += `Survival: ${topic.effectivenessAnalysis.survival}\n`;
            if (index < generatedTopics.length - 1) {
                content += `\n========================================\n\n`;
            }
        });
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated_topics.txt';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleContinueToOutline = (index: number) => {
        updateToolState(toolId, { selectedTopicIndex: index });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        alert("Đã chọn chủ đề! Vui lòng chuyển sang công cụ '2. Tạo Dàn Ý Lịch Sử' để tiếp tục.");
    };

    return (
        <ToolLayout tool={tool} language={'vi'} setLanguage={(lang) => {}} getPrompt={getPrompt}>
            <div className="flex flex-col gap-8">
                <div>
                    <h2 className={`text-2xl font-bold ${themeColors.text} mb-4`}>Cài đặt chủ đề</h2>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Input label="Số lượng" type="number" id="topicCount" value={topicCount} onChange={e => updateToolState(toolId, { topicCount: Math.max(1, Number(e.target.value)) })} ringColorClass={themeColors.ring} />
                            <div>
                                <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngôn ngữ kịch bản</label>
                                <select id="language" value={language} onChange={e => updateToolState(toolId, { language: e.target.value })} className={`w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 ${themeColors.ring} ${themeColors.focusBorder}`}>
                                    {SUPPORTED_LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                                </select>
                            </div>
                            <Input label="Tên kênh (Tùy chọn)" type="text" id="channelName" value={channelName} onChange={e => updateToolState(toolId, { channelName: e.target.value })} placeholder="VD: HistoryWhy" ringColorClass={themeColors.ring} />
                            <div className="md:col-span-2 lg:col-span-3">
                                <Input label="Chủ đề của bạn" type="text" id="userTopic" value={userTopic} onChange={e => updateToolState(toolId, { userTopic: e.target.value })} placeholder="VD: Vua Quang Trung" ringColorClass={themeColors.ring} />
                            </div>
                        </div>
                        <button onClick={isLoading ? cancel : handleGenerateTopics} disabled={!userTopic && !isLoading} className={`mt-4 w-full flex justify-center items-center gap-2 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md ${isLoading ? 'bg-red-600 hover:bg-red-700' : `bg-gradient-to-br ${themeColors.buttonGradient} hover:opacity-90`}`}>
                            {isLoading ? <><Spinner /> Đang tạo...</> : 'Tạo Chủ Đề'}
                        </button>
                        {(error || apiError) && <p className="text-red-500 dark:text-red-400 text-sm mt-2 text-center">{error || apiError}</p>}
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <h2 className={`text-2xl font-bold ${themeColors.text}`}>Chủ đề đã tạo</h2>
                        {generatedTopics.length > 0 && <button onClick={handleDownloadTopics} className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-bold py-2 px-4 rounded-md transition duration-300 text-sm"><DownloadIcon /> Tải xuống (.txt)</button>}
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 h-[40rem] overflow-y-auto shadow-lg">
                        {!isLoading && generatedTopics.length === 0 && <p className="text-zinc-500 dark:text-zinc-400 text-center italic mt-16">Chủ đề được tạo sẽ xuất hiện ở đây...</p>}
                        <div className="space-y-4">
                            {generatedTopics.map((topic: HistoryTopicIdea, index: number) => (
                                <div key={index} onClick={() => updateToolState(toolId, { selectedTopicIndex: index })} className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${selectedTopicIndex === index ? `${themeColors.selectedBg} ${themeColors.border}` : `bg-white dark:bg-zinc-900/50 border-transparent ${themeColors.hoverBorder}`}`}>
                                    <h3 className={`text-lg font-bold ${themeColors.text}`}>{topic.proposedTitle}</h3>
                                    <h4 className="text-md font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{topic.proposedTitleVI}</h4>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">{topic.trendAnalysis.attractionReasonVI}</p>
                                    {selectedTopicIndex === index && (
                                        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                                            <button onClick={(e) => { e.stopPropagation(); handleContinueToOutline(index); }} className={`self-start flex items-center gap-2 ${themeColors.buttonSolid} text-white font-bold py-2 px-4 rounded-md transition duration-300 text-sm animate-fade-in`}>
                                                {isCopied ? <CheckIcon /> : <CopyIcon />} {isCopied ? 'Đã sử dụng!' : 'Sử dụng & Tiếp tục'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
};

export default HistoryTopicGenerator;