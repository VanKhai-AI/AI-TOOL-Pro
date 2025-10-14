import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define types for grounding metadata
// FIX: Updated GroundingChunk types to match the SDK, making properties optional to resolve type conflicts.
interface GroundingChunkWeb {
  uri?: string;
  title?: string;
}

interface GroundingChunk {
  web?: GroundingChunkWeb;
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

interface ResultDisplayProps {
  isLoading: boolean;
  result: string | null;
  error: string | null;
  groundingMetadata?: GroundingMetadata | null;
  imageResult?: string | null;
  onClear?: () => void;
}

// Custom hook to handle dropdown logic (open/close, click outside)
const useDropdown = (initialState = false) => {
    const [isOpen, setIsOpen] = useState(initialState);
    const ref = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return { ref, isOpen, setIsOpen };
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ isLoading, result, error, groundingMetadata, imageResult, onClear }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { ref: downloadRef, isOpen: downloadOpen, setIsOpen: setDownloadOpen } = useDropdown();

  const isTableContent = result?.includes('|---');

  const getPlainText = () => {
    if (!result) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = marked(result) as string;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  const handleCopy = () => {
    const text = getPlainText();
    if (text) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const triggerDownload = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    const plainText = getPlainText();
    if (plainText) {
      const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
      triggerDownload('ai-hub-result.txt', blob);
    }
    setDownloadOpen(false);
  };

  const handleDownloadCsv = () => {
    if (!result) return;
    
    const lines = result.trim().split('\n');
    const tableLines = lines.filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
    const contentLines = tableLines.filter(line => !line.match(/\|-{3,}\|/));
    
    if (contentLines.length === 0) return;

    const csvRows = contentLines.map(row => {
        const cells = row.split('|').slice(1, -1).map(cell => cell.trim());
        return cells.map(cell => {
            if (cell.includes(',') || cell.includes('"')) {
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        }).join(',');
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    triggerDownload('ai-hub-result.csv', blob);
    setDownloadOpen(false);
  };
  
  const handleDownloadPdf = () => {
      if (!result) return;
      
      const doc = new jsPDF();
      
      if (isTableContent) {
          const tableData = (() => {
              const lines = result.trim().split('\n');
              const tableLines = lines.filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
              const headerLineIndex = tableLines.findIndex(line => line.match(/\|.*-.*\|/));
              if (headerLineIndex <= 0) return null;

              const header = tableLines[headerLineIndex - 1].split('|').slice(1, -1).map(cell => cell.trim());
              const body = tableLines.slice(headerLineIndex + 1).map(row => 
                  row.split('|').slice(1, -1).map(cell => cell.trim())
              );
              return { head: [header], body };
          })();

          if (tableData) {
              autoTable(doc, tableData);
          } else { // Fallback for malformed tables
             const textLines = doc.splitTextToSize(getPlainText(), 180);
             doc.text(textLines, 10, 10);
          }
      } else {
          const textLines = doc.splitTextToSize(getPlainText(), 180);
          doc.text(textLines, 10, 10);
      }
      
      doc.save('ai-hub-result.pdf');
      setDownloadOpen(false);
  };


  if (isLoading) {
    return (
      <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse shadow-inner">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-6 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg shadow-md">
        <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-2">Đã xảy ra lỗi</h3>
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!result && !imageResult) {
    return null;
  }
  
  const formattedResult = result ? { __html: marked(result) as string } : null;
  const sources = groundingMetadata?.groundingChunks?.filter(chunk => chunk.web && chunk.web.uri);

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Kết quả</h3>
        <div className="flex items-center gap-2">
            {onClear && (
               <button
                  onClick={onClear}
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  <i className="fas fa-times"></i>
                  Xóa
                </button>
            )}
            {result && (
              <>
                <button
                  onClick={handleCopy}
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  <i className={isCopied ? "fas fa-check text-green-500" : "fas fa-copy"}></i>
                  {isCopied ? 'Đã sao chép!' : 'Sao chép'}
                </button>
                <div className="relative" ref={downloadRef}>
                    <button
                        onClick={() => setDownloadOpen(!downloadOpen)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-colors"
                        aria-label="Tải xuống kết quả"
                        aria-haspopup="true"
                        aria-expanded={downloadOpen}
                    >
                        <i className="fas fa-download"></i>
                        Tải xuống
                        <i className={`fas fa-chevron-down text-xs transition-transform ${downloadOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                    {downloadOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 animate-fade-in-down">
                            <ul className="py-1 text-sm text-gray-700 dark:text-gray-300">
                                <li><a href="#" onClick={(e) => {e.preventDefault(); handleDownloadTxt()}} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">Tải xuống dưới dạng .TXT</a></li>
                                {isTableContent && (
                                    <li><a href="#" onClick={(e) => {e.preventDefault(); handleDownloadCsv()}} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">Tải xuống dưới dạng .CSV</a></li>
                                )}
                                <li><a href="#" onClick={(e) => {e.preventDefault(); handleDownloadPdf()}} className="block px-4 py-2 hover:bg-gray-800">Tải xuống dưới dạng .PDF</a></li>
                            </ul>
                        </div>
                    )}
                </div>
              </>
            )}
        </div>
      </div>

      {imageResult && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-center items-center mb-4 shadow-inner">
          <img 
            src={`data:image/png;base64,${imageResult}`} 
            alt="Generated Mascot" 
            className="max-w-full max-h-96 rounded-md"
          />
        </div>
      )}

      {formattedResult && (
        <div 
          className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-h-[60vh] overflow-y-auto shadow-inner" 
          dangerouslySetInnerHTML={formattedResult} 
        />
      )}

       {sources && sources.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Nguồn tham khảo</h4>
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2 shadow-md">
            {sources.map((source, index) => (
              <div key={index} className="flex items-start gap-3">
                <i className="fas fa-link text-gray-400 dark:text-gray-500 pt-1"></i>
                <div>
                  {/* FIX: Added non-null assertions as the filter ensures these properties exist. */}
                  <a 
                    href={source.web!.uri!} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium break-all"
                  >
                    {source.web!.title || source.web!.uri!}
                  </a>
                   <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{source.web!.uri!}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;