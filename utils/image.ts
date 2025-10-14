/**
 * Chuyển đổi đối tượng File hoặc Blob thành một chuỗi được mã hóa Base64.
 * @param file Tệp hoặc blob cần chuyển đổi.
 * @returns Một promise phân giải với chuỗi base64 (không có tiền tố data URL).
 */
export const toBase64 = (file: File | Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Kết quả bao gồm tiền tố data URL (ví dụ: "data:image/png;base64,"),
        // chúng ta cần xóa nó để chỉ lấy dữ liệu base64.
        const base64String = reader.result.split(',')[1];
        if (base64String) {
          resolve(base64String);
        } else {
           reject(new Error('Không thể trích xuất chuỗi base64 từ kết quả của file reader.'));
        }
      } else {
        reject(new Error('Không thể đọc tệp dưới dạng chuỗi data URL.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
