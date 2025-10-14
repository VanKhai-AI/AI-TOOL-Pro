import React, { useCallback, useState } from 'react';
import { Type } from "@google/genai";
import { useToolState } from '../../contexts/ToolStateContext';
import { AI_TOOLS, SCRIPT_GENERATOR_MODEL, getToolThemeColors } from '../../constants';
import Spinner from '../ui/Spinner';
import { SparklesIcon, CopyIcon, CheckIcon, DownloadIcon } from '../ui/Icon';
import { SeoPackage, ThumbnailConcept, SeoTagCategories } from '../../types';
import ToolLayout from './common/ToolLayout';
import Input from './common/Input';
import useGeminiApi from '../../hooks/useGeminiApi';
import { slugify } from '../../utils/slugify';

const EdutainmentCreativesGenerator: React.FC = () => {
    const tool = AI_TOOLS.find(t => t.id === 'edutainment-creative')!;
    const themeColors = getToolThemeColors(tool.category);
    const toolId = 'edutainment-creative';
    const { getToolState, updateToolState } = useToolState();
    
    const scriptState = getToolState('edutainment-script');
    const outlineState = getToolState('edutainment-outline');
    const { scriptText = scriptState.fullScript || '', mainTitle = outlineState.generatedOutline?.title || 'Edutainment Video' } = getToolState(toolId);

    const state = getToolState(toolId);
    const {
        channelName = 'Curious Minds',
        nextVideo = 'Video liên quan',
        playlist = 'Danh sách phát khoa học',
        language = 'VI',
    } = state;
    
    // Local state for results
    const [generatedThumbnails, setGeneratedThumbnails] = useState<ThumbnailConcept[]>([]);
    const [generatedSeo, setGeneratedSeo] = useState<SeoPackage | null>(null);

    const { generate, isLoading, error, cancel } = useGeminiApi();
    const [currentError, setCurrentError] = useState<string | null>(null);
    
    const generateThumbnails = async (title: string, script: string) => {
        const prompt = `{
    "personalization_instructions": "You are a top-tier YouTube Thumbnail Design Expert for high-performing Edutainment channels (like Kurzgesagt, Mark Rober) known for their charming, witty style. Your mission is to create 3 detailed thumbnail concepts in ENGLISH.\\n\\nINPUTS:\\n- [Main Topic]: ${title}\\n- [Script Summary]: ${script.substring(0, 2000)}...\\n\\nCRITICAL INSTRUCTION: All output text fields ('name', 'textOverlay', 'description', 'finalPrompt') MUST be exclusively in ENGLISH.\\n\\nGOLDEN RULES & FORMULAS (MANDATORY):\\n- **Character is King**: The thumbnail MUST prominently feature **Professor Stickman**. His expression is the primary emotional hook. Make it exaggerated: overwhelmingly curious, hilariously shocked, or delightfully smug.\\n- **Layout & Composition**: Focus on a single, striking visual question. Use graphic elements like arrows and circles to draw attention to the focal point, often being pointed at by Professor Stickman.\\n- **Text Overlay (CRITICAL)**: Text must be HUGE, bold, and inquisitive, often with a humorous twist. Use powerful keywords like 'WHAT IF?', 'WHY?', 'The HILARIOUS Truth'.\\n- **Color & Contrast**: Use a bright, vibrant, high-contrast color palette.\\n- **Overall Style**: The thumbnail must be a clean, vibrant, high-quality 3D render or 2D vector illustration with an infographic feel. NO dark, gritty, or hyper-realistic styles.\\n\\nOUTPUT REQUIREMENT (JSON MANDATORY):\\nYou MUST return a JSON array of exactly 3 objects with the following structure. All text values MUST BE IN ENGLISH.\\n\\n1.  **name**: A suggestive name for the concept (e.g., \\"Professor's Shocking Discovery\\").\\n2.  **textOverlay**: A single string for the text. Example: \\"WHY LAZINESS IS GOOD FOR YOU!\\".\\n3.  **description**: A multi-line string in ENGLISH detailing: Professor Stickman's pose and expression, the main visual element, Background/Color, and Text (font, color, placement).\\n4.  **finalPrompt**: A single, comprehensive **ENGLISH** prompt for an AI image generator. This MUST include a detailed description of Professor Stickman's pose and expression, and the text overlay. Example: '3D infographic style, Professor Stickman with huge, shocked eyes and mouth agape, pointing his stick at a glowing, cartoonish brain that is relaxing in a beach chair. Minimalist bright yellow background. Text overlay reads \\"WHY LAZINESS IS GOOD FOR YOU?!\\" in a very large, bold, playful blue font. Vibrant, clean, high-quality render, 4K.'"
}`;
        const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, textOverlay: { type: Type.STRING }, description: { type: Type.STRING }, finalPrompt: { type: Type.STRING } }, required: ["name", "textOverlay", "description", "finalPrompt"] }};
        const response = await generate({ model: SCRIPT_GENERATOR_MODEL, contents: prompt, config: { responseMimeType: 'application/json', responseSchema: schema }});
        if (response?.text) return JSON.parse(response.text.replace(/```json\n?|```/g, ''));
        return null;
    };
    
    const generateSeo = async (title: string, script: string, lang: string, chanName: string) => {
         const prompt = `ROLE: You are a world-class YouTube SEO expert for **humorous** Edutainment content. Your mission is to generate a comprehensive, highly-optimized SEO package for the '${chanName}' channel.

INPUT INFORMATION:
- **Target Language:** ${lang}
- **Main Topic:** ${title}
- **Channel Name:** ${chanName}
- **Script Context:** ${script.substring(0, 4000)}...

SEO RULES AND STRUCTURE (STRICTLY ENFORCE):
1.  **Title (titleOptions):** Generate 3 compelling title options. Titles must be curiosity-driven, keyword-rich, and have a **playful or witty tone**.
2.  **Description (description):** Compose a detailed description (150-200 words) with 4 paragraphs:
    *   **Paragraph 1 (Hook):** Start with the video's central question or a mind-blowing, funny fact from the script.
    *   **Paragraph 2 (Content Intro):** Summarize what the video explains, using keywords like 'khoa học', 'công nghệ', 'giải thích', 'hoạt hình', **'hài hước'**.
    *   **Paragraph 3 (What Viewers Will Learn):** Detail the learning outcomes and the simple, fun approach.
    *   **Paragraph 4 (CTA):** A powerful CTA to subscribe for more fun knowledge.
3.  **Hashtags (hashtags):** Provide **exactly 3** relevant hashtags (e.g., \`#${chanName}\`, \`#KhoaHocVui\`, \`#GiaiThich\`).
4.  **Tags (tags):** Generate a JSON object with 5 categories of tags:
    *   \`"Chủ đề chính"\`: Main subjects.
    *   \`"Lĩnh vực & Chủ đề"\`: Specific fields.
    *   \`"Khái niệm & Nguyên tắc"\`: Key concepts.
    *   \`"Phong cách & Thể loại"\`: Content style (e.g., 'giải thích khoa học hài hước', 'hoạt hình giáo dục', 'edutainment vui').
    *   \`"Tìm kiếm nâng cao"\`: Long-tail searches.
5.  **Localization:** All generated text MUST be in **${lang}**.
6.  **Checklist**: Provide 3 actionable creator suggestions for making edutainment videos more humorous and engaging.

OUTPUT REQUIREMENT (JSON MANDATORY):
You MUST return a single JSON object with keys: "titleOptions", "description", "hashtags", "tags", and "checklist".`;
        const schema = { type: Type.OBJECT, properties: { titleOptions: { type: Type.ARRAY, items: { type: Type.STRING } }, description: { type: Type.STRING }, hashtags: { type: Type.STRING }, tags: { type: Type.OBJECT, properties: { "Chủ đề chính": { type: Type.STRING }, "Lĩnh vực & Chủ đề": { type: Type.STRING }, "Khái niệm & Nguyên tắc": { type: Type.STRING }, "Phong cách & Thể loại": { type: Type.STRING }, "Tìm kiếm nâng cao": { type: Type.STRING } } }, checklist: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["titleOptions", "description", "hashtags", "tags", "checklist"] };
        const response = await generate({ model: SCRIPT_GENERATOR_MODEL, contents: prompt, config: { responseMimeType: 'application/json', responseSchema: schema }});
        if (response?.text) return JSON.parse(response.text.replace(/```json\n?|```/g, ''));
        return null;
    };

    const handleGenerateAll = useCallback(async () => {
        const currentTitle = getToolState(toolId).mainTitle || mainTitle;
        const currentScript = getToolState(toolId).scriptText || scriptText;
        if (!currentScript) {
            setCurrentError("Vui lòng cung cấp kịch bản từ các bước trước.");
            return;
        }
        setCurrentError(null);
        setGeneratedThumbnails([]);
        setGeneratedSeo(null);

        try {
            const [thumbResult, seoResult] = await Promise.all([
                generateThumbnails(currentTitle, currentScript),
                generateSeo(currentTitle, currentScript, language, channelName)
            ]);
            
            if (thumbResult) setGeneratedThumbnails(thumbResult);
            if (seoResult) setGeneratedSeo(seoResult);
            if (!thumbResult && !seoResult) throw new Error("Cả hai quá trình tạo đều thất bại.");

        } catch(e: any) {
            setCurrentError(e.message || "Đã xảy ra lỗi trong quá trình tạo.");
        }
    }, [scriptText, mainTitle, channelName, nextVideo, playlist, language, generate, getToolState, toolId]);

    const handleDownload = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; document.body.appendChild(a);
        a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleDownloadSeo = () => {
        if (!generatedSeo) return;
        let content = `SEO PACKAGE FOR: ${mainTitle}\n\n========================================\n\n`;
        content += `TITLE OPTIONS:\n--------------------\n- ${generatedSeo.titleOptions.join('\n- ')}\n\n`;
        content += `DESCRIPTION:\n--------------------\n${generatedSeo.description}\n\n`;
        content += `HASHTAGS:\n--------------------\n${generatedSeo.hashtags}\n\n`;
        content += `TAGS:\n--------------------\n`;
        content += Object.entries(generatedSeo.tags).map(([key, value]) => `${key}: ${value}`).join('\n');
        content += `\n\nCHECKLIST:\n--------------------\n- ${generatedSeo.checklist.join('\n- ')}`;
        handleDownload(content, `SEO_${slugify(mainTitle)}.txt`);
    };
    
    const handleDownloadThumbnails = () => {
        if (generatedThumbnails.length === 0) return;
        let content = '';
        generatedThumbnails.forEach((concept, index) => {
            content += `CONCEPT ${index + 1}: ${concept.name}\n--------------------\n`;
            content += `Description:\n${concept.description}\n\n`;
            content += `Suggested Text: ${concept.textOverlay}\n\n`;
            content += `Final AI Prompt: ${concept.finalPrompt}\n\n`;
            if (index < generatedThumbnails.length - 1) content += `====================\n\n`;
        });
        handleDownload(content, 'thumbnail_concepts.txt');
    };

    return (
        <ToolLayout tool={tool} language={'vi'} setLanguage={() => {}} getPrompt={() => ""}>
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Tên kênh" id="channelName" value={channelName} onChange={e => updateToolState(toolId, { channelName: e.target.value })} ringColorClass={themeColors.ring} />
                    <Input label="Video giới thiệu tiếp theo" id="nextVideo" value={nextVideo} onChange={e => updateToolState(toolId, { nextVideo: e.target.value })} ringColorClass={themeColors.ring} />
                    <Input label="Playlist" id="playlist" value={playlist} onChange={e => updateToolState(toolId, { playlist: e.target.value })} ringColorClass={themeColors.ring} />
                    <Input label="Tiêu đề video" id="mainTitle" value={mainTitle} onChange={e => updateToolState(toolId, { mainTitle: e.target.value })} ringColorClass={themeColors.ring} />
                </div>

                <button onClick={isLoading ? cancel : handleGenerateAll} disabled={!scriptText && !isLoading} className={`w-full max-w-md mx-auto flex justify-center items-center gap-2 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md ${isLoading ? 'bg-red-600' : `bg-gradient-to-br ${themeColors.buttonGradient} hover:opacity-90 disabled:from-zinc-500`}`}>
                    {isLoading ? <><Spinner /> Đang tạo...</> : <><SparklesIcon /> Generate Creatives</>}
                </button>
                {(error || currentError) && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error || currentError}</p>}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                    {/* Thumbnail Concepts Column */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 h-[50rem] overflow-y-auto shadow-inner relative">
                        <div className="sticky top-[-1rem] bg-zinc-50/80 dark:bg-zinc-800/80 backdrop-blur-sm -mx-4 -mt-4 px-4 pt-4 pb-2 z-10 flex justify-between items-center">
                             <h3 className={`text-2xl font-bold ${themeColors.text}`}>Thumbnail Concepts</h3>
                             {generatedThumbnails.length > 0 && <button onClick={handleDownloadThumbnails} className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-bold py-1 px-3 rounded-md transition duration-300 text-sm"><DownloadIcon /> Download</button>}
                        </div>
                        <div className="space-y-4">
                            {generatedThumbnails.length === 0 && !isLoading && (
                                <div className="flex items-center justify-center h-[40rem]"><p className="text-zinc-500 text-center">Ý tưởng thumbnail sẽ xuất hiện ở đây...</p></div>
                            )}
                            {generatedThumbnails.map((concept, index) => (
                                <ThumbnailDisplay key={index} concept={concept} themeColors={themeColors} />
                            ))}
                        </div>
                    </div>

                    {/* SEO Package Column */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 h-[50rem] overflow-y-auto shadow-inner relative">
                        <div className="sticky top-[-1rem] bg-zinc-50/80 dark:bg-zinc-800/80 backdrop-blur-sm -mx-4 -mt-4 px-4 pt-4 pb-2 z-10 flex justify-between items-center">
                             <h3 className={`text-2xl font-bold ${themeColors.text}`}>SEO Package</h3>
                             {generatedSeo && <button onClick={handleDownloadSeo} className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-bold py-1 px-3 rounded-md transition duration-300 text-sm"><DownloadIcon /> Download</button>}
                        </div>
                        {isLoading && !generatedSeo && <p className="text-zinc-500 text-center pt-8">Đang tạo...</p>}
                        {!isLoading && !generatedSeo && (
                            <div className="flex items-center justify-center h-full -mt-12"><p className="text-zinc-500 text-center">Gói SEO sẽ xuất hiện ở đây...</p></div>
                        )}
                        {generatedSeo && (
                           <SeoDisplay seo={generatedSeo} />
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
};

const SeoDisplay: React.FC<{seo: SeoPackage}> = ({ seo }) => (
     <div className="animate-fade-in-down space-y-6">
        <CopyableField label="Title Options" value={seo.titleOptions.map(t => `- ${t}`).join('\n')} />
        <CopyableField label="Description" value={seo.description} />
        <CopyableField label="Hashtags" value={seo.hashtags} />
        <CopyableField label="Tags" value={Object.entries(seo.tags).map(([k,v]) => `${k}: ${v}`).join('\n')} />
        <CopyableField label="Checklist" value={seo.checklist.map(c => `- ${c}`).join('\n')} />
    </div>
);


const ThumbnailDisplay: React.FC<{concept: ThumbnailConcept; themeColors: any}> = ({ concept, themeColors }) => (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-4 space-y-3">
        <h4 className={`font-bold ${themeColors.text}`}>{concept.name}</h4>
        <p className="text-sm font-semibold">Text: <span className="font-mono bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded">{concept.textOverlay}</span></p>
        <CopyableField label="Description" value={concept.description} />
        <CopyableField label="Final Prompt" value={concept.finalPrompt} />
    </div>
);


const CopyableField: React.FC<{ label: string; value: string; }> = ({ label, value }) => {
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">{label}</h4>
                <button onClick={handleCopy} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs flex items-center gap-1">
                    {isCopied ? <CheckIcon className="w-3 h-3 text-green-500"/> : <CopyIcon className="w-3 h-3"/>} {isCopied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-900/50 p-3 rounded-md text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-sans">
                {value}
            </div>
        </div>
    );
};

export default EdutainmentCreativesGenerator;