import React from 'react';
import { AITool, AIToolCategory, AIToolCombo, LanguageCode } from './types';

export const getToolThemeColors = (category: AIToolCategory) => {
  switch (category) {
    case 'AI Lịch sử':
      return {
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500',
        hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-600',
        buttonGradient: 'from-amber-500 to-orange-600',
        buttonSolid: 'bg-orange-600 hover:bg-orange-700',
        selectedBg: 'bg-amber-50 dark:bg-amber-900/30',
        accent: 'accent-amber-500',
        ring: 'focus:ring-amber-500',
        focusBorder: 'focus:border-amber-500'
      };
    case 'AI Giáo dục/Giải trí':
      return {
        text: 'text-teal-600 dark:text-teal-400',
        border: 'border-teal-500',
        hoverBorder: 'hover:border-teal-400 dark:hover:border-teal-600',
        buttonGradient: 'from-teal-500 to-cyan-600',
        buttonSolid: 'bg-cyan-600 hover:bg-cyan-700',
        selectedBg: 'bg-teal-50 dark:bg-teal-900/30',
        accent: 'accent-teal-500',
        ring: 'focus:ring-teal-500',
        focusBorder: 'focus:border-teal-500'
      };
    case 'Nghiên cứu & Phân tích':
    default:
      return {
        text: 'text-sky-600 dark:text-sky-400',
        border: 'border-sky-500',
        hoverBorder: 'hover:border-sky-400 dark:hover:border-sky-600',
        buttonGradient: 'from-sky-600 to-indigo-600',
        buttonSolid: 'bg-indigo-600 hover:bg-indigo-700',
        selectedBg: 'bg-sky-50 dark:bg-sky-900/30',
        accent: 'accent-sky-500',
        ring: 'focus:ring-sky-500',
        focusBorder: 'focus:border-sky-500'
      };
  }
};


export const AI_TOOLS: AITool[] = [
  // AI Lịch sử
  {
    id: 'history-topic',
    title: '1. Tạo Chủ Đề Lịch Sử',
    description: 'Tạo các ý tưởng video lịch sử hùng tráng, đậm chất điện ảnh và được tối ưu hóa cho YouTube.',
    icon: <i className="fas fa-lightbulb"></i>,
    color: 'from-amber-500 to-orange-500',
    category: 'AI Lịch sử',
    label: { text: 'Gemini/Google Ai Studio', bgColor: 'bg-red-600', textColor: 'text-white' },
  },
  {
    id: 'history-outline',
    title: '2. Tạo Dàn Ý Lịch Sử',
    description: 'Xây dựng một dàn ý 5 phần chi tiết, có cấu trúc tường thuật điện ảnh cho chủ đề của bạn.',
    icon: <i className="fas fa-sitemap"></i>,
    color: 'from-amber-500 to-orange-500',
    category: 'AI Lịch sử',
    label: { text: 'Gemini/Google Ai Studio', bgColor: 'bg-red-600', textColor: 'text-white' },
  },
  {
    id: 'history-script',
    title: '3. Tạo Kịch Bản Lịch Sử',
    description: 'Tự động viết kịch bản tường thuật chi tiết, hấp dẫn dựa trên dàn ý đã tạo.',
    icon: <i className="fas fa-file-alt"></i>,
    color: 'from-amber-500 to-orange-500',
    category: 'AI Lịch sử',
    label: { text: 'Gemini/Google Ai Studio', bgColor: 'bg-red-600', textColor: 'text-white' },
  },
  {
    id: 'history-image-assets',
    title: '4. Tạo Tài Sản Hình Ảnh',
    description: 'Tạo hồ sơ nhân vật & môi trường, kịch bản trailer, và prompt hình ảnh cho toàn bộ kịch bản.',
    icon: <i className="fas fa-images"></i>,
    color: 'from-amber-500 to-orange-500',
    category: 'AI Lịch sử',
    label: { text: 'Gemini/Google Ai Studio', bgColor: 'bg-red-600', textColor: 'text-white' },
  },
   {
    id: 'history-character-id', // New ID
    title: 'Tạo Hồ sơ Nhân vật Lịch sử',
    description: 'Phân tích kịch bản để tạo hồ sơ chi tiết cho các nhân vật, đơn vị quân đội hoặc các hình mẫu lịch sử.',
    icon: <i className="fas fa-user-shield"></i>,
    color: 'from-amber-500 to-orange-500',
    category: 'AI Lịch sử',
    isPromptOnly: true, 
  },
  {
    id: 'history-environment-id', // New ID
    title: 'Tạo Hồ sơ Môi trường Lịch sử',
    description: 'Phân tích kịch bản để tạo hồ sơ chi tiết cho các môi trường quan trọng như chiến trường, cung điện.',
    icon: <i className="fas fa-landmark"></i>,
    color: 'from-amber-500 to-orange-500',
    category: 'AI Lịch sử',
    isPromptOnly: true,
  },
  {
    id: 'history-trailer-prompt', // New ID for clarity
    title: 'Tạo Kịch bản Trailer Lịch sử',
    description: 'Tạo kịch bản trailer điện ảnh từ kịch bản đầy đủ, bao gồm lời thoại và gợi ý hình ảnh.',
    icon: <i className="fas fa-film"></i>,
    color: 'from-amber-500 to-orange-500',
    category: 'AI Lịch sử',
    isPromptOnly: true,
  },
  {
    id: 'history-creative',
    title: '5. Tạo Nội Dung Sáng Tạo',
    description: 'Hoàn thiện video với gói SEO, ý tưởng thumbnail, và các tài sản marketing khác.',
    icon: <i className="fas fa-wand-magic-sparkles"></i>,
    color: 'from-amber-500 to-orange-500',
    category: 'AI Lịch sử',
    label: { text: 'Gemini/Google Ai Studio', bgColor: 'bg-red-600', textColor: 'text-white' },
  },
  // AI Giáo dục/Giải trí
  {
    id: 'edutainment-topic',
    title: '1. Tạo Chủ Đề Edutainment',
    description: 'Brainstorm các chủ đề video khoa học và giải thích hấp dẫn, được tối ưu hóa để khơi gợi sự tò mò.',
    icon: <i className="fas fa-flask"></i>,
    color: 'from-teal-500 to-cyan-500',
    category: 'AI Giáo dục/Giải trí',
    label: { text: 'Gemini/Google Ai Studio', bgColor: 'bg-blue-600', textColor: 'text-white' },
  },
  {
    id: 'edutainment-outline',
    title: '2. Tạo Dàn Ý Edutainment',
    description: 'Chuyển đổi ý tưởng của bạn thành một dàn ý có cấu trúc để giải thích các chủ đề phức tạp một cách rõ ràng.',
    icon: <i className="fas fa-list-alt"></i>,
    color: 'from-teal-500 to-cyan-500',
    category: 'AI Giáo dục/Giải trí',
    label: { text: 'Gemini/Google Ai Studio', bgColor: 'bg-blue-600', textColor: 'text-white' },
  },
  {
    id: 'edutainment-script',
    title: '3. Tạo Kịch Bản Edutainment',
    description: 'Tự động viết một kịch bản tường thuật hấp dẫn, dễ hiểu từ dàn ý của bạn.',
    icon: <i className="fas fa-feather-alt"></i>,
    color: 'from-teal-500 to-cyan-500',
    category: 'AI Giáo dục/Giải trí',
    label: { text: 'Gemini/Google Ai Studio', bgColor: 'bg-blue-600', textColor: 'text-white' },
  },
  {
    id: 'edutainment-image-assets',
    title: '4. Tạo Tài Sản Hình Ảnh',
    description: 'Tạo hồ sơ concept, kịch bản trailer và prompt hình ảnh theo phong cách infographic sống động.',
    icon: <i className="fas fa-palette"></i>,
    color: 'from-teal-500 to-cyan-500',
    category: 'AI Giáo dục/Giải trí',
    label: { text: 'Gemini/Google Ai Studio', bgColor: 'bg-blue-600', textColor: 'text-white' },
  },
  {
    id: 'edutainment-character-id', // New ID
    title: 'Tạo Hồ sơ Concept/Nhân vật Edutainment',
    description: 'Phân tích kịch bản để tạo hồ sơ cho các nhân vật, linh vật hoặc các khái niệm trừu tượng.',
    icon: <i className="fas fa-puzzle-piece"></i>,
    color: 'from-teal-500 to-cyan-500',
    category: 'AI Giáo dục/Giải trí',
    isPromptOnly: true,
  },
  {
    id: 'edutainment-environment-id', // New ID
    title: 'Tạo Hồ sơ Môi trường Edutainment',
    description: 'Phân tích kịch bản để tạo hồ sơ chi tiết cho các môi trường, bối cảnh trừu tượng.',
    icon: <i className="fas fa-vector-square"></i>,
    color: 'from-teal-500 to-cyan-500',
    category: 'AI Giáo dục/Giải trí',
    isPromptOnly: true,
  },
  {
    id: 'edutainment-trailer-prompt', // New ID
    title: 'Tạo Kịch bản Trailer Edutainment',
    description: 'Tạo kịch bản trailer nhanh, khơi gợi sự tò mò, bao gồm lời thoại và gợi ý hình ảnh.',
    icon: <i className="fas fa-video"></i>,
    color: 'from-teal-500 to-cyan-500',
    category: 'AI Giáo dục/Giải trí',
    isPromptOnly: true,
  },
  {
    id: 'edutainment-creative',
    title: '5. Tạo Nội Dung Sáng Tạo',
    description: 'Tạo gói SEO, ý tưởng thumbnail bắt mắt và các tài sản marketing khác cho video của bạn.',
    icon: <i className="fas fa-bullhorn"></i>,
    color: 'from-teal-500 to-cyan-500',
    category: 'AI Giáo dục/Giải trí',
    label: { text: 'Gemini/Google Ai Studio', bgColor: 'bg-blue-600', textColor: 'text-white' },
  },
  // Research & Analysis
  {
    id: 'fact-checker',
    title: 'Trình kiểm tra sự thật',
    description: 'Xác minh các tuyên bố bằng cách sử dụng Google Search và cung cấp các nguồn đáng tin cậy.',
    icon: <i className="fas fa-check-double"></i>,
    color: 'from-sky-500 to-indigo-500',
    category: 'Nghiên cứu & Phân tích',
    label: { text: 'Google Search', bgColor: 'bg-green-600', textColor: 'text-white' },
  },
  {
    id: 'text-summarizer',
    title: 'Trình tóm tắt văn bản',
    description: 'Tóm tắt các bài báo, tài liệu hoặc văn bản dài thành các điểm chính hoặc một đoạn văn ngắn gọn.',
    icon: <i className="fas fa-compress-alt"></i>,
    color: 'from-sky-500 to-indigo-500',
    category: 'Nghiên cứu & Phân tích',
  },
];

// Constants for History AI tool
export const TOPIC_GENERATOR_MODEL = 'gemini-2.5-flash';
export const SCRIPT_GENERATOR_MODEL = 'gemini-2.5-flash';

export const SUPPORTED_LANGUAGES: { name: string, code: LanguageCode }[] = [
    { name: 'Tiếng Việt', code: 'VI' },
    { name: 'English', code: 'EN' },
    { name: 'Français', code: 'FR' },
    { name: 'Deutsch', code: 'DE' },
    { name: 'Español', code: 'ES' },
];

export const getLanguageName = (code: LanguageCode): string => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code)?.name || 'Unknown Language';
}