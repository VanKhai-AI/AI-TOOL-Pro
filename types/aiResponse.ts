import { type TopicIdea, type Outline, type GeneratedScriptPart, type ThumbnailConcept, type ThumbnailPrompt, type TrailerData } from '../types';

export interface TopicGenerationResponse {
    topics: TopicIdea[];
}

export interface OutlineGenerationResponse {
    outline: Outline;
}

export interface ScriptGenerationResponse {
    scriptPart: GeneratedScriptPart;
}

export interface TrailerResponse {
    trailerData: TrailerData;
}

export interface SeoPackageDescription {
    hook?: string;
    content?: string;
    timestamps?: string;
    cta?: string;
    links?: string;
    disclaimer?: string;
}

export interface RawSeoPackage {
    titleOptions: string[];
    description: SeoPackageDescription;
    hashtags: string[];
    tags: string[];
    checklist: string[];
}

export interface SeoPackageResponse {
    seoPackage: RawSeoPackage;
}

export interface ThumbnailConceptsResponse {
    thumbnailConcepts: ThumbnailConcept[];
}

export interface ThumbnailPromptsResponse {
    thumbnailPrompts: ThumbnailPrompt[];
}

export interface PostProductionNotesResponse {
    postProductionNotes: string;
}

export interface CreativesGenerationResponse {
    thumbnailConcepts: ThumbnailConcept[];
    thumbnailPrompts: ThumbnailPrompt[];
    postProductionNotes: string;
    seoPackage: RawSeoPackage;
}