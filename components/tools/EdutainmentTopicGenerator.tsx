import React, { useState, useCallback, useEffect } from 'react';
import { Type } from '@google/genai';
import { AI_TOOLS, TOPIC_GENERATOR_MODEL, SUPPORTED_LANGUAGES, getToolThemeColors } from '../../constants';
import { type TopicIdea, type LanguageCode } from '../../types';
import Spinner from '../ui/Spinner';
import { DownloadIcon, CopyIcon, CheckIcon } from '../ui/Icon';
import { useToolState } from '../../contexts/ToolStateContext';
import ToolLayout from './common/ToolLayout';
import Input from './common/Input';
import useGeminiApi from '../../hooks/useGeminiApi';
import { slugify } from '../../utils/slugify';

const EdutainmentTopicGenerator: React.FC = () => {
    const tool = AI_TOOLS.find(t => t.id === 'edutainment-topic')!;
    const themeColors = getToolThemeColors(tool.category);
    const toolId = 'edutainment-topic';
    const { getToolState, updateToolState } = useToolState();
    const state = getToolState(toolId);
    const {
        topicCount = 3,
        channelName = 'Curious Minds',
        userTopic = 'Quantum Computing',
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
                const parsed = JSON.parse(cleanResult) as TopicIdea[];
                if (parsed && Array.isArray(parsed)) {
                    updateToolState(toolId, { generatedTopics: parsed, selectedTopicIndex: null });
                } else {
                    throw new Error("Không thể phân tích chủ đề từ phản hồi của AI.");
                }
            } catch (e: any) {
                updateToolState(toolId, { error: e.message || "Lỗi phân tích phản hồi JSON." });
            }
        }
    }, [result, updateToolState]);

    const [isCopied, setIsCopied] = useState(false);

    const getPrompt = () => {
      return `ROLE: You are a Creative Strategist for a wildly popular Edutainment channel known for its witty, charming, and simple explanations of complex topics. Your mission is to generate ${topicCount} irresistible topic ideas about "${userTopic}" for the channel '${channelName}'.

OBJECTIVE: Generate exactly ${topicCount} unique YouTube topic ideas in ENGLISH. For each idea, provide a full analysis in the required JSON format.

CHANNEL STYLE ANALYSIS (STRICTLY ENFORCE):
- Core Keywords: Prioritize words and phrases like "Science", "Technology", "Explained", "How it Works", "What If", "Future", "Universe", "Human Body", "Mind-Blowing". Use intriguing questions, bold statements, and a touch of humor.
- Delivery Style: Emphasize clear, accessible, and **hilarious** explanations of complex subjects, using clever analogies and strong visual storytelling. The tone must be curious, enthusiastic, witty, and inspiring, sparking a desire for learning.
- Hook Elements: Tap into fundamental human curiosity with **big, absurd questions (What If?)**, **the secret workings of everyday things**, and **surprising scientific truths that feel like magic**.

USER-PROVIDED SUBJECT:
${userTopic}

3 TITLE FORMULAS (MANDATORY APPLICATION):
Apply the following formulas, ensuring a witty and playful tone.

Formula 1: The "Big, Fun Question / What If" Formula (sparks imagination and laughter)
• Structure: \`[What If / What Would Happen If] + [Extraordinary or Absurd Scenario] + [Intriguing Consequence]\`
• Purpose: Hooks the viewer with a grand, often funny, hypothetical scenario. Example: \`What If You Sneezed at the Speed of Light?\`

Formula 2: The "Explained with a Twist" Formula (demystifies complexity)
• Structure: \`[The Surprising Science Of / How] + [Complex or Everyday Subject] + [Actually Works / Is About to Change Everything]\`
• Purpose: Piques curiosity by promising to reveal hidden mechanics, making the viewer feel smart and entertained. Example: \`How Your Brain Tricks You Into Thinking You're Great, Explained\`

Formula 3: The "Myth vs. Hilarious Reality" Formula (challenges assumptions)
• Structure: \`[Myth vs. Fact / X vs. Y]: [Common Belief or Two Competing Concepts] + [The Shocking (and Funny) Truth]\`
• Purpose: Creates intrigue by challenging a common misconception, promising a clear and surprising answer. Example: \`Sleep vs. Coffee: The Ultimate Brain Fuel Showdown\`

________________________________________
REQUIRED OUTPUT FORMAT:
You MUST return a JSON array of objects. For each of the ${topicCount} ideas, you must create an object with the following structure:
• proposedTitle: The English title.
• proposedTitleVI: A witty Vietnamese translation of the title.
• trendAnalysis:
  o mainKeywords: An array of 2-4 main SEO keywords.
  o attractionReason: A brief explanation in ENGLISH of why this title is compelling, focusing on curiosity, humor, and learning.
  o attractionReasonVI: The same explanation, translated into VIETNAMESE.
• effectivenessAnalysis:
  o curiosityHook: Why does this title make people click? What mystery or funny paradox does it promise to answer?
  o learningValue: What key concept will the viewer gain in a simple, satisfying way?
  o visualPotential: What **charming animations featuring Professor Stickman** or witty infographics could be used?
  o simplificationPower: How does this title promise to simplify a complex topic in a **fun, non-intimidating way**, making the viewer feel both smart and entertained?`;
    }

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
                            curiosityHook: { type: Type.STRING },
                            learningValue: { type: Type.STRING },
                            visualPotential: { type: Type.STRING },
                            simplificationPower: { type: Type.STRING },
                        },
                         required: ["curiosityHook", "learningValue", "visualPotential", "simplificationPower"]
                    },
                },
                 required: ["proposedTitle", "proposedTitleVI", "trendAnalysis", "effectivenessAnalysis"]
            }
        };

        generate({ model: TOPIC_GENERATOR_MODEL, contents: prompt, config: { responseMimeType: "application/json", responseSchema: jsonSchema }});

    }, [topicCount, language, channelName, userTopic, generate, updateToolState, clear]);
    
    const handleDownloadTopics = () => {
        let content = '';
        generatedTopics.forEach((topic: TopicIdea, index: number) => {
            content += `Title (EN): ${topic.proposedTitle}\nTitle (VI): ${topic.proposedTitleVI}\n\n`;
            content += `Reason (EN): ${topic.trendAnalysis.attractionReason}\nReason (VI): ${topic.trendAnalysis.attractionReasonVI}\n\n`;
            content += `Keywords: ${topic.trendAnalysis.mainKeywords.join(', ')}\n`;
            content += `Curiosity Hook: ${topic.effectivenessAnalysis.curiosityHook}\n`;
            content += `Learning Value: ${topic.effectivenessAnalysis.learningValue}\n`;
            content += `Visual Potential: ${topic.effectivenessAnalysis.visualPotential}\n`;
            content += `Simplification Power: ${topic.effectivenessAnalysis.simplificationPower}\n`;
            if (index < generatedTopics.length - 1) {
                content += `\n========================================\n\n`;
            }
        });
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated_topics.txt`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleContinueToOutline = (index: number) => {
        updateToolState(toolId, { selectedTopicIndex: index });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        alert("Đã chọn chủ đề! Vui lòng chuyển sang công cụ '2. Tạo Dàn Ý Edutainment' để tiếp tục.");
    };

    return (
        <ToolLayout tool={tool} language={'vi'} setLanguage={(lang) => {}} getPrompt={getPrompt}>
            <div className="flex flex-col gap-8">
                <div>
                    <h2 className={`text-2xl font-bold ${themeColors.text} mb-4`}>Cài đặt chủ đề</h2>
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Input label="Số lượng" type="number" id="topicCount" value={topicCount} onChange={e => updateToolState(toolId, { topicCount: Math.max(1, Number(e.target.value)) })} ringColorClass={themeColors.ring} />
                            <Input label="Tên kênh (Tùy chọn)" type="text" id="channelName" value={channelName} onChange={e => updateToolState(toolId, { channelName: e.target.value })} placeholder="VD: Curious Minds" ringColorClass={themeColors.ring} />
                            <div className="md:col-span-2 lg:col-span-1">
                                 <Input label="Chủ đề của bạn" type="text" id="userTopic" value={userTopic} onChange={e => updateToolState(toolId, { userTopic: e.target.value })} placeholder="VD: Quantum Computing" ringColorClass={themeColors.ring} />
                            </div>
                        </div>
                        <button onClick={isLoading ? cancel : handleGenerateTopics} disabled={isLoading && !userTopic} className={`mt-4 w-full flex justify-center items-center gap-2 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md ${isLoading ? 'bg-red-600 hover:bg-red-700' : `bg-gradient-to-br ${themeColors.buttonGradient} hover:opacity-90`}`}>
                           {isLoading ? <><Spinner /> Đang tạo...</> : 'Tạo Chủ Đề'}
                        </button>
                        {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2 text-center">{error}</p>}
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
                            {generatedTopics.map((topic: TopicIdea, index: number) => (
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

export default EdutainmentTopicGenerator;