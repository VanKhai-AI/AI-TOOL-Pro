import type React from 'react';

export type AIToolCategory = 'AI Lịch sử' | 'AI Giáo dục/Giải trí' | 'Nghiên cứu & Phân tích' | 'AI Sáng tạo' | 'AI Meme';

export interface AIToolLabel {
  text: string;
  bgColor: string;
  textColor: string;
}

export interface AITool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  color: string;
  category: AIToolCategory;
  label?: AIToolLabel;
  isPromptOnly?: boolean;
}

export interface AIToolCombo {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tools: string[]; // Array of AITool IDs
}

export type Theme = 'light' | 'dark';

// Types for Edutainment AI tools
export interface EdutainmentTrendAnalysis {
  mainKeywords: string[];
  attractionReason: string;
  attractionReasonVI: string;
}

export interface EdutainmentEffectivenessAnalysis {
  curiosityHook: string;
  learningValue: string;
  visualPotential: string;
  simplificationPower: string;
}

export interface TopicIdea {
  proposedTitle: string;
  proposedTitleVI: string;
  trendAnalysis: EdutainmentTrendAnalysis;
  effectivenessAnalysis: EdutainmentEffectivenessAnalysis;
}


export interface OutlinePart {
  partTitle: string;
  words: number;
  paragraphs: number;
  description: string;
}

export interface Outline {
  mainTitle: string;
  parts: OutlinePart[];
}

export interface TrailerPrompt {
  textNote: string;
  imagePrompt: string;
}
export interface TrailerData {
  trailerVoiceover: string[];
  prompts: TrailerPrompt[];
}
export interface ThumbnailPrompt {
  textNote: string;
  imagePrompt: string;
}

// API Key Management
export type APIKeyStatus = 'unchecked' | 'active' | 'error';
export interface APIKey {
  id: string;
  key: string;
  status: APIKeyStatus;
  lastChecked: string | null;
  errorCount: number;
}

// Types for History AI tool
export type LanguageCode = 'VI' | 'EN' | 'FR' | 'DE' | 'ES';

// TAB 1: TOPIC
export interface TopicTrendAnalysis {
  mainKeywords: string[];
  attractionReason: string;
  attractionReasonVI: string;
}

export interface TopicEffectivenessAnalysis {
  asymmetry: string;
  strategicWit: string;
  spiritAndHeroism: string;
  survival: string;
}

export interface HistoryTopicIdea {
  proposedTitle: string;
  proposedTitleVI: string;
  trendAnalysis: TopicTrendAnalysis;
  effectivenessAnalysis: TopicEffectivenessAnalysis;
}


// TAB 2: OUTLINE
export interface HistoryOutlinePart {
  part: number;
  title: string;
  description: string;
  estimatedWords: number;
  estimatedParagraphs: number;
}

export interface HistoryOutline {
  title: string;
  parts: HistoryOutlinePart[];
}

// TAB 3: SCRIPT
export interface GeneratedScriptPart {
  partIndex: number;
  title: string;
  content: string;
  paragraphCount?: number;
}

// TAB 4: IMAGE ASSETS
export interface CharacterProfile {
  character_id: string;
  Name_ID: string;
  Physical_Appearance: string;
  Age_Life_Stage: string;
  Height_Size: string;
  Costume_Accessories: string;
  Distinctive_Features: string;
  Behavior_Personality: string;
  Skin_Tone: string;
  Era: string;
  Art_Style_Lock: string;
}

export interface EnvironmentProfile {
  environment_id: string;
  Name_ID: string;
  Physical_Appearance: string;
  Age_Life_Stage: string;
  Height_Size: string;
  Accessories_Elements: string;
  Distinctive_Features: string;
  Atmosphere_Personality: string;
  Lighting_Color_Palette: string;
  Era: string;
  Art_Style_Lock: string;
}

export interface TrailerScene {
  start: string;
  duration: number;
  visual_prompt: string;
  voice_over: string;
  transition: string;
  sfx: string;
  music: string;
}

export interface GeneratedTrailer {
  scenes: TrailerScene[];
  total_duration: number;
}

export interface GeneratedImagePrompt {
  scene_id: string;
  segment_id: number;
  characters: string[];
  environment: string[];
  prompt_image: string;
}

// FIX: Added missing ScriptPartImagePrompts type as it was being imported but not defined.
export interface ScriptPartImagePrompts {
  parts: {
    [partIndex: number]: {
      textNote: string;
      imagePrompt: string;
    }[];
  };
}


// TAB 5: CREATIVES
export interface ThumbnailConcept {
  name: string;
  textOverlay: string;
  description: string;
  finalPrompt: string;
}

export interface SeoTagCategories {
  "Chủ đề chính": string;
  "Sự kiện & Thời kỳ"?: string; // History specific
  "Nhân vật & Lãnh đạo"?: string; // History specific
  "Lĩnh vực & Chủ đề"?: string; // Edutainment specific
  "Khái niệm & Nguyên tắc"?: string; // Edutainment specific
  "Phong cách & Thể loại": string;
  "Tìm kiếm nâng cao": string;
}

export interface SeoPackage {
  titleOptions: string[];
  description: string;
  hashtags: string;
  tags: SeoTagCategories;
  checklist: string[];
}


// General Input types for state management
export interface TopicGeneratorInputs {
    topicCount: number;
    channelName: string;
    userTopic: string;
}

export interface ImagePromptGeneratorInputs {
    trailerDuration: number;
    includeTextNote: boolean;
}

export interface CreativesGeneratorInputs {
    channelName: string;
    nextVideo: string;
    playlist: string;
    disclaimer: boolean;
}