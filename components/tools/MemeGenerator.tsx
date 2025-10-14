import React, { useState, useRef, useEffect } from 'react';
import { Modality } from '@google/genai';
import { AI_TOOLS, getToolThemeColors } from '../../constants';
import ToolLayout from './common/ToolLayout';
import Input from './common/Input';
import { useToolState } from '../../contexts/ToolStateContext';
import useGeminiApi from '../../hooks/useGeminiApi';
import Spinner from '../ui/Spinner';
import { DownloadIcon } from '../ui/Icon';

const MemeGenerator: React.FC = () => {
    const toolId = 'meme-generator';
    const tool = AI_TOOLS.find(t => t.id === toolId)!;
    const themeColors = getToolThemeColors(tool.category);
    const { getToolState, updateToolState } = useToolState();
    const state = getToolState(toolId);
    const { 
        imagePrompt = 'A cat wearing sunglasses and a gold chain',
        topText = 'I HAVE THE POWER',
        bottomText = 'OF AI AND ANIME ON MY SIDE',
        generatedImage = null
    } = state;

    const { isLoading, error, result, generate, cancel } = useGeminiApi();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const drawMeme = (base64Image: string) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const img = new Image();
        img.src = `data:image/png;base64,${base64Image}`;
        img.onload = () => {
            // Set canvas size to match image
            const aspectRatio = img.width / img.height;
            const maxWidth = 800;
            canvas.width = Math.min(img.width, maxWidth);
            canvas.height = canvas.width / aspectRatio;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Text styling
            const fontSize = Math.floor(canvas.width / 10);
            ctx.font = `bold ${fontSize}px Anton, sans-serif`;
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = fontSize / 20;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            // Draw top text
            if (topText) {
                const x = canvas.width / 2;
                const y = canvas.height * 0.05;
                ctx.strokeText(topText.toUpperCase(), x, y);
                ctx.fillText(topText.toUpperCase(), x, y);
            }

            // Draw bottom text
            ctx.textBaseline = 'bottom';
            if (bottomText) {
                const x = canvas.width / 2;
                const y = canvas.height * 0.95;
                ctx.strokeText(bottomText.toUpperCase(), x, y);
                ctx.fillText(bottomText.toUpperCase(), x, y);
            }
        };
    };

    useEffect(() => {
        if (result && result.candidates?.[0]?.content?.parts) {
            for (const part of result.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64Image = part.inlineData.data;
                    updateToolState(toolId, { generatedImage: base64Image });
                    drawMeme(base64Image);
                    return;
                }
            }
        }
    }, [result]);

    // Redraw canvas if text or image changes
    useEffect(() => {
        if (generatedImage) {
            drawMeme(generatedImage);
        }
    }, [topText, bottomText, generatedImage]);

    const handleGenerate = () => {
        if (!imagePrompt) return;
        updateToolState(toolId, { generatedImage: null, error: null });
        generate({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: imagePrompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
    };
    
    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'ai-hub-meme.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    return (
        <ToolLayout
            tool={tool}
            language="vi"
            setLanguage={() => {}}
            getPrompt={() => `Generate an image for a meme: ${imagePrompt}`}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <Input
                        id="imagePrompt"
                        label="Ý tưởng hình ảnh Meme"
                        value={imagePrompt}
                        onChange={(e) => updateToolState(toolId, { imagePrompt: e.target.value })}
                        placeholder="VD: Một con mèo đeo kính râm và dây chuyền vàng"
                        ringColorClass={themeColors.ring}
                    />
                    <Input
                        id="topText"
                        label="Văn bản trên"
                        value={topText}
                        onChange={(e) => updateToolState(toolId, { topText: e.target.value })}
                        ringColorClass={themeColors.ring}
                    />
                    <Input
                        id="bottomText"
                        label="Văn bản dưới"
                        value={bottomText}
                        onChange={(e) => updateToolState(toolId, { bottomText: e.target.value })}
                        ringColorClass={themeColors.ring}
                    />
                    <button
                        onClick={isLoading ? cancel : handleGenerate}
                        disabled={!imagePrompt}
                        className={`w-full flex justify-center items-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:from-zinc-500 disabled:to-zinc-400 disabled:opacity-100 disabled:cursor-not-allowed ${
                            isLoading 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : `bg-gradient-to-br ${themeColors.buttonGradient} hover:opacity-90`
                        }`}
                    >
                        {isLoading ? <><Spinner/> Đang tạo...</> : 'Tạo Meme'}
                    </button>
                    {generatedImage && !isLoading && (
                        <button
                            onClick={handleDownload}
                            className="w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                        >
                           <DownloadIcon /> Tải xuống Meme
                        </button>
                    )}
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-center items-center min-h-[300px] shadow-inner">
                    {isLoading && <Spinner />}
                    {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
                    {!isLoading && !error && (
                        <canvas
                            ref={canvasRef}
                            className={`w-full h-auto rounded-md ${generatedImage ? '' : 'hidden'}`}
                        />
                    )}
                    {!isLoading && !error && !generatedImage && (
                        <div className="text-center text-gray-500 dark:text-gray-400">
                            <i className="fas fa-image text-5xl mb-4"></i>
                            <p>Meme của bạn sẽ xuất hiện ở đây</p>
                        </div>
                    )}
                </div>
            </div>
        </ToolLayout>
    );
};

export default MemeGenerator;
