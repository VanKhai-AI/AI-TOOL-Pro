import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Type } from '@google/genai';
import { useToolState } from '../../contexts/ToolStateContext';
import { AI_TOOLS, SCRIPT_GENERATOR_MODEL, getToolThemeColors } from '../../constants';
import { CharacterProfile, EnvironmentProfile, GeneratedTrailer, GeneratedImagePrompt, LanguageCode } from '../../types';
import Spinner from '../ui/Spinner';
import ToolLayout from './common/ToolLayout';
import { DownloadIcon } from '../ui/Icon';
import useGeminiApi from '../../hooks/useGeminiApi';
import { slugify } from '../../utils/slugify';

type ImageAssetState = {
    concepts: CharacterProfile[];
    environments: EnvironmentProfile[];
    trailer: GeneratedTrailer | null;
    imagePrompts: GeneratedImagePrompt[];
    trailerDuration: number;
    error: string | null;
};

const EdutainmentImageAssetsGenerator: React.FC = () => {
    const tool = AI_TOOLS.find(t => t.id === 'edutainment-image-assets')!;
    const themeColors = getToolThemeColors(tool.category);
    const toolId = 'edutainment-image-assets';
    const { getToolState, updateToolState } = useToolState();

    const state: { scriptText?: string; mainTitle?: string, language?: LanguageCode } & Partial<ImageAssetState> = getToolState(toolId);
    const {
        scriptText = '',
        mainTitle = 'Edutainment Video',
        language = 'VI',
        concepts = [],
        environments = [],
        trailer = null,
        imagePrompts = [],
        trailerDuration = 30,
        error = null,
    } = state;
    
    const { generate, cancel } = useGeminiApi();
    const [activeTask, setActiveTask] = useState<string | null>(null);

    const scriptParagraphs = useMemo(() => scriptText.split('\n\n').filter(p => p.trim() !== '' && !p.startsWith('###')).length, [scriptText]);

    const setState = (newState: Partial<ImageAssetState>) => {
        updateToolState(toolId, newState);
    };
    
    const handleStop = () => {
        cancel();
        setActiveTask(null);
    };

    const runGeneration = async (taskName: string, prompt: string, schema: any): Promise<any> => {
        setActiveTask(taskName);
        setState({ error: null });
        try {
            const response = await generate({
                model: SCRIPT_GENERATOR_MODEL,
                contents: prompt,
                config: { responseMimeType: 'application/json', responseSchema: schema }
            });

            if (response === null) {
                // User cancelled or all keys failed. The hook sets the error.
                return null;
            }

            if (!response.text) {
                throw new Error("API response was empty.");
            }
            const cleanJson = response.text.replace(/```json\n?|```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e: any) {
            setState({ error: `Lỗi khi thực hiện "${taskName}": ${e.message}` });
            return null;
        } finally {
            setActiveTask(null);
        }
    };
    
    // 1. Generate Concept IDs
    const handleGenerateConcepts = async () => {
        const prompt = `ROLE: You are an AI Production Manager and Visual Design Specialist for a top-tier Edutainment channel celebrated for its charming and humorous stickman animations. Your task is to analyze the script and extract key characters and concepts.

**PRIMARY CHARACTER - PROFESSOR STICKMAN (MANDATORY):**
Your most important task is to create a profile for the main character, **Professor Stickman**. He is the channel's host and narrator. Adhere strictly to this description: "A wise Professor Stickman with a large, round head, big expressive circular eyes with distinct black pupils, and small round intellectual glasses perched on his face. He has a few stray wisps of hair sticking up from the top of his head. His body is composed of simple straight lines - a vertical line for the torso and two short horizontal lines at the shoulders suggesting a scholarly blazer. His overall proportions are balanced and visually pleasing. He stands with his legs as two well-proportioned straight lines of medium length and simple oval feet, firmly planted on the ground. He sports a confident, knowing smirk. One arm is raised, pointing outward as if explaining an important concept, while the other hand holds a simple pointer stick."
- Ensure his \`character_id\` is 'ProfessorStickman'.
- His \`Behavior_Personality\` should be 'Wise, witty, charismatic, endlessly curious, and slightly quirky'.

OUTPUT REQUIREMENT (MANDATORY): You MUST return a JSON array of objects. All fields must be in ENGLISH.

JSON STRUCTURE FOR EACH CONCEPT/CHARACTER:
{
  "character_id": "A concise, conjoined English identifier, e.g., ProfessorStickman, TheFriendlyAtom",
  "Name_ID": "The concept's role or general description, e.g., Professor Stickman (Host), The Atom (Mascot)",
  "Physical_Appearance": "Detailed description of its visual form. For Professor Stickman, use the mandatory description above. For other concepts, keep them simple and iconic.",
  "Behavior_Personality": "How it acts in animations. E.g., 'Curious and helpful', 'Powerful and complex', or for Professor Stickman: 'Wise, witty, charismatic'.",
  "Distinctive_Features": "The most memorable visual trait. For Professor Stickman: 'His expressive eyes and intellectual glasses'.",
  "Art_Style_Lock": "Clean, vibrant, minimalist, 2D/3D-infographic style. Bright color palette. Inspired by channels like Kurzgesagt, but with a more playful and character-driven feel centered around Professor Stickman. The style must be perfect for humor and clarity."
}

INPUT SCRIPT:
---
${scriptText}
---`;
        const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { character_id: { type: Type.STRING }, Name_ID: { type: Type.STRING }, Physical_Appearance: { type: Type.STRING }, Behavior_Personality: { type: Type.STRING }, Distinctive_Features: { type: Type.STRING }, Art_Style_Lock: { type: Type.STRING } }, required: ["character_id", "Name_ID"] }};
        const result = await runGeneration("Tạo Concept ID", prompt, schema);
        if (result) setState({ concepts: result });
    };

    // 2. Generate Environment IDs
    const handleGenerateEnvironments = async () => {
        const prompt = `ROLE: You are an AI Visual Director for a top-tier Edutainment channel. Your task is to analyze the script and extract key environments, settings, or abstract backgrounds (e.g., A Stylized Laboratory, A Vibrant Microscopic World, An Abstract Infographic Space) and create detailed profiles in ENGLISH.

OUTPUT REQUIREMENT (MANDATORY): You MUST return a JSON array of objects. All fields must be in ENGLISH.

JSON FORMATTING RULE: Ensure all string values in the JSON are properly escaped. Any double quotes (") inside a string field must be escaped with a backslash (\\"). Newlines inside a string must be represented as \\n.

JSON STRUCTURE FOR EACH ENVIRONMENT:
{
  "environment_id": "A concise, conjoined English identifier, e.g., AbstractInfographicSpace, StylizedMicroscopicWorld, VibrantCosmicBackground",
  "Name_ID": "The full name of the environment, e.g., The Infographic Grid, Inside a Human Cell, The Cosmos",
  "Physical_Appearance": "Detailed description of the visual style: clean, minimalist, abstract, stylized. Focus on shapes, lines, and textures that support information display without being distracting.",
  "Age_Life_Stage": "N/A. Use 'Timeless' or 'Conceptual'.",
  "Height_Size": "The scale of the space: 'Infinite grid', 'Microscopic landscape', 'Vast cosmic canvas'.",
  "Accessories_Elements": "Supporting visual elements: 'Floating icons', 'subtle grid lines', 'glowing data particles', 'stylized planets and stars'.",
  "Distinctive_Features": "A unique highlight: 'The seamless way it transitions between concepts', 'Its use of depth of field to focus attention', 'Its dynamic, animated background elements'.",
  "Atmosphere_Personality": "The mood: 'Clean and clinical', 'Awe-inspiring and vast', 'Playful and energetic', 'Focused and informative'.",
  "Lighting_Color_Palette": "Lighting and color scheme: 'Bright, even lighting', 'soft ambient glow', 'Vibrant, high-contrast color palette with a clean white or dark background', 'Use of brand colors for consistency'.",
  "Era": "N/A. Use 'Modern' or 'Futuristic'.",
  "Art_Style_Lock": "Clean, vibrant, minimalist, 2D/3D-infographic style. Bright color palette, smooth gradients, and clear visual communication. Inspired by channels like Kurzgesagt, but with a more playful and character-driven feel centered around Professor Stickman. The style must be perfect for humor and clarity."
}

INPUT SCRIPT:
---
${scriptText}
---`;
        const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { environment_id: { type: Type.STRING }, Name_ID: { type: Type.STRING }, Physical_Appearance: { type: Type.STRING }, Age_Life_Stage: { type: Type.STRING }, Height_Size: { type: Type.STRING }, Accessories_Elements: { type: Type.STRING }, Distinctive_Features: { type: Type.STRING }, Atmosphere_Personality: { type: Type.STRING }, Lighting_Color_Palette: { type: Type.STRING }, Era: { type: Type.STRING }, Art_Style_Lock: { type: Type.STRING } }, required: ["environment_id", "Name_ID"] }};
        const result = await runGeneration("Tạo Environment ID", prompt, schema);
        if (result) setState({ environments: result });
    };

    // 3. Generate Trailer
    const handleGenerateTrailer = async () => {
        const conceptInput = concepts.length > 0
            ? `- Concept IDs: ${concepts.map(c => c.character_id).join(', ')}`
            : `- Concept IDs: Not provided. You must infer relevant concepts or mascots from the script.`;
        const environmentInput = environments.length > 0
            ? `- Environment IDs: ${environments.map(e => e.environment_id).join(', ')}`
            : `- Environment IDs: Not provided. You must infer relevant environments or abstract backgrounds from the script.`;
        const consistencyGuideline = concepts.length > 0
            ? `- **Consistency:** Use the provided Concept and Environment IDs, especially 'ProfessorStickman'.`
            : `- **Consistency:** Infer concepts and environments from the script and maintain consistency throughout the trailer.`;
        
        const prompt = `ROLE: You are a Viral Edutainment Video Trailer Director. Your mission is to create a fast-paced, curiosity-driven trailer script that poses a fascinating question and promises a visually stunning explanation, compelling viewers to watch the full video.

INPUTS:
- Voice Over Language: ${language}
- Target Trailer Duration: approximately ${trailerDuration} seconds.
${conceptInput}
${environmentInput}
- Full Script: Provided for your analysis to extract the core question and most visually exciting moments.

CORE GUIDELINES:
1.  **Narrative Arc:** Hook with a big question -> Present a common misconception -> Hint at a surprising truth -> Show quick, dynamic visuals of the explanation (featuring Professor Stickman) -> End with a call to discover the answer.
2.  **Voice Over (in ${language}):** Must be short, punchy, and exciting sentences. Use questions heavily. The tone should be enthusiastic and full of wonder.
3.  **Visual Prompt (in ENGLISH):** 
    -   **Art Style (MANDATORY): Clean, vibrant, minimalist, 2D/3D-infographic style. Bright color palette. Inspired by Kurzgesagt, but with a more playful, character-driven feel centered around Professor Stickman. The style must be perfect for humor and clarity. AVOID hyper-realism or dark styles.**
    -   **Character Focus (CRITICAL): Professor Stickman should appear frequently, reacting to the information with witty expressions.**
    -   **Cinematography:** Use dynamic, fast-paced camera moves: quick zooms, slides, and transitions. Focus on clarity and visual appeal.
    -   ${consistencyGuideline}
4.  **Structure:** Create ~10-12 scenes for a ${trailerDuration}-second trailer.

OUTPUT FORMAT (JSON REQUIRED):
\`\`\`json
{
  "scenes": [
    {
      "start": "00:00",
      "duration": 3,
      "visual_prompt": "Clean 3D infographic style. Professor Stickman (character: ProfessorStickman) stands next to a stylized Earth, looking thoughtful with a hand on his chin. A glowing question mark pops up. Vibrant colors, smooth animation.",
      "voice_over": "Bạn đã bao giờ tự hỏi... điều gì sẽ xảy ra nếu Mặt Trăng biến mất?",
      "transition": "Quick cut to:",
      "sfx": "Upbeat synth pop, whoosh sound",
      "music": "Curious and energetic electronic track begins"
    }
  ],
  "total_duration": ${trailerDuration}
}
\`\`\`

FULL SCRIPT:
---
${scriptText}
---`;
        const schema = { type: Type.OBJECT, properties: { scenes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { start: { type: Type.STRING }, duration: { type: Type.NUMBER }, visual_prompt: { type: Type.STRING }, voice_over: { type: Type.STRING }, transition: { type: Type.STRING }, sfx: { type: Type.STRING }, music: { type: Type.STRING } }, required: ["duration", "visual_prompt", "voice_over"] } }, total_duration: { type: Type.NUMBER } }, required: ["scenes", "total_duration"] };
        const result = await runGeneration("Tạo Trailer", prompt, schema);
        if (result) setState({ trailer: result });
    };

    // 4. Generate Image Prompts
    const handleGenerateImagePrompts = async () => {
        const taskName = 'Tạo Prompt Part';
        setState({ error: null, imagePrompts: [] });
        setActiveTask(taskName);

        const parts = scriptText.split(/###\s*Part \d+: .*?\s*###/g).filter(p => p.trim() !== '');
        if (parts.length === 0) {
            setState({ error: "Kịch bản không chứa các phần được định dạng hợp lệ (ví dụ: ### Part 1: ... ###)." });
            setActiveTask(null);
            return;
        }

        const conceptInput = concepts.length > 0
            ? `- Concept IDs: ${concepts.map(c => c.character_id).join(', ')}`
            : `- Concept IDs: Not provided. You must infer concepts from the script snippet.`;
        const environmentInput = environments.length > 0
            ? `- Environment IDs: ${environments.map(e => e.environment_id).join(', ')}`
            : `- Environment IDs: Not provided. You must infer environments from the script snippet.`;
        const consistencyGuideline = concepts.length > 0
            ? `- **Consistency:** You must use the provided IDs.`
            : `- **Consistency:** You must infer concepts and environments and maintain consistency.`;
        
        const allPrompts: GeneratedImagePrompt[] = [];
        let sceneIdCounter = 1;

        try {
            for (let i = 0; i < parts.length; i++) {
                const partScript = parts[i].trim();
                const prompt = `ROLE: You are an AI Motion Graphics Director for a top Edutainment channel known for its witty stickman animations starring Professor Stickman. Your task is to convert each paragraph of a script into a detailed image prompt in ENGLISH.

INPUTS:
${conceptInput}
${environmentInput}
- Starting Scene ID: ${sceneIdCounter}
- Segment ID (Part Number): ${i + 1}
- Script Snippet: The specific script part to be converted.

CORE STYLE GUIDELINES (MANDATORY):
- **Art Style (MANDATORY): Clean, vibrant, minimalist, 2D/3D-infographic style. Bright color palette, smooth gradients. Inspired by channels like Kurzgesagt, but with a more playful, character-driven feel. AVOID hyper-realism or dark styles.**
- **Character Focus (CRITICAL): Professor Stickman MUST be the central character in most prompts.** Show him explaining, interacting with concepts, looking curious, shocked, or having a 'eureka!' moment. Use his pointer stick to direct attention. His exaggerated expressions are key to conveying the video's humorous and engaging tone.
- **Imagery:** Generate powerful images that visually and humorously explain the concept in the paragraph.
- **Quality Keywords:** Always add: vibrant colors, 3D render, infographic style, clean background, minimalist, engaging, sharp focus, 4K.
${consistencyGuideline}

PROCESS: For EACH paragraph in the 'SCRIPT SNIPPET', generate ONE JSON object. The number of objects in the final array MUST EXACTLY match the number of paragraphs. Ensure 'ProfessorStickman' is listed in the \`characters\` array for almost every scene.

OUTPUT FORMAT (JSON ARRAY REQUIRED):
{
  "scene_id": "Sequential scene number, starting from ${sceneIdCounter}",
  "segment_id": ${i + 1},
  "characters": ["ProfessorStickman", "Any other relevant concept_ids"],
  "environment": ["Array of relevant environment_ids"],
  "prompt_image": "The detailed, clean, infographic-style image prompt string in ENGLISH, featuring Professor Stickman."
}

SCRIPT SNIPPET:
---
${partScript}
---`;
                const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { scene_id: { type: Type.STRING }, segment_id: { type: Type.NUMBER }, characters: { type: Type.ARRAY, items: { type: Type.STRING } }, environment: { type: Type.ARRAY, items: { type: Type.STRING } }, prompt_image: { type: Type.STRING } }, required: ["scene_id", "segment_id", "prompt_image"] }};
                
                const response = await generate({
                    model: SCRIPT_GENERATOR_MODEL,
                    contents: prompt,
                    config: { responseMimeType: 'application/json', responseSchema: schema }
                });

                if (response === null) {
                    return; // Task was cancelled or failed, stop the loop.
                }

                if (!response.text) throw new Error(`Phản hồi API trống cho phần ${i + 1}.`);

                const result = JSON.parse(response.text.replace(/```json\n?|```/g, '').trim());
                if (Array.isArray(result)) {
                    allPrompts.push(...result);
                    setState({ imagePrompts: [...allPrompts] });
                    sceneIdCounter += result.length;
                } else {
                    throw new Error(`Định dạng JSON không hợp lệ cho phần ${i + 1}.`);
                }
            }
        } catch (e: any) {
            setState({ error: `Lỗi khi tạo prompts: ${e.message}` });
        } finally {
            setActiveTask(null);
        }
    };
    
    const downloadAsTxt = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleDownloadVoiceover = () => {
        if (!trailer) return;
        const content = trailer.scenes.map(s => s.voice_over).join('\n\n');
        downloadAsTxt(content, 'trailer_voiceover.txt');
    };

    const handleDownloadAllPrompts = () => {
        const trailerPrompts = trailer?.scenes.map(s => s.visual_prompt) || [];
        const scriptPrompts = imagePrompts.map(p => p.prompt_image);
        const allPrompts = [...trailerPrompts, ...scriptPrompts];
        if (allPrompts.length === 0) return;
        const content = allPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n\n');
        downloadAsTxt(content, 'all_image_prompts.txt');
    };

    const handleContinue = () => {
        if (!scriptText || !mainTitle) return;
        updateToolState('edutainment-creative', { scriptText, mainTitle, language, imagePrompts });
        alert("Đã sao chép tài sản! Vui lòng chuyển sang công cụ '5. Tạo Nội Dung Sáng Tạo' để tiếp tục.");
    };

    const getButtonContent = (taskName: string, defaultText: string) => {
        if (activeTask === taskName || (activeTask && activeTask.startsWith(taskName))) {
            return <><i className="fas fa-stop-circle mr-2"></i>Dừng</>;
        }
        return defaultText;
    };
    
    const getButtonAction = (taskName: string, action: () => void) => {
         if (activeTask === taskName || (activeTask && activeTask.startsWith(taskName))) {
            return handleStop;
        }
        return action;
    };

    const isButtonDisabled = (taskName: string) => {
        return !scriptText || (!!activeTask && !activeTask.startsWith(taskName));
    };

    const actionButtonClass = (taskName: string) => `w-full flex justify-center items-center gap-2 text-white font-bold py-2 px-3 rounded-lg transition duration-300 shadow-md ${
        (activeTask === taskName || (activeTask && activeTask.startsWith(taskName)))
        ? 'bg-red-600 hover:bg-red-700'
        : `bg-gradient-to-br ${themeColors.buttonGradient} hover:opacity-90 disabled:from-zinc-500 disabled:to-zinc-400 disabled:opacity-100 disabled:cursor-not-allowed`
    }`;

    return (
        <ToolLayout tool={tool} language="vi" setLanguage={() => {}} getPrompt={() => ""}>
            <div className="space-y-8">
                {error && <p className="text-red-500 dark:text-red-400 text-sm text-center bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">{error}</p>}
                
                <div className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         <button onClick={getButtonAction('Tạo Concept ID', handleGenerateConcepts)} disabled={isButtonDisabled('Tạo Concept ID')} className={actionButtonClass('Tạo Concept ID')}>
                           {getButtonContent('Tạo Concept ID', '1. Tạo Concept ID')}
                        </button>
                        <button onClick={getButtonAction('Tạo Environment ID', handleGenerateEnvironments)} disabled={isButtonDisabled('Tạo Environment ID')} className={actionButtonClass('Tạo Environment ID')}>
                           {getButtonContent('Tạo Environment ID', '2. Tạo Environment ID')}
                        </button>
                         <div className="bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-inner flex flex-col sm:flex-row items-center gap-2">
                            <label htmlFor="trailer-duration" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                                3. Trailer: <span className="font-bold">{trailerDuration}s</span>
                            </label>
                            <input 
                                id="trailer-duration"
                                type="range" 
                                min="15" 
                                max="60" 
                                value={trailerDuration} 
                                onChange={e => setState({ trailerDuration: Number(e.target.value)})} 
                                className={`w-full h-2 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer ${themeColors.accent}`}
                                disabled={!!activeTask} 
                            />
                             <button onClick={getButtonAction('Tạo Trailer', handleGenerateTrailer)} disabled={isButtonDisabled('Tạo Trailer')} className={`${actionButtonClass('Tạo Trailer')} w-full sm:w-auto flex-shrink-0`}>
                               {getButtonContent('Tạo Trailer', 'Tạo')}
                            </button>
                        </div>
                        <button onClick={getButtonAction('Tạo Prompt Part', handleGenerateImagePrompts)} disabled={isButtonDisabled('Tạo Prompt Part')} className={actionButtonClass('Tạo Prompt Part')}>
                           {getButtonContent('Tạo Prompt Part', '4. Tạo Prompt Image')}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                    <div className="summary-box"><h4>Concepts</h4><p className={themeColors.text}>{concepts.length}</p></div>
                    <div className="summary-box"><h4>Environments</h4><p className={themeColors.text}>{environments.length}</p></div>
                    <div className="summary-box"><h4>Trailer Scenes</h4><p className={themeColors.text}>{trailer?.scenes.length || 0}</p></div>
                    <div className="summary-box"><h4>Image Prompts</h4><p className={themeColors.text}>{imagePrompts.length} / {scriptParagraphs}</p></div>
                </div>

                <div className="flex justify-center items-center gap-4">
                    <button onClick={handleDownloadVoiceover} disabled={!trailer} className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-bold py-2 px-4 rounded-md transition duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <DownloadIcon /> Tải xuống Giọng đọc Trailer (.txt)
                    </button>
                     <button onClick={handleDownloadAllPrompts} disabled={!trailer && imagePrompts.length === 0} className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-bold py-2 px-4 rounded-md transition duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <DownloadIcon /> Tải xuống tất cả Prompt (.txt)
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ResultPanel title="Concepts" data={concepts} themeColors={themeColors}>
                        {concepts.map((c) => <p key={c.character_id} className="text-xs italic text-zinc-500 border-b dark:border-zinc-700 last:border-b-0 py-2">{c.Name_ID} ({c.character_id})</p>)}
                    </ResultPanel>
                    <ResultPanel title="Environments" data={environments} themeColors={themeColors}>
                        {environments.map((e) => <p key={e.environment_id} className="text-xs italic text-zinc-500 border-b dark:border-zinc-700 last:border-b-0 py-2">{e.Name_ID} ({e.environment_id})</p>)}
                    </ResultPanel>
                    <ResultPanel title="Trailer" data={trailer} themeColors={themeColors}>
                        {trailer?.scenes.map((scene, i) => <div key={i} className="text-xs border-b dark:border-zinc-700 last:border-b-0 py-2"><p className="font-bold">{scene.voice_over}</p><p className="italic text-zinc-500">{scene.visual_prompt}</p></div>)}
                    </ResultPanel>
                    <ResultPanel title="Image Prompts" data={imagePrompts} themeColors={themeColors}>
                        {imagePrompts.map((p) => <p key={p.scene_id} className="text-xs italic text-zinc-500 border-b dark:border-zinc-700 last:border-b-0 py-2">{p.scene_id}: {p.prompt_image}</p>)}
                    </ResultPanel>
                </div>

                {imagePrompts.length > 0 && (
                    <div className="mt-8 flex justify-center">
                        <button onClick={handleContinue} className={`flex items-center gap-2 ${themeColors.buttonSolid} text-white font-bold py-3 px-6 rounded-md transition duration-300 text-base`}>
                            Tiếp tục đến Bước 5: Sáng tạo
                        </button>
                    </div>
                )}
            </div>
            <style>{`
            .summary-box {
                background-color: white;
                padding: 0.75rem;
                border-radius: 0.5rem;
                box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
                border: 1px solid #e5e7eb; /* zinc-200 */
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .dark .summary-box {
                background-color: #27272a; /* zinc-800 */
                border-color: #3f3f46; /* zinc-700 */
            }
            .summary-box h4 {
                font-size: 0.875rem;
                font-weight: 600;
                color: #6b7280; /* zinc-500 */
            }
            .dark .summary-box h4 {
                color: #a1a1aa; /* zinc-400 */
            }
            .summary-box p {
                font-size: 1.5rem;
                font-weight: 700;
                margin-top: 0.25rem;
            }
        `}</style>
        </ToolLayout>
    );
};

const ResultPanel: React.FC<{title: string; data: any[] | object | null; children: React.ReactNode; themeColors: any}> = ({title, data, children, themeColors}) => {
    const hasData = Array.isArray(data) ? data.length > 0 : !!data;
    return (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-inner">
            <div className="flex justify-between items-center p-3 border-b border-zinc-200 dark:border-zinc-700">
                <h3 className={`text-lg font-bold ${themeColors.text}`}>{title}</h3>
            </div>
            <div className="p-3 h-96 overflow-y-auto">
                {hasData ? children : <p className="text-center text-zinc-400 pt-16 text-sm">Chưa có dữ liệu.</p>}
            </div>
        </div>
    );
};

export default EdutainmentImageAssetsGenerator;