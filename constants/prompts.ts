// This file centralizes all prompts for the application.
// It exports two main objects:
// 1. TOOL_PROMPTS: Functions that generate the exact prompts used by the AI tools, inserting variables.
// 2. USER_FACING_PROMPTS: A dictionary of user-friendly prompts for the Prompt Library, with placeholders.

export const TOOL_PROMPTS = {
  'fact-checker': (claims: string, lang: 'vi' | 'en') => {
      const langSpecifics = lang === 'vi' 
          ? { 
              role: "Bạn là một người kiểm tra sự thật tỉ mỉ và khách quan.", 
              task: "Phân tích văn bản được cung cấp, xác định tất cả các tuyên bố có thể kiểm chứng được và sử dụng Google Search để xác minh tính chính xác của chúng.", 
              outputReq: "Tạo một bảng markdown chi tiết với 4 cột sau:", 
              columns: ["Tuyên bố", "Xếp hạng", "Phân tích", "Nguồn chính"], 
              ranks: `"Đúng", "Sai", "Gây hiểu lầm", "Không thể xác minh"`
            }
          : { 
              role: "You are a meticulous and objective fact-checker.", 
              task: "Analyze the provided text, identify all verifiable claims, and use Google Search to verify their accuracy.", 
              outputReq: "Generate a detailed markdown table with the following 4 columns:", 
              columns: ["Claim", "Rating", "Analysis", "Primary Source"], 
              ranks: `"True", "False", "Misleading", "Unverifiable"` 
            };
  
      return `
VAI TRÒ CỦA BẠN: ${langSpecifics.role}

NHIỆM VỤ CHÍNH: ${langSpecifics.task}

VĂN BẢN ĐỂ PHÂN TÍCH:
---
${claims}
---

YÊU CẦU ĐẦU RA:
${langSpecifics.outputReq}
- **${langSpecifics.columns[0]}:** Trích dẫn chính xác tuyên bố từ văn bản gốc.
- **${langSpecifics.columns[1]}:** Đánh giá tính chính xác của tuyên bố. Chỉ sử dụng một trong các xếp hạng sau: ${langSpecifics.ranks}.
- **${langSpecifics.columns[2]}:** Cung cấp một lời giải thích ngắn gọn, dựa trên bằng chứng cho xếp hạng của bạn. Giải thích tại sao tuyên bố đó đúng, sai hoặc gây hiểu lầm. Đối với các tuyên bố "Không thể xác minh", hãy giải thích tại sao không thể tìm thấy thông tin xác nhận.
- **${langSpecifics.columns[3]}:** Liệt kê MỘT nguồn đáng tin cậy nhất mà bạn đã sử dụng để xác minh.

QUY TẮC BẮT BUỘC:
- Chỉ đánh giá các tuyên bố khách quan, có thể kiểm chứng được. Bỏ qua các ý kiến, quan điểm chủ quan hoặc các tuyên bố mang tính suy đoán.
- Phân tích toàn bộ văn bản và không bỏ sót bất kỳ tuyên bố nào.
- Luôn giữ giọng điệu trung lập và khách quan trong phân tích của bạn.
`;
  },
  'text-summarizer': (textToSummarize: string, summaryFormat: 'paragraph' | 'bullets', lang: 'vi' | 'en') => {
      const langInstructions = lang === 'vi' 
          ? {
              task: "Tóm tắt văn bản sau đây một cách súc tích và chính xác.",
              formatParagraph: "Cung cấp một bản tóm tắt mạch lạc trong một đoạn văn duy nhất.",
              formatBullets: "Cung cấp một bản tóm tắt dưới dạng các gạch đầu dòng, nêu bật những điểm chính.",
              outputLang: "Toàn bộ bản tóm tắt phải bằng Tiếng Việt."
          }
          : {
              task: "Summarize the following text concisely and accurately.",
              formatParagraph: "Provide a coherent summary in a single paragraph.",
              formatBullets: "Provide a summary in the form of bullet points, highlighting the key takeaways.",
              outputLang: "The entire summary must be in English."
          };

      const formatInstruction = summaryFormat === 'bullets' ? langInstructions.formatBullets : langInstructions.formatParagraph;

      return `
VAI TRÒ: Bạn là một chuyên gia tóm tắt có khả năng chắt lọc thông tin phức tạp thành các bản tóm tắt rõ ràng và súc tích.

NHIỆM VỤ: ${langInstructions.task}

YÊU CẦU ĐỊNH DẠNG: ${formatInstruction}

NGÔN NGỮ ĐẦU RA: ${langInstructions.outputLang}

VĂN BẢN CẦN TÓM TẮT:
---
${textToSummarize}
---
`;
  },
  // Add other tool prompts here...
};


export const USER_FACING_PROMPTS: { [key: string]: { title: string; description: string; prompt: string } } = {
  'fact-checker': {
    title: 'Prompt Kiểm tra sự thật',
    description: 'Xác minh một loạt các tuyên bố bằng cách sử dụng Google Search và trình bày kết quả trong một bảng markdown.',
    prompt: `VAI TRÒ CỦA BẠN: Bạn là một người kiểm tra sự thật tỉ mỉ và khách quan.

NHIỆM VỤ CHÍNH: Phân tích văn bản được cung cấp, xác định tất cả các tuyên bố có thể kiểm chứng được và sử dụng Google Search để xác minh tính chính xác của chúng.

VĂN BẢN ĐỂ PHÂN TÍCH:
---
[Dán các tuyên bố hoặc đoạn văn bản của bạn vào đây. Ví dụ: "Mặt Trăng được làm từ phô mai. Bầu trời có màu xanh lá cây."]
---

YÊU CẦU ĐẦU RA:
Tạo một bảng markdown chi tiết với 4 cột sau:
- Tuyên bố: Trích dẫn chính xác tuyên bố từ văn bản gốc.
- Xếp hạng: Đánh giá tính chính xác của tuyên bố. Chỉ sử dụng một trong các xếp hạng sau: "Đúng", "Sai", "Gây hiểu lầm", "Không thể xác minh".
- Phân tích: Cung cấp một lời giải thích ngắn gọn, dựa trên bằng chứng cho xếp hạng của bạn.
- Nguồn chính: Liệt kê MỘT nguồn đáng tin cậy nhất mà bạn đã sử dụng để xác minh.

QUY TẮC BẮT BUỘC:
- Chỉ đánh giá các tuyên bố khách quan, có thể kiểm chứng được.
- Phân tích toàn bộ văn bản và không bỏ sót bất kỳ tuyên bố nào.
- Luôn giữ giọng điệu trung lập và khách quan.`,
  },
  'text-summarizer': {
    title: 'Prompt Tóm tắt Văn bản',
    description: 'Chắt lọc văn bản dài thành một đoạn văn ngắn gọn hoặc các gạch đầu dòng súc tích.',
    prompt: `VAI TRÒ: Bạn là một chuyên gia tóm tắt có khả năng chắt lọc thông tin phức tạp thành các bản tóm tắt rõ ràng và súc tích.

NHIỆM VỤ: Tóm tắt văn bản sau đây một cách súc tích và chính xác.

YÊU CẦU ĐỊNH DẠNG: [Chọn một: "Cung cấp một bản tóm tắt mạch lạc trong một đoạn văn duy nhất." HOẶC "Cung cấp một bản tóm tắt dưới dạng các gạch đầu dòng, nêu bật những điểm chính."]

NGÔN NGỮ ĐẦU RA: [Chỉ định ngôn ngữ đầu ra, ví dụ: Tiếng Việt]

VĂN BẢN CẦN TÓM TẮT:
---
[Dán văn bản dài của bạn vào đây...]
---`,
  },
  'history-topic': {
    title: 'Prompt Tạo Chủ đề Lịch sử',
    description: 'Tạo ra các ý tưởng tiêu đề video lịch sử hấp dẫn, đậm chất điện ảnh, được tối ưu hóa cho YouTube.',
    prompt: `VAI TRÒ: Bạn là một chuyên gia tạo tiêu đề YouTube đẳng cấp thế giới chuyên về nội dung tài liệu lịch sử và quân sự đậm chất điện ảnh cho kênh '[Tên kênh của bạn]'.

MỤC TIÊU: Tạo ra [Số lượng chủ đề] ý tưởng tiêu đề video YouTube độc đáo bằng tiếng Anh về "[Chủ đề lịch sử của bạn]".

CÁC CÔNG THỨC TIÊU ĐỀ (BẮT BUỘC ÁP DỤNG):
1. Xung đột trực tiếp & Kết quả quyết định: (Nhấn mạnh đối đầu trực tiếp và kết quả cuối cùng)
   - Cấu trúc: \`[PHIM CHIẾN TRANH SỬ THI]: [Chủ thể 1] + [Động từ mạnh (ĐÁNH BẠI/HỦY DIỆT)] + [Chủ thể 2] + [Quy mô/Số lượng]\`
2. Tỷ lệ cược không tưởng & Chiến lược xuất sắc: (Nhấn mạnh chiến thắng của kẻ yếu và sự khéo léo)
   - Cấu trúc: \`[CÁCH] + [Chủ thể 1] + [Đối đầu/Đánh bại] + [Quân xâm lược khổng lồ] + [Sự kiện/Trận chiến cụ thể]\`
3. Dự đoán/Thời điểm then chốt: (Nhấn mạnh các sự kiện quan trọng và câu chuyện nhiều phần)
   - Cấu trúc: \`[TRAILER CHÍNH THỨC/TRẬN CHIẾN CUỐI CÙNG]: [Chiến dịch/Trận chiến cụ thể] của [Chủ thể 1] + [Chống lại Chủ thể 2]\`

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (VĂN BẢN THUẦN TÚY):
Vui lòng cung cấp kết quả dưới dạng danh sách được đánh số. Với mỗi ý tưởng, hãy cung cấp:
1. Tiêu đề (EN): [Tiêu đề tiếng Anh]
2. Tiêu đề (VI): [Tiêu đề tiếng Việt]
3. Phân tích: [Giải thích ngắn gọn tại sao tiêu đề này hấp dẫn, giá trị chiến lược và tinh thần anh hùng mà nó truyền tải.]`,
  },
    'history-outline': {
    title: 'Prompt Tạo Dàn Ý Lịch Sử',
    description: 'Xây dựng một dàn ý 5 phần chi tiết cho một bộ phim tài liệu lịch sử, tập trung vào cấu trúc tường thuật điện ảnh.',
    prompt: `VAI TRÒ: Bạn là một Kiến trúc sư Tường thuật Lịch sử và Người kể chuyện Điện ảnh đẳng cấp thế giới cho YouTube.

THÔNG TIN ĐẦU VÀO:
- Ngôn ngữ đầu ra: [Chỉ định ngôn ngữ, ví dụ: Tiếng Việt]
- Chủ đề video: "[Tiêu đề video lịch sử của bạn]"
- Ý tưởng/Thông điệp chính của người dùng: "[Dán các ý tưởng chính, từ khóa hoặc các điểm nhấn bạn muốn đưa vào đây]"
- Phong cách tường thuật: "Một phong cách '[Người Kể Chuyện Sử Thi]' tái hiện sống động các sự kiện lịch sử, tập trung vào 'Lý do' đằng sau các cuộc xung đột lớn và 'Cách thức' của những chiến thắng hào hùng."
- Thời lượng video mong muốn: [Số] phút

QUÁ TRÌNH NỘI BỘ ĐỂ CÓ KẾT QUẢ TỐT NHẤT:
Phân bổ tổng thời lượng vào cấu trúc tường thuật 5 phần:
- Phần 1: Giới Thiệu & Hook (~8%): Mở đầu bằng một cảnh hấp dẫn hoặc một câu hỏi khiêu khích.
- Phần 2: Bối Cảnh Lịch Sử (~22%): Đi sâu vào các yếu tố chính trị, xã hội và kinh tế dẫn đến cuộc xung đột.
- Phần 3: Diễn Biến Trận Chiến/Sự Kiện Chính (~48%): Chi tiết các giai đoạn của cuộc xung đột.
- Phần 4: Hậu Quả & Ý Nghĩa Lịch Sử (~17%): Phân tích các kết quả trước mắt và ý nghĩa lâu dài của sự kiện.
- Phần 5: Kết Luận & Kêu Gọi Hành Động (~5%): Tóm tắt di sản lâu dài của sự kiện lịch sử.

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (VĂN BẢN THUẦN TÚY):
Vui lòng tạo dàn ý dưới dạng một tài liệu văn bản có cấu trúc. Sử dụng các tiêu đề rõ ràng cho tiêu đề chính và mỗi phần. Dưới tiêu đề của mỗi phần, hãy bao gồm số từ ước tính và mô tả chi tiết nội dung cho phần đó.`,
  },
  'history-script': {
    title: 'Prompt Tạo Kịch bản Lịch sử',
    description: 'Viết một phần kịch bản chi tiết, đậm chất điện ảnh từ một dàn ý có sẵn.',
    prompt: `VAI TRÒ: Bạn là một nhà viết kịch bản chuyên nghiệp cho kênh YouTube chuyên về lịch sử quân sự hùng tráng và các cuộc kháng chiến vĩ đại.

THÔNG TIN SẢN XUẤT:
- TIÊU ĐỀ PHIM: [Tiêu đề phim tài liệu của bạn]
- NGÔN NGỮ KỊCH BẢN: [Chỉ định ngôn ngữ, ví dụ: Tiếng Việt]
- CHI TIẾT PHẦN HIỆN TẠI:
  - Tiêu đề phần: "[Tiêu đề của phần kịch bản]"
  - Mô tả phần: "[Mô tả chi tiết nội dung của phần này]"
  - Số đoạn văn mục tiêu: [Số lượng đoạn văn bạn muốn cho phần này]

QUY TẮC VIẾT (TUÂN THỦ NGHIÊM NGẶT):
1. Số lượng đoạn văn (QUAN TRỌNG NHẤT): Bạn PHẢI tạo ra chính xác [Số lượng đoạn văn mục tiêu] đoạn văn.
2. Dòng chảy liền mạch: Tường thuật phải liên tục. KHÔNG thêm các cụm từ giới thiệu như "Trong phần này...".
3. Tập trung: Chỉ viết nội dung cho phần đã chỉ định.
4. Cấu trúc đoạn văn: Mỗi đoạn văn là một ý tưởng hoàn chỉnh cho lời thoại. Văn bản thuần túy, mỗi đoạn cách nhau một dòng trống.
5. Không định dạng thừa: KHÔNG bao gồm tiêu đề, đầu mục, gạch đầu dòng, hoặc các ghi chú sản xuất.

NHIỆM VỤ CỦA BẠN:
Viết kịch bản hoàn chỉnh cho phần đã chỉ định bằng ngôn ngữ đã chọn, tuân thủ tất cả các quy tắc trên, dưới dạng văn bản thuần túy.`,
  },
  'history-image-assets': {
    title: 'Prompt Tạo Gợi ý Hình ảnh Lịch sử (Theo câu)',
    description: 'Chuyển đổi một câu kịch bản thành một gợi ý hình ảnh chi tiết, đậm chất điện ảnh.',
    prompt: `VAI TRÒ: Bạn là một AI chuyên tạo gợi ý hình ảnh (image prompts) chi tiết, đậm chất điện ảnh cho video tài liệu lịch sử.

PHONG CÁCH NGHỆ THUẬT (BẮT BUỘC):
- Phong cách: Tranh kỹ thuật số điện ảnh, chính xác về mặt lịch sử. Chi tiết siêu thực.
- Ánh sáng: Kịch tính, tương phản cao (chiaroscuro).
- Bố cục: Quy tắc một phần ba, góc máy động.
- Bảng màu: Màu sắc đậm, đã khử bão hòa để tạo cảm giác gai góc, chân thực.
- Cảm xúc: Ghi lại những cảm xúc mãnh liệt, chân thực của con người.

NHIỆM VỤ: Dựa trên MỘT câu duy nhất từ kịch bản được cung cấp dưới đây, hãy tạo một gợi ý hình ảnh bằng tiếng Anh để minh họa cho câu đó.

CÂU KỊCH BẢN:
"[Dán câu từ kịch bản của bạn vào đây. Ví dụ: 'Vị tướng già đứng trên thành lũy, nhìn xuống đội quân xâm lược đông như kiến.']"

QUY TẮC:
- Gợi ý hình ảnh phải bằng tiếng Anh.
- Gợi ý phải mô tả một cảnh duy nhất, gắn kết.
- Gợi ý phải tuân thủ nghiêm ngặt PHONG CÁCH NGHỆ THUẬT đã được xác định.
- Trả về gợi ý dưới dạng một chuỗi văn bản thuần túy.`,
  },
  'history-character-id': {
    title: "Prompt Tạo Hồ sơ Nhân vật Lịch sử",
    description: "Phân tích kịch bản để tạo hồ sơ chi tiết cho các nhân vật, đơn vị quân đội hoặc các hình mẫu lịch sử, tập trung vào độ chính xác và phong cách điện ảnh.",
    prompt: `VAI TRÒ: Bạn là một Giám đốc Sản xuất AI và Chuyên gia Thiết kế Hình ảnh cho một kênh YouTube về lịch sử quân sự hùng tráng.

NHIỆM VỤ: Đọc kỹ kịch bản được cung cấp, sau đó phân tích và trích xuất tất cả các nhân vật lịch sử, đơn vị quân đội hoặc hình mẫu nhân vật quan trọng. Tạo hồ sơ chi tiết, nhất quán cho từng nhân vật.

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (VĂN BẢN THUẦN TÚY):
Đối với mỗi nhân vật được xác định, hãy cung cấp thông tin sau dưới dạng văn bản có cấu trúc rõ ràng bằng tiếng Anh:
- Tên/Vai trò (Name_ID): [Vai trò lịch sử hoặc mô tả chung của nhân vật]
- Diện mạo (Physical_Appearance): [Mô tả chi tiết: khuôn mặt, vóc dáng, biểu cảm, nhấn mạnh sự chính xác lịch sử và chất điện ảnh]
- Trang phục & Phụ kiện (Costume_Accessories): [Trang phục đặc trưng dựa trên ghi chép lịch sử: áo giáp, vũ khí, cờ hiệu]
- Đặc điểm nổi bật (Distinctive_Features): [Đặc điểm nổi bật nhất: đôi mắt sắc sảo, vết sẹo trận mạc, phong thái uy nghiêm]
- Tính cách & Hành vi (Behavior_Personality): [Tính cách được thể hiện: dũng cảm, chiến lược, tàn nhẫn, kiên cường]
- Kỷ nguyên (Era): [Thời kỳ lịch sử cụ thể]

KỊCH BẢN ĐẦU VÀO:
---
[Dán kịch bản video lịch sử của bạn vào đây...]
---`
  },
  'history-environment-id': {
    title: "Prompt Tạo Hồ sơ Môi trường Lịch sử",
    description: "Phân tích kịch bản để tạo hồ sơ chi tiết cho các môi trường, bối cảnh quan trọng như chiến trường, cung điện.",
    prompt: `VAI TRÒ: Bạn là một Giám đốc Hình ảnh AI cho một kênh YouTube về lịch sử.

NHIỆM VỤ: Đọc kỹ kịch bản được cung cấp, sau đó phân tích và trích xuất tất cả các môi trường, bối cảnh hoặc hình nền quan trọng. Tạo hồ sơ chi tiết cho từng môi trường.

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (VĂN BẢN THUẦN TÚY):
Đối với mỗi môi trường được xác định, hãy cung cấp thông tin sau dưới dạng văn bản có cấu trúc rõ ràng bằng tiếng Anh:
- Tên Môi trường (Name_ID): [Tên đầy đủ của môi trường, ví dụ: Sông Bạch Đằng đẫm máu]
- Mô tả (Physical_Appearance): [Mô tả chi tiết: hùng vĩ, cổ kính, bị chiến tranh tàn phá, có ý nghĩa chiến lược, chính xác về mặt lịch sử]
- Các yếu tố phụ (Accessories_Elements): [Các yếu tố phụ: vũ khí cổ, cờ hiệu quân đội, bản đồ lịch sử, các yếu tố tự nhiên đóng vai trò chiến lược]
- Bầu không khí (Atmosphere_Personality): [Tâm trạng, cảm giác: hùng tráng, kịch tính, bi thảm, anh hùng, trang nghiêm]
- Ánh sáng & Bảng màu (Lighting_Color_Palette): [Sơ đồ ánh sáng và màu sắc: ánh sáng tương phản cao, tông màu đất, bầu trời u ám, ánh lửa từ các trận chiến]
- Kỷ nguyên (Era): [Bối cảnh lịch sử cụ thể]

KỊCH BẢN ĐẦU VÀO:
---
[Dán kịch bản video lịch sử của bạn vào đây...]
---`
  },
  'history-trailer-prompt': {
    title: 'Prompt Tạo Kịch bản Trailer Lịch sử',
    description: 'Tạo kịch bản trailer điện ảnh từ một kịch bản phim tài liệu, bao gồm cả lời thoại và gợi ý hình ảnh chi tiết.',
    prompt: `VAI TRÒ: Bạn là một đạo diễn trailer phim lịch sử chiến tranh hùng tráng chuyên nghiệp.

THÔNG TIN ĐẦU VÀO:
- Ngôn ngữ Lời thoại: Tiếng Việt
- Thời lượng Trailer mục tiêu: khoảng [Số] giây.
- Kịch bản đầy đủ: [Dán toàn bộ kịch bản video lịch sử của bạn vào đây...]

NHIỆM VỤ: Tạo một kịch bản trailer có cấu trúc chặt chẽ, đồng bộ hóa hoàn hảo giữa lời thoại hùng tráng và các cảnh quay tái hiện lịch sử/đồ họa chuyển động ấn tượng.

QUY TẮC CỐT LÕI (BẮT BUỘC):
1. Đồng bộ hóa & Tường thuật: Mỗi cảnh PHẢI có một lời thoại (bằng Tiếng Việt) và một gợi ý hình ảnh tương ứng (bằng tiếng Anh).
2. Lời thoại: Phải là những câu ngắn gọn, mạnh mẽ và giàu cảm xúc. Nhấn mạnh quy mô xung đột, tỷ lệ cược áp đảo, lòng dũng cảm và các chiến lược tài tình.
3. Gợi ý hình ảnh: Phải bằng tiếng Anh. Phong cách nghệ thuật PHẢI là siêu thực, điện ảnh, hùng tráng, chính xác về mặt lịch sử. Mỗi gợi ý phải mô tả tỉ mỉ một góc máy quay điện ảnh (ví dụ: cảnh rộng, cận cảnh, góc nhìn từ trên cao).

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (VĂN BẢN THUẦN TÚY):
Trình bày kết quả dưới dạng danh sách các cảnh. Đối với mỗi cảnh, hãy cung cấp:
Cảnh [Số]:
- Lời thoại: [Lời thoại bằng Tiếng Việt]
- Gợi ý hình ảnh: [Gợi ý hình ảnh chi tiết bằng tiếng Anh]
- Thời lượng (giây): [Thời lượng ước tính cho cảnh này]`
  },
  'history-creative': {
    title: 'Prompt Tạo Gói SEO Lịch sử',
    description: 'Tạo một gói SEO toàn diện (tiêu đề, mô tả, hashtags, tags) cho một video tài liệu lịch sử.',
    prompt: `VAI TRÒ: Bạn là một chuyên gia SEO YouTube đẳng cấp thế giới chuyên về nội dung tài liệu lịch sử và quân sự hùng tráng.

THÔNG TIN ĐẦU VÀO:
- Ngôn ngữ mục tiêu: [Chỉ định ngôn ngữ, ví dụ: Tiếng Việt]
- Chủ đề chính: "[Chủ đề chính của video của bạn]"
- Tên kênh: "[Tên kênh của bạn]"
- Bối cảnh kịch bản: "[Dán một đoạn tóm tắt ngắn gọn kịch bản của bạn vào đây (khoảng 100-200 từ)]"

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (VĂN BẢN THUẦN TÚY):
Vui lòng cung cấp gói SEO theo định dạng sau, sử dụng các tiêu đề rõ ràng cho mỗi phần:

Tùy chọn Tiêu đề:
- [Tiêu đề 1]
- [Tiêu đề 2]
- [Tiêu đề 3]

Mô tả:
[Soạn một mô tả chi tiết khoảng 150-200 từ, có cấu trúc 4 đoạn: Hook, Giới thiệu nội dung, Người xem sẽ học được gì, và Lời kêu gọi hành động (CTA).]

Hashtags:
[Cung cấp chính xác 3 hashtag có liên quan.]

Tags:
- Chủ đề chính: [danh sách tags, cách nhau bằng dấu phẩy]
- Sự kiện & Thời kỳ: [danh sách tags, cách nhau bằng dấu phẩy]
- Nhân vật & Lãnh đạo: [danh sách tags, cách nhau bằng dấu phẩy]
- Phong cách & Thể loại: [danh sách tags, cách nhau bằng dấu phẩy]
- Tìm kiếm nâng cao: [danh sách tags, cách nhau bằng dấu phẩy]

Danh sách kiểm tra cho Người sáng tạo:
- [Đề xuất 1]
- [Đề xuất 2]
- [Đề xuất 3]`,
  },
  'edutainment-topic': {
    title: 'Prompt Tạo Chủ đề Edutainment',
    description: 'Tạo các ý tưởng video khoa học & giải thích hấp dẫn, tối ưu hóa để khơi gợi sự tò mò.',
    prompt: `VAI TRÒ: Bạn là một Chuyên gia Tạo chủ đề YouTube đẳng cấp thế giới chuyên về nội dung Edutainment hấp dẫn, giàu hình ảnh cho kênh '[Tên kênh của bạn]'.

MỤC TIÊU: Tạo ra chính xác [Số lượng] ý tưởng chủ đề YouTube độc đáo bằng tiếng Anh về "[Chủ đề của bạn]".

CÁC CÔNG THỨC TIÊU ĐỀ (BẮT BUỘC ÁP DỤNG):
1. Câu hỏi lớn / What If: (khơi gợi trí tưởng tượng)
   - Cấu trúc: \`[What If / Điều gì sẽ xảy ra nếu] + [Kịch bản phi thường] + [Hậu quả hấp dẫn]\`
2. Giải thích / Chuyên sâu: (làm sáng tỏ sự phức tạp)
   - Cấu trúc: \`[Khoa học đáng ngạc nhiên của / Cách] + [Chủ đề phức tạp hoặc hàng ngày] + [Thực sự hoạt động]\`
3. Huyền thoại vs. Thực tế / So sánh: (thách thức giả định)
   - Cấu trúc: \`[Huyền thoại vs. Sự thật / X vs. Y]: [Niềm tin phổ biến] + [Sự thật gây sốc]\`

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (VĂN BẢN THUẦN TÚY):
Vui lòng cung cấp kết quả dưới dạng danh sách được đánh số. Với mỗi ý tưởng, hãy cung cấp:
1. Tiêu đề (EN): [Tiêu đề tiếng Anh]
2. Tiêu đề (VI): [Tiêu đề tiếng Việt]
3. Phân tích: [Giải thích ngắn gọn tại sao tiêu đề này hấp dẫn, giá trị học hỏi và tiềm năng hình ảnh của nó.]`,
  },
  'edutainment-outline': {
    title: 'Prompt Tạo Dàn Ý Edutainment',
    description: 'Xây dựng dàn ý 5 phần chi tiết để giải thích các chủ đề phức tạp một cách rõ ràng, hấp dẫn.',
    prompt: `VAI TRÒ: Bạn là một Kiến trúc sư Nội dung Edutainment và Chuyên gia Truyền thông Khoa học.

THÔNG TIN ĐẦU VÀO:
- Ngôn ngữ đầu ra: [Chỉ định ngôn ngữ, ví dụ: Tiếng Việt]
- Chủ đề video: "[Tiêu đề video edutainment của bạn]"
- Ý tưởng/Thông điệp chính của người dùng: "[Dán các ý tưởng chính, từ khóa hoặc các điểm nhấn bạn muốn đưa vào đây]"
- Phong cách video: "Một phong cách 'Edutainment' đơn giản hóa các chủ đề phức tạp thông qua tường thuật rõ ràng và kể chuyện bằng hình ảnh mạnh mẽ."
- Thời lượng video mong muốn: [Số] phút

QUÁ TRÌNH NỘI BỘ ĐỂ CÓ KẾT QUẢ TỐT NHẤT:
Phân bổ tổng thời lượng vào cấu trúc 5 phần:
- Phần 1: Giới Thiệu & Hook (~10%): Bắt đầu với một 'hook' hấp dẫn. Nêu rõ câu hỏi trung tâm.
- Phần 2: Bối Cảnh & Nền tảng (~20%): Giải thích các khái niệm nền tảng cần thiết.
- Phần 3: Giải Thích Cốt Lõi (~45%): Phân tích chủ đề cốt lõi từng bước một.
- Phần 4: Ý Nghĩa & Ứng Dụng (~20%): Kết nối chủ đề cốt lõi với thế giới thực.
- Phần 5: Kết Luận & Kêu Gọi Hành Động (~5%): Tóm tắt ngắn gọn và kêu gọi hành động.

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (VĂN BẢN THUẦN TÚY):
Vui lòng tạo dàn ý dưới dạng một tài liệu văn bản có cấu trúc. Sử dụng các tiêu đề rõ ràng cho tiêu đề chính và mỗi phần. Dưới tiêu đề của mỗi phần, hãy bao gồm số từ ước tính và mô tả chi tiết nội dung cho phần đó.`,
  },
  'edutainment-script': {
    title: 'Prompt Tạo Kịch bản Edutainment',
    description: 'Viết một phần kịch bản tường thuật hấp dẫn, dễ hiểu từ một dàn ý có sẵn, theo phong cách edutainment.',
    prompt: `VAI TRÒ: Bạn là một nhà viết kịch bản chuyên nghiệp cho một kênh YouTube Edutainment hàng đầu (như Kurzgesagt, Mark Rober).

THÔNG TIN SẢN XUẤT:
- TIÊU ĐỀ PHIM: [Tiêu đề video của bạn]
- NGÔN NGỮ KỊCH BẢN: [Chỉ định ngôn ngữ, ví dụ: Tiếng Việt]
- CHI TIẾT PHẦN HIỆN TẠI:
  - Tiêu đề phần: "[Tiêu đề của phần kịch bản]"
  - Mô tả phần: "[Mô tả chi tiết nội dung của phần này]"
  - Số đoạn văn mục tiêu: [Số lượng đoạn văn bạn muốn cho phần này]

QUY TẮC VIẾT (TUÂN THỦ NGHIÊM NGẶT):
1. Số lượng đoạn văn (QUAN TRỌNG NHẤT): Bạn PHẢI tạo ra chính xác [Số lượng đoạn văn mục tiêu] đoạn văn.
2. Dòng chảy liền mạch: Tường thuật phải liên tục. KHÔNG thêm các cụm từ giới thiệu.
3. Tập trung: Chỉ viết nội dung cho phần đã chỉ định.
4. Cấu trúc đoạn văn: Mỗi đoạn văn là một ý tưởng hoàn chỉnh cho lời thoại, cách nhau một dòng trống.
5. Không định dạng thừa: KHÔNG bao gồm tiêu đề, đầu mục, hoặc các ghi chú sản xuất.

NHIỆM VỤ CỦA BẠN:
Viết kịch bản hoàn chỉnh cho phần đã chỉ định bằng ngôn ngữ đã chọn, tuân thủ tất cả các quy tắc trên, dưới dạng văn bản thuần túy.`,
  },
  'edutainment-image-assets': {
    title: 'Prompt Tạo Gợi ý Hình ảnh Edutainment (Theo câu)',
    description: 'Chuyển đổi một câu kịch bản thành gợi ý hình ảnh theo phong cách infographic rõ ràng, sống động.',
    prompt: `VAI TRÒ: Bạn là một AI chuyên tạo gợi ý hình ảnh chi tiết và đầy sức biểu cảm cho một kênh edutainment hài hước sử dụng hoạt hình người que.

NHÂN VẬT CHÍNH (QUAN TRỌNG NHẤT):
Nhân vật chính của chúng ta là Professor Stickman. Hầu hết các hình ảnh nên có sự xuất hiện của ông ấy. Ông là người dẫn chuyện và là cầu nối với khán giả.
Mô tả nhân vật (ENGLISH): "A wise Professor Stickman with a large, round head, big expressive circular eyes with distinct black pupils, and small round intellectual glasses perched on his face. He has a few stray wisps of hair sticking up from the top of his head. His body is composed of simple straight lines - a vertical line for the torso and two short horizontal lines at the shoulders suggesting a scholarly blazer. His overall proportions are balanced and visually pleasing. He stands with his legs as two well-proportioned straight lines of medium length and simple oval feet, firmly planted on the ground. He sports a confident, knowing smirk. One arm is raised, pointing outward as if explaining an important concept, while the other hand holds a simple pointer stick."

PHONG CÁCH NGHỆ THUẬT:
Phong cách là hoạt hình người que 2D/3D tối giản, sạch sẽ và sống động. Ưu tiên hình ảnh có màu sắc tươi sáng, bố cục năng động để truyền tải thông tin một cách trực quan và vui nhộn.

NHIỆM VỤ:
Dựa trên MỘT câu duy nhất từ kịch bản được cung cấp dưới đây, hãy tạo một gợi ý hình ảnh bằng tiếng Anh để minh họa cho câu đó, đặt Professor Stickman làm trung tâm.

CÂU KỊCH BẢN:
"[Dán câu từ kịch bản của bạn vào đây. Ví dụ: 'Và thế là, lỗ đen bẻ cong không-thời gian xung quanh nó giống như một quả bowling trên tấm bạt lò xo.']"

QUY TẮC:
- Gợi ý hình ảnh phải bằng tiếng Anh.
- Gợi ý phải mô tả một cảnh duy nhất, có Professor Stickman.
- Trả về gợi ý dưới dạng một chuỗi văn bản thuần túy.`,
  },
   'edutainment-character-id': {
    title: "Prompt Tạo Hồ sơ Concept/Nhân vật Edutainment",
    description: "Phân tích kịch bản để tạo hồ sơ cho các nhân vật, linh vật hoặc các khái niệm trừu tượng theo phong cách infographic rõ ràng, sống động.",
    prompt: `VAI TRÒ: Bạn là một Giám đốc Sản xuất AI và Chuyên gia Thiết kế Hình ảnh cho một kênh Edutainment hàng đầu.

NHIỆM VỤ: Phân tích kịch bản và trích xuất các nhân vật, linh vật, khái niệm hoặc các hình ảnh đại diện trừu tượng quan trọng. Tạo hồ sơ chi tiết, nhất quán cho từng đối tượng.

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (VĂN BẢN THUẦN TÚY):
Đối với mỗi khái niệm/nhân vật được xác định, hãy cung cấp thông tin sau dưới dạng văn bản có cấu trúc rõ ràng bằng tiếng Anh:
- Tên/Vai trò (Name_ID): [Vai trò hoặc mô tả chung của khái niệm, ví dụ: Nguyên tử (Linh vật)]
- Diện mạo (Physical_Appearance): [Mô tả chi tiết hình thức trực quan, tập trung vào hình dạng đơn giản, mang tính biểu tượng và các đặc điểm thân thiện]
- Phụ kiện/Yếu tố hình ảnh (Costume_Accessories): [Các yếu tố hình ảnh đặc trưng, ví dụ: 'Được bao quanh bởi mã nhị phân bay lơ lửng']
- Đặc điểm nổi bật (Distinctive_Features): [Đặc điểm hình ảnh đáng nhớ nhất, ví dụ: 'Hạt nhân phát sáng của nó']
- Hành vi/Tính cách (Behavior_Personality): [Cách nó hoạt động trong hoạt ảnh, ví dụ: 'Tò mò và hữu ích', 'Mạnh mẽ và phức tạp']
- Phong cách nghệ thuật (Art_Style_Lock): "Sạch sẽ, sống động, tối giản, theo phong cách infographic 3D. Bảng màu tươi sáng, gradient mượt mà và truyền thông hình ảnh rõ ràng."

KỊCH BẢN ĐẦU VÀO:
---
[Dán kịch bản video edutainment của bạn vào đây...]
---`
  },
  'edutainment-environment-id': {
    title: "Prompt Tạo Hồ sơ Môi trường Edutainment",
    description: "Phân tích kịch bản để tạo hồ sơ chi tiết cho các môi trường, bối cảnh hoặc không gian trừu tượng theo phong cách infographic.",
    prompt: `VAI TRÒ: Bạn là một Giám đốc Hình ảnh AI cho một kênh Edutainment hàng đầu.

NHIỆM VỤ: Phân tích kịch bản và trích xuất các môi trường, bối cảnh hoặc hình nền trừu tượng quan trọng. Tạo hồ sơ chi tiết cho từng môi trường.

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (VĂN BẢN THUẦN TÚY):
Đối với mỗi môi trường được xác định, hãy cung cấp thông tin sau dưới dạng văn bản có cấu trúc rõ ràng bằng tiếng Anh:
- Tên Môi trường (Name_ID): [Tên đầy đủ của môi trường, ví dụ: Lưới Infographic, Bên trong tế bào người]
- Mô tả (Physical_Appearance): [Mô tả chi tiết phong cách hình ảnh: sạch sẽ, tối giản, trừu tượng, cách điệu]
- Các yếu tố phụ (Accessories_Elements): [Các yếu tố hình ảnh hỗ trợ: 'Các biểu tượng nổi', 'các đường lưới tinh tế', 'các hạt dữ liệu phát sáng']
- Bầu không khí (Atmosphere_Personality): [Tâm trạng: 'Sạch sẽ và khoa học', 'Truyền cảm hứng và rộng lớn', 'Vui tươi và năng động']
- Ánh sáng & Bảng màu (Lighting_Color_Palette): [Sơ đồ ánh sáng và màu sắc: 'Ánh sáng đều, rực rỡ', 'bảng màu tương phản cao, sống động']
- Phong cách nghệ thuật (Art_Style_Lock): "Sạch sẽ, sống động, tối giản, theo phong cách infographic 3D. Bảng màu tươi sáng, gradient mượt mà và truyền thông hình ảnh rõ ràng."

KỊCH BẢN ĐẦU VÀO:
---
[Dán kịch bản video edutainment của bạn vào đây...]
---`
  },
  'edutainment-trailer-prompt': {
    title: 'Prompt Tạo Kịch bản Trailer Edutainment',
    description: 'Tạo kịch bản trailer nhanh, khơi gợi sự tò mò, bao gồm lời thoại và gợi ý hình ảnh theo phong cách infographic sống động.',
    prompt: `VAI TRÒ: Bạn là một đạo diễn trailer video Edutainment có khả năng lan truyền.

THÔNG TIN ĐẦU VÀO:
- Ngôn ngữ Lời thoại: Tiếng Việt
- Thời lượng Trailer mục tiêu: khoảng [Số] giây.
- Kịch bản đầy đủ: [Dán toàn bộ kịch bản video edutainment của bạn vào đây...]

NHIỆM VỤ: Tạo một kịch bản trailer có nhịp độ nhanh, khơi gợi sự tò mò, đặt ra một câu hỏi hấp dẫn và hứa hẹn một lời giải thích trực quan tuyệt đẹp.

QUY TẮC CỐT LÕI (BẮT BUỘC):
1. Đồng bộ hóa & Tường thuật: Mỗi cảnh PHẢI có một lời thoại (bằng Tiếng Việt) và một gợi ý hình ảnh tương ứng (bằng tiếng Anh).
2. Lời thoại: Phải là những câu ngắn, hấp dẫn và thú vị. Sử dụng nhiều câu hỏi. Giọng điệu phải nhiệt tình và đầy kinh ngạc.
3. Gợi ý hình ảnh: Phải bằng tiếng Anh. Phong cách nghệ thuật PHẢI là infographic 3D sạch sẽ, sống động, tối giản, với bảng màu tươi sáng. Mỗi gợi ý phải mô tả các chuyển động máy quay nhanh, năng động.

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (VĂN BẢN THUẦN TÚY):
Trình bày kết quả dưới dạng danh sách các cảnh. Đối với mỗi cảnh, hãy cung cấp:
Cảnh [Số]:
- Lời thoại: [Lời thoại bằng Tiếng Việt]
- Gợi ý hình ảnh: [Gợi ý hình ảnh chi tiết bằng tiếng Anh]
- Thời lượng (giây): [Thời lượng ước tính cho cảnh này]`
  },
  'edutainment-creative': {
    title: 'Prompt Tạo Gói SEO Edutainment',
    description: 'Tạo gói SEO toàn diện (tiêu đề, mô tả, tags) cho video khoa học và giải thích.',
    prompt: `VAI TRÒ: Bạn là một chuyên gia SEO YouTube đẳng cấp thế giới cho nội dung Edutainment.

THÔNG TIN ĐẦU VÀO:
- Ngôn ngữ mục tiêu: [Chỉ định ngôn ngữ, ví dụ: Tiếng Việt]
- Chủ đề chính: "[Chủ đề chính của video của bạn]"
- Tên kênh: "[Tên kênh của bạn]"
- Bối cảnh kịch bản: "[Dán một đoạn tóm tắt ngắn gọn kịch bản của bạn vào đây (khoảng 100-200 từ)]"

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (VĂN BẢN THUẦN TÚY):
Vui lòng cung cấp gói SEO theo định dạng sau, sử dụng các tiêu đề rõ ràng cho mỗi phần:

Tùy chọn Tiêu đề:
- [Tiêu đề 1]
- [Tiêu đề 2]
- [Tiêu đề 3]

Mô tả:
[Soạn một mô tả chi tiết khoảng 150-200 từ, có cấu trúc 4 đoạn: Hook, Giới thiệu nội dung, Người xem sẽ học được gì, và Lời kêu gọi hành động (CTA).]

Hashtags:
[Cung cấp chính xác 3 hashtag có liên quan.]

Tags:
- Chủ đề chính: [danh sách tags, cách nhau bằng dấu phẩy]
- Lĩnh vực & Chủ đề: [danh sách tags, cách nhau bằng dấu phẩy]
- Khái niệm & Nguyên tắc: [danh sách tags, cách nhau bằng dấu phẩy]
- Phong cách & Thể loại: [danh sách tags, cách nhau bằng dấu phẩy]
- Tìm kiếm nâng cao: [danh sách tags, cách nhau bằng dấu phẩy]

Danh sách kiểm tra cho Người sáng tạo:
- [Đề xuất 1]
- [Đề xuất 2]
- [Đề xuất 3]`,
  },
};