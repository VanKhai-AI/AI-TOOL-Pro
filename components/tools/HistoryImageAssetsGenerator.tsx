import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Type } from '@google/genai';
import { useToolState } from '../../contexts/ToolStateContext';
import { AI_TOOLS, SCRIPT_GENERATOR_MODEL, getToolThemeColors } from '../../constants';
import { CharacterProfile, EnvironmentProfile, GeneratedTrailer, GeneratedImagePrompt, LanguageCode } from '../../types';
import Spinner from '../ui/Spinner';
import ToolLayout from './common/ToolLayout';
import { DownloadIcon } from '../ui/Icon';
import useGeminiApi from '../../hooks/useGeminiApi';
import { slugify } from '../../utils/slugify';

// Define a type for the component's state
type ImageAssetState = {
    characters: CharacterProfile[];
    environments: EnvironmentProfile[];
    trailer: GeneratedTrailer | null;
    imagePrompts: GeneratedImagePrompt[];
    trailerDuration: number;
    error: string | null;
};

const HistoryImageAssetsGenerator: React.FC = () => {
    const tool = AI_TOOLS.find(t => t.id === 'history-image-assets')!;
    const themeColors = getToolThemeColors(tool.category);
    const toolId = 'history-image-assets';
    const { getToolState, updateToolState } = useToolState();

    const state: { scriptText?: string; outlineText?: string; language?: LanguageCode } & Partial<ImageAssetState> = getToolState(toolId);
    const {
        scriptText = '',
        outlineText = '',
        language = 'VI',
        characters = [],
        environments = [],
        trailer = null,
        imagePrompts = [],
        trailerDuration = 30,
        error = null,
    } = state;
    
    const { generate, cancel } = useGeminiApi();
    const [activeTask, setActiveTask] = useState<string | null>(null);

    const mainTitle = useMemo(() => outlineText.match(/Tiêu đề chính:\s*(.*)/i)?.[1].trim() || 'Lịch sử Việt Nam', [outlineText]);
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
    
    const handleGenerateCharacters = async () => {
        const channelName = getToolState('history-topic')?.channelName || 'HistoryWhy';
        const prompt = `ROLE: You are an AI Production Manager and Visual Design Specialist for the '${channelName}' YouTube channel, which focuses on cinematic, in-depth, and emotionally resonant historical content, particularly grand military history and great resistance wars of Vietnam, expanding to other epic world war narratives. Your task is to meticulously read the provided script, then analyze and extract all key historical figures, military units, or archetypes (e.g., The Valiant Commander, The Invading General, The Resilient Peasant Soldier, The Strategic Advisor). Create detailed, consistent profiles for each in ENGLISH. These profiles should align with the channel's "cinematic, epic, historically accurate, in-depth, and emotionally gripping" positioning and its goal to attract and inspire millions of global viewers by exploring significant historical events and figures with stunning visuals and deep narrative.

OUTPUT REQUIREMENT (MANDATORY):
You MUST return a JSON array of objects. For each historical figure, military unit, or character archetype identified in the script, create a JSON object that strictly adheres to the following structure. All field values MUST be in ENGLISH. Infer and fill in the details for each entry based on their role, descriptions, and actions in the script, ensuring they reflect the channel's target audience (seeking accurate knowledge, epic stories, national pride, depth, and stunning visuals) and its "epic, in-depth, dramatic, emotional" tone and style, especially for historical and military contexts.

JSON STRUCTURE FOR EACH CHARACTER (ALL FIELDS IN ENGLISH):
{
  "character_id": "A concise, conjoined English identifier, e.g., ValiantVietnameseGeneral, MongolInvaderCommander, ResilientPeasantSoldier, StrategicAdvisor",
  "Name_ID": "The character's historical role or general description, e.g., The Đại Việt Commander, Mongol Cavalryman, Vietnamese Peasant Soldier (Archetype), Imperial Strategist",
  "Physical_Appearance": "Detailed description: strong, determined, wise, or battle-hardened face, reflecting the historical era and their status (e.g., stern general, weary soldier, cunning advisor). Emphasize historical accuracy, heroism, and the intensity of warfare for an epic cinematic portrayal, suitable for a documentary.",
  "Age_Life_Stage": "Age or life stage: Seasoned General (40s-60s), Young Warrior (20s-30s), Resilient Civilian (any age), Wise Elder (70s+). Reflect historical context and character's role.",
  "Height_Size": "General build and posture, reflecting the physique of a warrior, leader, or common person of the historical period. Emphasize strength, determination, or resilience appropriate to their role and the dramatic narrative.",
  "Costume_Accessories": "Signature attire based on historical records: specific traditional armor (e.g., Đại Việt armor, Mongol lamellar armor), military uniforms, peasant clothing, distinctive weapons (sword, spear, bow, crossbow), helmets, or ceremonial attire. Accessories like banners, strategic maps, seals of office, or personal symbols of rank/allegiance. Emphasize meticulous historical accuracy and visual impact for a cinematic production.",
  "Distinctive_Features": "The most prominent feature: piercing, strategic eyes; a battle scar; a regal bearing; a posture of defiance or command; an expression of fierce determination, deep emotion, or profound wisdom. Focus on features that convey their role and the intensity of the historical event.",
  "Behavior_Personality": "Personality demonstrated: courageous, strategic, ruthless (for invading forces), resilient, defiant, wise, determined, or showing the raw emotions of war (fear, resolve, triumph, sorrow). Must fit the dramatic and epic narrative of historical conflicts and heroic sagas.",
  "Skin_Tone": "A plausible, realistic skin tone, reflecting the geographical and historical context of the characters (e.g., Southeast Asian, East Asian, Central Asian, European).",
  "Era": "Specific historical period (e.g., 13th Century Đại Việt, 18th Century Tây Sơn Dynasty, French Colonial Period, Early 20th Century, Ancient Roman Empire). Ensure accuracy to the script's setting.",
  "Art_Style_Lock": "Hyper-realistic, cinematic historical reenactment aesthetic, emphasizing grandeur, dramatic lighting (high contrast, moody), intense action, and meticulous historical accuracy. Suitable for an epic historical and military documentary channel. Avoid modern, cartoonish, or overly stylized looks. Focus on a rich, dark, and intense color palette fitting the 'war' and 'epic' themes."
}

INPUT SCRIPT:
---
${scriptText}
---`;
        const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { character_id: { type: Type.STRING }, Name_ID: { type: Type.STRING }, Physical_Appearance: { type: Type.STRING }, Age_Life_Stage: { type: Type.STRING }, Height_Size: { type: Type.STRING }, Costume_Accessories: { type: Type.STRING }, Distinctive_Features: { type: Type.STRING }, Behavior_Personality: { type: Type.STRING }, Skin_Tone: { type: Type.STRING }, Era: { type: Type.STRING }, Art_Style_Lock: { type: Type.STRING } }, required: ["character_id", "Name_ID"] }};
        const result = await runGeneration("Tạo Character ID", prompt, schema);
        if (result) setState({ characters: result });
    };

    const handleGenerateEnvironments = async () => {
        const channelName = getToolState('history-topic')?.channelName || 'HistoryWhy';
        const prompt = `ROLE:
You are an AI Production Manager and Visual Director for the "${channelName}" YouTube channel. Your task is to meticulously read the provided script, then analyze and extract all key environments (e.g., ancient battlefields, royal courts, strategic landscapes, historical archives, war council tents) and create detailed, consistent profiles in ENGLISH. The environments must reflect the channel's core mission: "Lịch sử Việt Nam được kể bằng phong cách điện ảnh hùng tráng, chuyên sâu và đầy cảm xúc." (Vietnamese history told in an epic cinematic, in-depth, and emotional style.) Your descriptions should evoke a sense of grandeur, drama, historical accuracy, intense conflict, strategic brilliance, and national pride for an audience fascinated by military history and epic stories.

OUTPUT REQUIREMENT (MANDATORY):
You MUST return a JSON array of objects. For each environment identified in the script, create a JSON object that strictly adheres to the following structure. All field values MUST be in ENGLISH. Infer and fill in the details based on the descriptions and atmosphere in the script, ensuring they align with the "${channelName}" channel's specific brand and content strategy, especially its focus on "EPIC", "WAR", and "CRUSHED" themes and cinematic visual style.

JSON STRUCTURE FOR EACH ENVIRONMENT (ALL FIELDS IN ENGLISH):
{
  "environment_id": "A concise, conjoined English identifier relevant to historical warfare/events, e.g., AncientBattlefield, ImperialPalace, StrategicRiverEstuary, WarCouncilTent, FortifiedCitadel, ScorchedEarth",
  "Name_ID": "The full name of the environment, e.g., The Bloody Bach Dang River, The Imposing Thang Long Citadel, The Devastated Battleground of Chi Lang",
  "Physical_Appearance": "Detailed description: majestic, ancient, war-torn, strategically significant, historically accurate (reflecting specific periods like Dai Viet, Mongol Empire, French Colonial era), cinematic in scope, grand, dramatic, reflecting the power and struggle of historical events. Emphasize details like muddy terrain, ancient architecture, natural strategic features (mountains, rivers).",
  "Age_Life_Stage": "The historical context of the environment: Ancient Warfare, Medieval Empire, Dynastic Period, Colonial Resistance, Modern Conflict, Timeless Heroism.",
  "Height_Size": "The scale of the space: vast open battlefield, imposing fortress walls, intimate war council chamber, sprawling strategic landscape (mountains, forests, rivers). Scale should be epic and grand for battle scenes, focused and historically detailed for close-ups or strategic discussions.",
  "Accessories_Elements": "Secondary elements: ancient weaponry (swords, spears, crossbows), military standards and banners, period-accurate armor and uniforms, historical maps, strategic models, royal regalia, battlefield debris (broken shields, arrows), natural elements (rivers, mountains, forests) that played strategic roles, simple yet historically accurate tools of the era, elements depicting the raw chaos and might of conflict.",
  "Distinctive_Features": "A unique highlight: a sense of epic scale, brutal realism of war, strategic brilliance, national defiance, the weight of historical legacy, dramatic historical turning point, evidence of great sacrifice or triumph.",
  "Atmosphere_Personality": "The mood, feeling: epic, dramatic, intense, tragic, heroic, solemn, strategic, awe-inspiring, historically weighty, imbued with national pride, reflecting both the glory and tragedy of war, often grim but inspiring.",
  "Lighting_Color_Palette": "Lighting and dominant color scheme: dramatic high-contrast lighting, often dark and moody, earthy tones (browns, greens, grays), ominous overcast skies, fiery glows from battles, deep blues and reds for intensity. Emphasize cinematic lighting, suitable for high-quality historical reenactments and digital paintings.",
  "Era": "The specific historical context: Ancient Vietnamese Dynasties, Medieval Asian Warfare, Ming Invasion Period, French Colonial Era Conflicts, American War in Vietnam.",
  "Art_Style_Lock": "Hyper-realistic cinematic, high-quality 3D animated reconstruction, historically accurate digital painting style, suitable for an epic historical documentary/reenactment channel. Focus on grandeur, realism, and emotional impact, mirroring the visual style of historical 'War Movie' trailers."
}

INPUT SCRIPT:
---
${scriptText}
---`;
        const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { environment_id: { type: Type.STRING }, Name_ID: { type: Type.STRING }, Physical_Appearance: { type: Type.STRING }, Age_Life_Stage: { type: Type.STRING }, Height_Size: { type: Type.STRING }, Accessories_Elements: { type: Type.STRING }, Distinctive_Features: { type: Type.STRING }, Atmosphere_Personality: { type: Type.STRING }, Lighting_Color_Palette: { type: Type.STRING }, Era: { type: Type.STRING }, Art_Style_Lock: { type: Type.STRING } }, required: ["environment_id", "Name_ID"] }};
        const result = await runGeneration("Tạo Environment ID", prompt, schema);
        if (result) setState({ environments: result });
    };

    const handleGenerateTrailer = async () => {
        const channelName = getToolState('history-topic')?.channelName || 'HistoryWhy';
        const characterInput = characters.length > 0
            ? `- Character IDs: ${characters.map(c => c.character_id).join(', ')}`
            : `- Character IDs: Not provided. You must infer relevant character archetypes (e.g., commander, soldier, civilian) directly from the script.`;
        const environmentInput = environments.length > 0
            ? `- Environment IDs: ${environments.map(e => e.environment_id).join(', ')}`
            : `- Environment IDs: Not provided. You must infer relevant environments (e.g., battlefield, court, village) directly from the script.`;
        const consistencyGuideline = characters.length > 0
            ? `- **Consistency:** Must utilize the provided \`Character IDs\` and \`Environment IDs\` to ensure visual consistency and historical authenticity across scenes. The visuals should reflect \`${channelName}\`'s commitment to cinematic drama and meticulous historical detail.`
            : `- **Consistency:** Since IDs are not provided, you must infer characters and environments from the script and maintain consistency for these inferred elements throughout the trailer. The visuals should reflect \`${channelName}\`'s commitment to cinematic drama and meticulous historical detail.`;

        const prompt = `ROLE:
You are a professional Epic Historical War Movie Trailer Director and an AI Prompt Engineer for the YouTube channel \`${channelName}\`. Your mission is to craft a compelling and highly structured trailer script that perfectly synchronizes an epic voice-over with visually stunning, historically accurate reenactments and motion graphics, strictly adhering to the channel's signature cinematic, heroic, and deeply analytical style as outlined in its content strategy. The trailer must generate maximum anticipation, convey the immense scale, fierce determination, strategic brilliance, and profound historical significance of the main video, drawing inspiration from the "EPIC CRUSHED" content formula.

INPUTS:
- Voice Over Language: ${language}
- Target Trailer Duration: approximately ${trailerDuration} seconds.
${characterInput}
${environmentInput}
- Full Script: The complete script of the main historical video is provided for your detailed analysis. This script is the definitive source for extracting key dramatic moments, tactical insights, and emotional beats necessary for the trailer's narrative.

CORE GUIDELINES (MANDATORY):
1.  **Synchronization & Narrative:** Each scene MUST have a \`voice_over\` in \`${language}\` and a corresponding \`visual_prompt\` in **ENGLISH** that directly complement each other. The trailer must tell a condensed, yet powerful, narrative arc:
    *   **Dramatic Hook:** Start with an immediate, intense hook (question, shocking statement, overwhelming odds).
    *   **Introduction of Conflict:** Clearly establish the two opposing forces, their scale, and the imminent threat.
    *   **Highlighting Resolve & Strategy:** Showcase moments of Vietnamese ingenuity, bravery, and unique tactical brilliance.
    *   **Building Climax:** Hint at decisive, large-scale confrontations and the sheer intensity of the "WAR" without fully revealing the outcome.
    *   **Call to Witness:** Conclude with a powerful invitation to watch the full video, reinforcing the "EPIC" nature and historical impact.
    The trailer should evoke curiosity, awe, national pride, and a fervent desire to witness the full, "CRUSHED" story.
2.  **Voice Over:**
    -   Must be written in **${language}**.
    -   Each \`voice_over\` segment should be a short, powerful, and emotionally charged sentence or phrase (approximately 15-25 words). These sentences must embody \`${channelName}\`'s authoritative, dramatic, questioning, and proud tone. They should emphasize the scale of conflict (e.g., "500,000 Mongols"), overwhelming odds, heroic determination, strategic brilliance, and the profound historical stakes. Utilize strong verbs and evocative language to build suspense and national pride, echoing the "EPIC", "WAR", "CRUSHED/ĐÁNH BẠI TAN TÁC" themes without explicitly spoiling the entire plot.
    -   The narrative must present an impending grand historical conflict, highlight immense challenges, hint at the brutal intensity of war, and then pivot to ignite curiosity about how \`${channelName}\` will reveal the deeper truths, unique strategies, and the ultimate outcome, instilling awe and encouraging viewers to watch the full historical account.
3.  **Visual Prompt:**
    -   **Prompt Language:** Must be written in **ENGLISH** for optimal image/animation generation quality.
    -   **Art Style (MANDATORY): Hyper-realistic cinematic, grand, epic, historically accurate, high contrast dramatic lighting (dark, brooding skies; fiery battlegrounds; sharp sunlight on armor), deep and rich color palette (somber earth tones, metallic glints, stark reds of conflict), depicting intense historical reenactments, sweeping battle scenes, strategic animated maps, and formidable historical figures. Ultra high detail, 4K, sharp focus. Focus on conveying immense scale, fierce determination, tactical brilliance, raw combat intensity, and the gravity of historical events. AVOID overly bright, cartoonish, anachronistic, or light-hearted styles. Emphasize the 'EPIC', 'WAR', 'CRUSHED' themes through visually stunning and historically faithful storytelling.**
    -   ${consistencyGuideline}
    -   **Cinematography:** Each prompt must meticulously describe a cinematic camera angle (e.g., wide shot, tracking shot, close-up, aerial view), atmospheric lighting, and dramatic composition, emphasizing emotional depth, tactical clarity, and a clear narrative progression appropriate for an epic war documentary trailer.
    -   **No Prefixes:** The prompt must begin directly with the scene description.
    -   **Content Focus:** Focus on battle chaos, mass troop movements, heroic stances of key figures, strategic maps demonstrating decisive maneuvers, and close-ups revealing the grit and determination of warriors. While depicting the ferocity of battle, avoid gratuitous or sensationalized gore; instead, focus on the impact, strategy, and human element within the conflict.
4.  **Structure & Duration:**
    -   Create approximately 12-15 distinct scenes for the trailer.
    -   Estimate the \`duration\` (in seconds) for each scene. The total \`total_duration\` must be close to the \`Target Trailer Duration\`.
    -   Fill the other fields (\`transition\`, \`sfx\`, \`music\`) with suggestions appropriate for an epic, dramatic, and suspenseful war documentary trailer, building tension and culminating in a powerful climax, reflective of ancient/medieval warfare.

OUTPUT FORMAT (JSON REQUIRED):
- You MUST return a single JSON object with the following structure. The "start" field will be calculated later, so leave it as "00:00" for all scenes.

\`\`\`json
{
  "scenes": [
    {
      "start": "00:00",
      "duration": 5,
      "visual_prompt": "Hyper-realistic cinematic wide shot, 4K. A vast army of Mongol cavalry charges across a muddy plain under an ominous, overcast sky, banners flying, emphasizing overwhelming numbers and relentless advance. High contrast, historically accurate, digital painting.",
      "voice_over": "[This part MUST be in ${language}] \\"Một đế chế bất khả chiến bại, hàng triệu chiến binh... đang hướng về Đại Việt!\\"",
      "transition": "Quick cut to:",
      "sfx": "Distant thunderous hooves, ominous war drums begin to build",
      "music": "Dark, suspenseful orchestral score begins, low brass and strings"
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

        const characterInput = characters.length > 0
            ? `- Character IDs: ${characters.map(c => c.character_id).join(', ')}`
            : `- Character IDs: Not provided. You must infer relevant character archetypes from the script snippet.`;
        const environmentInput = environments.length > 0
            ? `- Environment IDs: ${environments.map(e => e.environment_id).join(', ')}`
            : `- Environment IDs: Not provided. You must infer relevant environments from the script snippet.`;
        const consistencyGuideline = characters.length > 0
            ? `- **Consistency:** You must use the provided IDs.`
            : `- **Consistency:** You must infer characters and environments from the script snippet and maintain consistency.`;
        
        const allPrompts: GeneratedImagePrompt[] = [];
        let sceneIdCounter = 1;

        try {
            for (let i = 0; i < parts.length; i++) {
                const partScript = parts[i].trim();
                const prompt = `ROLE:
You are an AI Film Director and professional Prompt Engineer, specializing in epic historical and military narratives, particularly the grand resistance wars of Vietnam. Your task is to convert each paragraph of a script part into a detailed image prompt, strictly adhering to a hyper-realistic, cinematic, and historically accurate style, using predefined Character_IDs and Environment_IDs if provided. The prompts must evoke a sense of awe, national pride, drama, and the intensity of warfare, conveying the channel's "epic, in-depth, and emotional storytelling" tone.

INPUTS:
${characterInput}
${environmentInput}
- Starting Scene ID: ${sceneIdCounter}
- Segment ID (Part Number): ${i + 1}
- Script Snippet: The specific script part to be converted.

CORE STYLE GUIDELINES (MANDATORY):
- **Art Style (MANDATORY): Hyper-realistic cinematic, historical reenactment, digital painting, or high-quality 3D rendering for battle scenes and animated maps. ABSOLUTELY NO simplified animation or cartoon styles.** The style must be GRAND, DRAMATIC, DETAILED, and EPIC, suitable for portraying monumental historical events and military confrontations.
- **Imagery & Expressions:** Generate powerful images depicting ancient Vietnamese warriors (e.g., Dai Viet, national heroes), invading forces (e.g., Mongols, Ming, French, American), epic battle scenes, strategic landscapes, and key historical moments. Expressions of characters should convey determination, bravery, stoicism, cunning, anger, or the harsh realities of war and leadership. Emphasize scale, intense conflict, strategic elements, and the emotional weight of historical events.
- **Lighting:** Use dramatic, high-contrast lighting to create an epic and intense atmosphere. Prioritize dark, strong colors, smoke, fire, and overcast skies to enhance the sense of historical conflict and gravity. Visuals should be "hùng tráng" (heroic/grand) and "chính xác" (accurate).
- **Quality:** Always add the keywords: ultra high detail, 4K, 8K, sharp focus, professional digital painting, cinematic masterpiece, historical accuracy.
${consistencyGuideline}

SAFETY RULES (CRITICAL - MUST COMPLY):
- **Historical Dignity:** When depicting historical conflicts, focus on the heroism, strategy, and significant moments rather than gratuitous violence. Battles should be shown as intense and realistic but always with artistic and historical integrity, emphasizing courage and tactics.
- **Respect for Cultures:** Ensure all depictions of historical figures, armies, and cultures are respectful and accurate.
- **Focus on Impact and Story:** Prioritize imagery that conveys the scale, impact, and a emotional weight of historical events, battles, and the people involved, aligning with the channel's mission to tell "vĩ đại" (great) stories.
- **Compliance with AI Safety Policies:** All prompts must be safe for work and adhere to generative AI policies against harmful or explicit content.

PROCESS:
1.  **Count Paragraphs:** First, you must count the number of paragraphs in the 'SCRIPT SNIPPET' provided below. A "paragraph" is defined as any block of text separated by a newline.
2.  **One-to-One Mapping (CRITICAL):** For EACH paragraph you counted, you MUST generate exactly ONE corresponding JSON object. The number of objects in the final JSON array must EXACTLY match the number of paragraphs in the input script.
3.  Each prompt must describe a cinematic camera angle (wide shot, close-up, aerial view, etc.) that fits the content of its corresponding paragraph and the channel's epic style. For strategic discussions, incorporate animated maps or detailed tactical views as described in the Battle Plan.
4.  The prompt MUST NOT start with labels like "Prompt:", "Scene:", "Image:". Start directly with the description.

OUTPUT FORMAT (MANDATORY):
- You MUST return a JSON array of objects. **The number of objects in this array must EXACTLY match the number of paragraphs in the input 'SCRIPT SNIPPET'.** Each object must have the following structure:
{
  "scene_id": "Sequential scene number, starting from ${sceneIdCounter}",
  "segment_id": ${i + 1},
  "characters": ["Array of character_ids relevant to the scene. If IDs were not provided, list inferred archetypes like 'VietnameseCommander', 'MongolSoldier'."],
  "environment": ["Array of environment_ids relevant to the scene. If IDs were not provided, list inferred environments like 'RiverBattlefield', 'RoyalCourt'."],
  "prompt_image": "The detailed, cinematic, historically accurate image prompt string based on the paragraph."
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
        if (!scriptText || !outlineText) return;
        updateToolState('history-creative', { scriptText, outlineText, language, imagePrompts });
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
                        <button onClick={getButtonAction('Tạo Character ID', handleGenerateCharacters)} disabled={isButtonDisabled('Tạo Character ID')} className={actionButtonClass('Tạo Character ID')}>
                           {getButtonContent('Tạo Character ID', '1. Tạo Character ID')}
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
                    <div className="summary-box"><h4>Characters</h4><p className={themeColors.text}>{characters.length}</p></div>
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
                    <ResultPanel title="Characters" data={characters} themeColors={themeColors}>
                        {characters.map((c) => <p key={c.character_id} className="text-xs italic text-zinc-500 border-b dark:border-zinc-700 last:border-b-0 py-2">{c.Name_ID} ({c.character_id})</p>)}
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

export default HistoryImageAssetsGenerator;