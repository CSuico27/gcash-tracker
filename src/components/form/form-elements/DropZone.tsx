import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = Math.round((bytes / Math.pow(k, i)) * 100) / 100;
  return `${size} ${units[i]}`;
}

interface Props {
  onFileAccepted: (file: File | null) => void;
}

const Dropzone: React.FC<Props> = ({ onFileAccepted }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const f = acceptedFiles[0] || null;
      setFile(f);
      onFileAccepted(f);
      if (f) setPreview(URL.createObjectURL(f));
    },
    [onFileAccepted]
  );

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    onFileAccepted(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxSize: 5 * 1024 * 1024,
  });

  return (
    <div
      className={`transition border border-dashed rounded-xl cursor-pointer
        ${isDragActive
          ? "border-brand-500 bg-gray-100 dark:bg-gray-800"
          : "border-gray-300 hover:border-brand-500 dark:border-gray-700 dark:hover:border-brand-500"
        }`}
    >
      <div {...getRootProps()} className="p-6">
        <input {...getInputProps()} />

        {file && preview ? (
          <div
            className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={preview}
              alt="preview"
              className="h-12 w-12 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-gray-700"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {formatSize(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
              title="Remove file"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <svg className="fill-current" width="29" height="28" viewBox="0 0 29 28" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-400">
                <span className="font-semibold text-gray-800 dark:text-white/90">
                  {isDragActive ? "Drop your image here" : "Click to upload"}
                </span>
                {!isDragActive && " or drag and drop"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                PNG or JPG (max 5 MB)
              </p>
            </div>
            <span className="font-medium underline text-theme-sm text-brand-500">
              Browse File
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropzone;