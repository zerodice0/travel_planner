import { useState, useRef } from 'react';

interface ImageUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  previewUrl?: string;
  disabled?: boolean;
}

export default function ImageUpload({ value, onChange, previewUrl, disabled }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      onChange(null);
      setPreview(null);
      return;
    }

    // 파일 형식 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다');
      return;
    }

    // 파일 크기 검증 (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('파일 크기는 2MB를 초과할 수 없습니다');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onChange(file);
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 미리보기 */}
      <div
        className="relative h-32 w-32 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-primary-500 hover:bg-gray-100"
        onClick={disabled ? undefined : handleClick}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            {!disabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 transition-opacity hover:opacity-100">
                <span className="text-sm font-medium text-white">변경</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="mt-2 text-xs">사진 추가</span>
          </div>
        )}
      </div>

      {/* 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* 안내 텍스트 */}
      <div className="text-center">
        <p className="text-xs text-gray-500">JPEG, PNG, WebP (최대 2MB)</p>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleRemove}
            className="mt-2 text-sm text-red-600 hover:text-red-700"
          >
            제거
          </button>
        )}
      </div>
    </div>
  );
}
