import React, { useState } from 'react';

const AccordionItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-200 dark:border-gray-800 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full py-5 text-left"
            >
                <span className="text-lg font-medium text-gray-900 dark:text-white">{title}</span>
                <i className={`fas fa-chevron-down transform transition-transform text-gray-600 dark:text-gray-400 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-96' : 'max-h-0'
                }`}
            >
                <div className="pb-5 text-gray-600 dark:text-gray-400">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Help: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto animate-fade-in-down">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">Trung tâm trợ giúp</h2>
            
            <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-lg p-8 shadow-md">
                <AccordionItem title="AI Hub là gì?">
                    <p>AI Hub là một bộ công cụ mạnh mẽ được hỗ trợ bởi AI, được thiết kế để hỗ trợ những người sáng tạo nội dung trong các nhiệm vụ khác nhau như viết kịch bản, nghiên cứu, tạo ý tưởng, v.v.</p>
                </AccordionItem>
                <AccordionItem title="Làm cách nào để sử dụng một công cụ?">
                    <p>Chỉ cần điều hướng đến trang 'Công cụ' từ thanh bên, chọn công cụ bạn muốn sử dụng, điền vào các trường bắt buộc và nhấp vào nút tạo. AI sẽ xử lý yêu cầu của bạn và cung cấp kết quả.</p>
                </AccordionItem>
                <AccordionItem title="Các công cụ 'Sắp ra mắt' là gì?">
                    <p>Đây là những công cụ mà chúng tôi hiện đang phát triển. Chúng sẽ được phát hành trong các bản cập nhật trong tương lai. Hãy theo dõi!</p>
                </AccordionItem>
            </div>
        </div>
    );
};

export default Help;