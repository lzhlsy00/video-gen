'use client';

import { useState, useRef, useCallback } from 'react';

interface FileUploadInfo {
  filename: string;
  content_type: string;
  size: number;
  extracted_text?: string;
}

interface FileUploadResponse {
  files: FileUploadInfo[];
  combined_text: string;
  total_files: number;
  files_with_text: number;
}

interface FileUploadProps {
  onFilesProcessed: (extractedText: string) => void;
  disabled?: boolean;
}

const FileUpload = ({ onFilesProcessed, disabled = false }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'text/plain'
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFiles = (files: FileList) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSize) {
        errors.push(`${file.name} is too large (max 50MB)`);
      }
      if (!supportedTypes.includes(file.type)) {
        errors.push(`${file.name} is not a supported file type`);
      }
    }

    return errors;
  };

  const processFiles = async (files: FileList) => {
    if (disabled || isProcessing) return;

    const errors = validateFiles(files);
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Uploading files...');

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      // Get auth token
      const { data: { session } } = await (await import('../lib/supabase')).supabase.auth.getSession();
      const headers: any = {};
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      setProcessingStatus('Processing file content...');

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const result: FileUploadResponse = await response.json();
      
      setUploadedFiles(result.files);
      setProcessingStatus(`Processed ${result.files_with_text}/${result.total_files} files`);
      
      if (result.combined_text) {
        onFilesProcessed(result.combined_text);
      }

      setTimeout(() => setProcessingStatus(''), 3000);

    } catch (error) {
      console.error('File upload error:', error);
      setProcessingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setProcessingStatus(''), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, isProcessing]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, []);

  const clearFiles = () => {
    setUploadedFiles([]);
    setProcessingStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* File Upload Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragging && !disabled
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : disabled 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-primary hover:bg-primary/5'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.txt"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <>
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="text-lg font-semibold text-primary">Processing files...</div>
              {processingStatus && (
                <div className="text-sm text-gray-600">{processingStatus}</div>
              )}
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <i className="ri-upload-cloud-2-line text-3xl text-primary"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Upload Reference Files
                </h3>
                <p className="text-gray-600 mb-2">
                  Drag & drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports: PDF, Word, Images (PNG, JPG, etc.), Text files
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Max file size: 50MB per file
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Processing Status */}
      {processingStatus && !isProcessing && (
        <div className={`mt-4 p-4 rounded-lg ${
          processingStatus.startsWith('Error') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <div className="flex items-center gap-2">
            <i className={`text-lg ${
              processingStatus.startsWith('Error') 
                ? 'ri-error-warning-line' 
                : 'ri-check-line'
            }`}></i>
            <span className="font-medium">{processingStatus}</span>
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Uploaded Files ({uploadedFiles.length})
            </h4>
            <button
              onClick={clearFiles}
              className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
              disabled={isProcessing}
            >
              <i className="ri-delete-bin-line"></i>
              Clear all
            </button>
          </div>
          
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <i className={`text-lg text-primary ${
                      file.content_type.includes('pdf') ? 'ri-file-pdf-line' :
                      file.content_type.includes('word') || file.content_type.includes('document') ? 'ri-file-word-line' :
                      file.content_type.includes('image') ? 'ri-image-line' :
                      'ri-file-text-line'
                    }`}></i>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{file.filename}</div>
                    <div className="text-sm text-gray-500">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {file.extracted_text ? (
                    <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <i className="ri-check-line text-xs"></i>
                      Text extracted
                    </span>
                  ) : (
                    <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <i className="ri-information-line text-xs"></i>
                      No text found
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {uploadedFiles.some(f => f.extracted_text) && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700">
                <i className="ri-information-line"></i>
                <span className="font-medium">
                  File content will be used as additional context for video generation
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;