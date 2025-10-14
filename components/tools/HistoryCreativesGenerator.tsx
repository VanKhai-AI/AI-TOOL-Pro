import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { Type } from "@google/genai";
import { useToolState } from '../../contexts/ToolStateContext';
import { AI_TOOLS, SCRIPT_GENERATOR_MODEL, getToolThemeColors } from '../../constants';
import Spinner from '../ui/Spinner';
import { SparklesIcon, CopyIcon, CheckIcon, DownloadIcon } from '../ui/Icon';
import { SeoPackage, ThumbnailConcept, SeoTagCategories } from '../../types';
import ToolLayout from './common/ToolLayout';
import Input from './common/Input';
import useGeminiApi from '../../hooks/useGeminiApi';

const DisplayField: React.FC<{ label: string; value: string | SeoTagCategories; }> = ({ label, value }) => {
    const [isCopied, setIsCopied] = useState(false);

    const formatValue = () => {
        if (typeof value === 'string') return value;
        return Object.entries(value)
            .map(([category, tags]) => `[${category}]:\n${tags}`)
            .join('\n\n');
    };
    
    const textToCopy = formatValue();

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (!value) return null;

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300">{label}</h4>
                <button onClick={handleCopy} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs flex items-center gap-1">
                    {isCopied ? <CheckIcon /> : <CopyIcon />} {isCopied ? 'Đã sao chép' : 'Sao chép'}
                </button>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-900/50 p-3 rounded-md text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-sans">
                {textToCopy}
            </div>
        </div>
    );
};

const HistoryCreativesGenerator: React.FC = () => {
    const tool = AI_TOOLS.find(t => t.id === 'history-creative')!;
    const themeColors = getToolThemeColors(tool.category);
    const toolId = 'history-creative';
    const { getToolState, updateToolState } = useToolState();
    
    const scriptState = getToolState('history-script');
    const { scriptText = '', outlineText = '' } = scriptState;

    const state = getToolState(toolId);
    const {
        channelName = 'HistoryWhy',
        nextVideo = 'Video liên quan',
        playlist = 'Danh sách phát lịch sử',
        disclaimer = 'Historical Analysis',
        language = 'VI',
        generatedThumbnails = [],
        generatedSeo = null,
    } = state;
    
    const { generate } = useGeminiApi();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mainTitle = useMemo(() => outlineText.match(/Tiêu đề chính:\s*(.*)/i)?.[1].trim() || 'Video Lịch sử', [outlineText]);
    
    const generateThumbnails = async () => {
        const prompt = `{
    "personalization_instructions": "You are a top-tier YouTube Thumbnail Design Expert, specializing in crafting hyper-realistic, cinematic, and intensely dramatic thumbnails for the 'Epic Historical War' niche. Your mission is to create 3 detailed and distinct thumbnail concepts, with all descriptive text written in ENGLISH.\\n\\nINPUTS:\\n- [Main Story or Topic]: ${mainTitle}\\n- [Script Summary]: ${scriptText.substring(0, 2000)}...\\n\\nCRITICAL LANGUAGE INSTRUCTION: The input script or title may be in another language (e.g., Vietnamese). You MUST IGNORE the input language and generate ALL output text fields ('name', 'textOverlay', 'description', 'finalPrompt') exclusively in ENGLISH.\\n\\nGOLDEN RULES & FORMULAS (MANDATORY):\\n- **Niche Focus**: The thumbnail MUST capture the 'Epic War' and 'Historical Reenactment' essence, often focusing on grand conflicts, especially those involving Vietnamese history, emphasizing scale, heroism, and the brutality of warfare.\\n- **Layout & Composition**: Focus on a single, powerful central dramatic moment of conflict (e.g., a fierce clash of ancient armies, a heroic general leading troops into battle, or a decisive confrontation between two historical forces). Prioritize one or two main elements that dominate most of the frame to create an overwhelming visual impact. Employ the rule of thirds for balanced and naturally attractive compositions.\\n- **Background & Ambiance**: The background MUST depict a fierce, chaotic battlefield, a besieged ancient city, a river scene with war fleets (e.g., stake-boats), or a majestic historical landscape (mountains, dense forests) that clearly establishes the scale and context of the conflict. Use somber, dramatic, and powerful colors, or strong contrasting elements like fire, blood, smoke, and explosions to evoke a tragic, heroic, and intense atmosphere. High contrast lighting is absolutely essential for dramatic effect.\\n- **Text Overlay (CRITICAL)**: The text overlay MUST be short, incredibly powerful, and immediately attention-grabbing. It should prominently feature impressive numerical figures (e.g., '500,000 Mongols', '200,000 VS 50,000') or strong, shocking, and impactful keywords (e.g., 'CRUSHED', 'EPIC', 'DESTROYED', 'CONQUERED', 'DEFEATED', 'MASSACRE').\\n    -   **Font & Color**: Use a large, clear, bold, and highly legible font. The text color MUST have extremely high contrast with the background, typically bright white or striking yellow on a dark, dramatic scene.\\n    -   **Placement**: Strategically place the text in positions that do not obscure critical image details, commonly in the top or bottom corners to avoid YouTube interface elements and maximize visibility.\\n- **Color Contrast & Symbolism**: Employ strong contrast between light and dark elements, or between complementary colors to make key elements pop and create dynamic visual tension. Utilize symbolic colors such as vivid red (for blood, fire, war, intense conflict), regal yellow/orange (for royalty, light, critical moments, heroism), and deep blue/grey (for skies, water, somber tones) to amplify the historical and emotional message.\\n- **Expression & Emotion**: If characters (e.g., warriors, generals) are present, their expressions MUST convey intense, authentic emotions such as fierce determination, righteous anger, primal fear, or triumphant victory. Alternatively, the dynamic movement, direction, and chaos within the scene itself should powerfully evoke these strong emotions, stimulating a visceral response from the viewer.\\n- **Overall Style**: ABSOLUTELY NO ANIMATION, CARTOON STYLES, OR OVERLY BRIGHT/CHEERFUL PALETTES. The thumbnail must be hyper-realistic, cinematic, historically accurate, visually stunning, and convey a high degree of raw drama, intensity, and epic grandeur.\\n\\nOUTPUT REQUIREMENT (JSON MANDATORY):\\nYou MUST return a JSON array of exactly 3 objects. Each object must have the following structure, and all text values MUST BE IN ENGLISH.\\n\\n1.  **name**: A suggestive name for the concept in ENGLISH (e.g., \\"The Bach Dang River Ambush\\").\\n2.  **textOverlay**: A single string for the text overlay, clearly communicating the core message. Example: \\"HOW VIETNAM CRUSHED 500,000 MONGOLS\\".\\n3.  **description**: A multi-line string in ENGLISH, formatted with newlines (\\\\n), detailing these 5 points:\\n    -   **Character & Expression**: Detailed description of any main characters (e.g., a heroic Vietnamese general) and their intense, historically accurate expression (e.g., fierce determination, battle-hardened resolve leading his troops).\\n    -   **Action & Layout**: Describe the central action or conflict and how the layout is arranged according to cinematic rules, emphasizing a clear focal point and the immense scale of the confrontation (e.g., Vietnamese forces ambushing a massive enemy fleet, dynamic action, main general centrally placed).\\n    -   **Background & Color**: Describe the historically evocative background (e.g., a smoke-filled battlefield at dusk, burning ships on a river estuary, majestic mountains overlooking the conflict) and the dominant, dramatic color palette (e.g., dark, high-contrast, with reds, oranges, and deep blues creating a somber yet epic mood).\\n    -   **Text**: Specify the text overlay's exact content, font styles, colors, and precise placement. Explicitly state its prominence and contrast (e.g., 'Text \\"VIETNAM CRUSHED 500,000 MONGOLS\\" is large, bold, and in a striking yellow, positioned at the top-left for maximum visibility against a dark background. The font is strong and historically themed.').\\n    -   **Overall Style**: Summarize the overall emotional impact (e.g., epic, intense, historically authentic, dramatic, awe-inspiring), ensuring it aligns with the hyper-realistic cinematic style of ${channelName}.\\n4.  **finalPrompt**: A single, seamless, and comprehensive **ENGLISH** prompt for an AI image generator. This prompt MUST include a detailed description of the text overlay, including its specific content, font style, color, and precise placement within the image. Example: 'An epic cinematic wide shot of ancient Vietnamese warriors (Dai Viet) in traditional armor clashing with a vast invading Mongol cavalry on a muddy battlefield, dramatic overcast sky, rain, detailed historical accuracy, intense action, high contrast lighting, digital painting, 4K resolution, historical reenactment style. Text overlay reads \\"HOW VIETNAM CRUSHED 500,000 MONGOLS\\" in a very large, bold, striking yellow font, placed prominently at the top-left corner of the image, ensuring it stands out against the dark, dramatic background. The text is clear and highly legible. The image should be hyper-realistic cinematic, epic, historically accurate, high-quality historical reenactment, wide-angle shots, dramatic camera angles, high-contrast lighting, dark and powerful colors, intense and artistic battle scenes, chaos, blood and fire, courage, ultra high detail, 4K, sharp focus.'"
}`;
        const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, textOverlay: { type: Type.STRING }, description: { type: Type.STRING }, finalPrompt: { type: Type.STRING } }, required: ["name", "textOverlay", "description", "finalPrompt"] }};
        const response = await generate({ model: SCRIPT_GENERATOR_MODEL, contents: prompt, config: { responseMimeType: 'application/json', responseSchema: schema }});
        if (response?.text) return JSON.parse(response.text.replace(/```json\n?|```/g, ''));
        return null;
    };
    
    const generateSeo = async () => {
         const prompt = `ROLE:
You are a world-class YouTube SEO expert specializing in epic historical and military documentary content, particularly for channels focused on Vietnamese history and grand resistance wars. Your mission is to generate a comprehensive, highly-optimized SEO package tailored to maximize discoverability and engagement for the '${channelName}' channel, which is renowned for its cinematic, in-depth, and emotionally stirring historical narratives.

INPUT INFORMATION:
- **Target Language:** ${language}
- **Main Topic:** ${mainTitle}
- **Channel Name:** ${channelName}
- **Next Video Suggestion:** ${nextVideo}
- **Playlist:** ${playlist}
- **Content Strategy / Script Context:** ${scriptText.substring(0, 2000)}...

SEO RULES AND STRUCTURE (STRICTLY ENFORCE):
1.  **Analyze Content Theme:** The primary theme for '${channelName}' is **Epic Historical and Military Analysis**, focusing on grand narratives, resistance wars, and strategic military events, especially from Vietnamese history. The content style is cinematic, dramatic, and historically accurate, delving deep into contexts, strategies, and consequences.

2.  **Generate Thematic Disclaimer:** For content related to "${disclaimer}," the disclaimer MUST state that the content is for educational purposes, based on available historical research and interpretation, and may involve strategic analysis or speculation based on information. It explicitly does not constitute official historical advice or endorsement of specific political/military views. It emphasizes that while accuracy is strived for, historical interpretations can vary.

3.  **Title (titleOptions):** Generate 3 highly compelling and dramatic title options. Each title MUST adhere to the channel's signature "EPIC CRUSHED" formula. Titles should be designed to evoke drama, scale, and curiosity. They MUST incorporate:
    *   A strong genre indicator (e.g., "Epic Historical Movie", "EPIC WAR Documentary", "Trailer sử thi", "Sử Thi Lịch Sử").
    *   An action-oriented result or method (e.g., "HOW", "CONQUERED", "CRUSHED", "DESTROYED", "VIETNAM'S ULTIMATE BATTLE", "Sự Hủy Diệt").
    *   Clear primary and secondary subjects (e.g., "Đại Việt", "Vietnam", "Mongol Army", "Invaders", "Quân Nguyên").
    *   Powerful, dramatic verbs (e.g., "CRUSHED" - Đánh bại tan tác, "DESTROYED" - Hủy diệt, "CONQUERED" - Chinh phục, "VS" - Đối đầu).
    *   Emphasis on large numbers and scale to highlight the vastness of the conflict (e.g., "1 Million Mongol Army", "500,000 Invaders", "700 Warriors vs 20,000").
    *   Specific contextual details or series parts (e.g., "Part 1", "in 1288", "Trận Bạch Đằng").
    *   The tone must be heroic, dramatic, and convey massive scale and impact.

4.  **Description (description):** Compose a detailed description around 150-200 words, structured into 4 paragraphs, infused with SEO keywords and the channel's epic, in-depth tone.
    *   **Paragraph 1 (Hook):** Start with a dramatic question or a powerful statement, immediately introducing the video's epic historical/military topic and its profound significance. Incorporate primary keywords such as 'Lịch sử Việt Nam', 'Chiến tranh', 'Sử thi', 'Anh hùng dân tộc'.
    *   **Paragraph 2 (Content Introduction):** Briefly summarize what the video covers, highlighting the cinematic storytelling style, detailed analysis of the historical context, military tactics, strategic maneuvers, and key figures involved. Use keywords like 'kháng chiến', 'chiến thuật quân sự', 'bản đồ hoạt hình', 'tái hiện lịch sử'.
    *   **Paragraph 3 (What Viewers Will Learn/Experience):** Elaborate on the depth of information provided, the commitment to historical accuracy, and the emotional impact of the narrative. Emphasize learning about 'ý nghĩa lịch sử', 'bài học quân sự', 'chân dung anh hùng', and the heroism displayed.
    *   **Paragraph 4 (Strong CTA & Disclaimer):** Conclude with a powerful call to action: "👍 Đừng quên THÍCH, ĐĂNG KÝ kênh ${channelName} để không bỏ lỡ những thước phim sử thi hùng tráng và nội dung lịch sử chuyên sâu. Video tiếp theo gợi ý: ${nextVideo}... Khám phá thêm trong playlist: ${playlist}... \\n\\nDisclaimer:\\n[Your generated thematic disclaimer text here]".

5.  **Hashtags (hashtags):** Provide **exactly 3** highly relevant and impactful hashtags. Include \`#${channelName}\`, one general epic history hashtag (e.g., \`#LịchSửViệtNam\`, \`#EpicHistory\`, \`#LịchSửHùngTráng\`), and one specific historical event/period hashtag directly related to the \`${mainTitle}\` (e.g., \`#ChiếnTranhMôngNguyên\`, \`#TrậnBạchĐằng\`, \`#AncientWarfare\`).

6.  **Tags (tags):** Generate a JSON object with 5 distinct categories of tags, each containing up to 7 tags. Tags should cover a comprehensive range of broad, specific, and long-tail keywords relevant to epic historical military documentaries, Vietnamese history, specific events, and key figures, as identified in the battle plan.
    *   \`"Chủ đề chính"\`: Main subjects (e.g., 'lịch sử Việt Nam', 'chiến tranh', 'sử thi', 'quân sự', 'phim tài liệu').
    *   \`"Sự kiện & Thời kỳ"\`: Specific events and historical eras (e.g., 'kháng chiến Mông Nguyên', 'trận Bạch Đằng', 'thời Trần', 'thời kỳ cổ đại').
    *   \`"Nhân vật & Lãnh đạo"\`: Key historical figures (e.g., 'Trần Hưng Đạo', 'vua', 'tướng lĩnh', 'Kublai Khan').
    *   \`"Phong cách & Thể loại"\`: Content style/genre (e.g., 'điện ảnh sử thi', 'tái hiện lịch sử', 'phân tích quân sự', 'documentary chiến tranh').
    *   \`"Tìm kiếm nâng cao"\`: Long-tail and niche search terms (e.g., 'Việt Nam đánh bại Mông Cổ', 'chiến thuật cổ đại', 'bài học lịch sử', 'những trận đánh vĩ đại').

7.  **Localization:** All generated text MUST be in the **${language}** language.

OUTPUT REQUIREMENT (JSON MANDATORY):
You MUST return a single JSON object. All text content MUST be in the target language, **${language}**.

1.  **titleOptions**: An array of **exactly 3** title options.
2.  **description**: A single string with 4 paragraphs, separated by \\n\\n.
3.  **hashtags**: A single string of **exactly 3** hashtags.
4.  **tags**: A JSON object with 5 keys (e.g., \`"Chủ đề chính"\`, \`"Sự kiện & Thời kỳ"\`, etc.), each a string of up to 7 tags.
5.  **checklist**: An array of 3 actionable suggestions for the creator. These suggestions should be specific to improving the video's presentation for the channel's cinematic and historically accurate style. Examples include: "Ensure the visual representation of battle maps is dynamic and clearly illustrates troop movements and strategic points.", "Review script for dramatic pacing, focusing on 'heroic moments' and 'turning points' as per cinematic style.", "Confirm all historical facts and figures are cross-referenced with at least two credible sources to maintain channel's integrity."`;
        const schema = { type: Type.OBJECT, properties: { titleOptions: { type: Type.ARRAY, items: { type: Type.STRING } }, description: { type: Type.STRING }, hashtags: { type: Type.STRING }, tags: { type: Type.OBJECT, properties: { "Chủ đề chính": { type: Type.STRING }, "Sự kiện & Thời kỳ": { type: Type.STRING }, "Nhân vật & Lãnh đạo": { type: Type.STRING }, "Phong cách & Thể loại": { type: Type.STRING }, "Tìm kiếm nâng cao": { type: Type.STRING } } }, checklist: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["titleOptions", "description", "hashtags", "tags", "checklist"] };
        const response = await generate({ model: SCRIPT_GENERATOR_MODEL, contents: prompt, config: { responseMimeType: 'application/json', responseSchema: schema }});
        if (response?.text) return JSON.parse(response.text.replace(/```json\n?|```/g, ''));
        return null;
    };

    const handleGenerateAll = useCallback(async () => {
        if (!scriptText) {
            setError("Vui lòng cung cấp kịch bản từ các bước trước.");
            return;
        }
        setIsLoading(true);
        setError(null);
        updateToolState(toolId, { generatedThumbnails: [], generatedSeo: null });

        try {
            const [thumbResult, seoResult] = await Promise.all([
                generateThumbnails(),
                generateSeo()
            ]);
            
            if (thumbResult) updateToolState(toolId, { generatedThumbnails: thumbResult });
            if (seoResult) {
                 const processedSeo: SeoPackage = {
                    titleOptions: seoResult.titleOptions.join('\n'),
                    description: seoResult.description,
                    hashtags: seoResult.hashtags,
                    tags: seoResult.tags, // Keep as object
                    checklist: seoResult.checklist.map((item:string) => `- ${item}`).join('\n')
                };
                updateToolState(toolId, { generatedSeo: processedSeo });
            }
             if (!thumbResult && !seoResult) {
                throw new Error("Cả hai quá trình tạo đều thất bại.");
            }

        } catch(e: any) {
            setError(e.message || "Đã xảy ra lỗi trong quá trình tạo.");
        } finally {
            setIsLoading(false);
        }
    }, [scriptText, mainTitle, channelName, nextVideo, playlist, disclaimer, language, generate]);

    return (
        <ToolLayout tool={tool} language={'vi'} setLanguage={() => {}} getPrompt={() => ""}>
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Tên kênh" id="channelName" value={channelName} onChange={e => updateToolState(toolId, { channelName: e.target.value })} ringColorClass={themeColors.ring} />
                    <Input label="Video giới thiệu tiếp theo" id="nextVideo" value={nextVideo} onChange={e => updateToolState(toolId, { nextVideo: e.target.value })} ringColorClass={themeColors.ring} />
                    <Input label="Playlist" id="playlist" value={playlist} onChange={e => updateToolState(toolId, { playlist: e.target.value })} ringColorClass={themeColors.ring} />
                    <div>
                        <label htmlFor="disclaimer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Disclaimer</label>
                        <select id="disclaimer" value={disclaimer} onChange={e => updateToolState(toolId, { disclaimer: e.target.value })} className={`w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 ${themeColors.ring} ${themeColors.focusBorder}`}>
                            <option value="Historical Analysis">Historical Analysis</option>
                            <option value="Military & Political Analysis">Military & Political Analysis</option>
                        </select>
                    </div>
                </div>

                <button onClick={handleGenerateAll} disabled={isLoading || !scriptText} className={`w-full max-w-md mx-auto flex justify-center items-center gap-2 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md ${isLoading ? 'bg-red-600' : `bg-gradient-to-br ${themeColors.buttonGradient} hover:opacity-90 disabled:from-zinc-500`}`}>
                    {isLoading ? <><Spinner /> Đang tạo...</> : <><SparklesIcon /> Generate Creatives</>}
                </button>
                {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                    {/* Thumbnail Concepts Column */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 h-[50rem] overflow-y-auto shadow-inner relative">
                        <h3 className={`text-2xl font-bold ${themeColors.text} mb-4 sticky top-[-1rem] bg-zinc-50/80 dark:bg-zinc-800/80 backdrop-blur-sm -mx-4 -mt-4 px-4 pt-4 pb-2 z-10`}>Thumbnail Concepts</h3>
                        <div className="space-y-4">
                            {generatedThumbnails.length === 0 && !isLoading && (
                                <div className="flex items-center justify-center h-[40rem]"><p className="text-zinc-500 text-center">Ý tưởng thumbnail sẽ xuất hiện ở đây...</p></div>
                            )}
                            {generatedThumbnails.map((concept: ThumbnailConcept, index: number) => (
                                <div key={index} className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-4">
                                    <h4 className={`font-bold ${themeColors.text}`}>{concept.name}</h4>
                                    <p className="text-sm font-semibold my-2">Text: <span className="font-mono bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded">{concept.textOverlay}</span></p>
                                    <DisplayField label="Description" value={concept.description} />
                                    <DisplayField label="Final Prompt" value={concept.finalPrompt} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SEO Package Column */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 h-[50rem] overflow-y-auto shadow-inner relative">
                        <h3 className={`text-2xl font-bold ${themeColors.text} mb-4 sticky top-[-1rem] bg-zinc-50/80 dark:bg-zinc-800/80 backdrop-blur-sm -mx-4 -mt-4 px-4 pt-4 pb-2 z-10`}>SEO Package</h3>
                        {isLoading && !generatedSeo && <p className="text-zinc-500 text-center pt-8">Đang tạo...</p>}
                        {!isLoading && !generatedSeo && (
                            <div className="flex items-center justify-center h-full -mt-12"><p className="text-zinc-500 text-center">Gói SEO sẽ xuất hiện ở đây...</p></div>
                        )}
                        {generatedSeo && (
                            <div className="animate-fade-in-down">
                                <div className="space-y-4">
                                    <DisplayField label="Title Options" value={generatedSeo.titleOptions} />
                                    <DisplayField label="Description" value={generatedSeo.description} />
                                    <DisplayField label="Hashtags" value={generatedSeo.hashtags} />
                                    <DisplayField label="Tags" value={generatedSeo.tags as SeoTagCategories} />
                                    <DisplayField label="Checklist" value={generatedSeo.checklist} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </ToolLayout>
    );
};

export default HistoryCreativesGenerator;
