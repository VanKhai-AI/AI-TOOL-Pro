import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  label: string;
  file?: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, label, file }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      onFileUpload(uploadedFile);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div
        {...getRootProps()}
        className={`flex flex-col justify-center items-center w-full h-32 px-6 py-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-gray-800' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 hover:border-gray-400 dark:hover:border-gray-500'}`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <i className="fas fa-upload text-3xl text-gray-400 dark:text-gray-500 mb-2"></i>
          {file?.name ? (
            <p className="text-gray-700 dark:text-gray-300 font-semibold">{file.name}</p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isDragActive ? 'Thả file vào đây...' : 'Kéo & thả file vào đây, hoặc nhấn để chọn'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;