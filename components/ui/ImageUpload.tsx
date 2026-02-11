'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface ImageUploadProps {
  currentImageUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  bucket: string;
  storagePath: string;
  label: string;
  hint?: string;
  maxSizeMB?: number;
  aspectRatio?: string;
  className?: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUpload({
  currentImageUrl,
  onUpload,
  onRemove,
  bucket,
  storagePath,
  label,
  hint,
  maxSizeMB = 5,
  aspectRatio,
  className = '',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image.');
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be under ${maxSizeMB}MB.`);
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      // Generate unique filename
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${storagePath}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        setError('Upload failed. Please try again.');
        console.error('Upload error:', uploadError);
        return;
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onUpload(urlData.publicUrl);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">
        {label}
      </label>

      {currentImageUrl ? (
        <div className="relative">
          <div
            className="overflow-hidden rounded-lg border border-slate-200"
            style={{ aspectRatio: aspectRatio || 'auto' }}
          >
            <img
              src={currentImageUrl}
              alt={label}
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              onRemove();
              setError(null);
            }}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 transition-colors hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50"
          style={{ aspectRatio: aspectRatio || 'auto', minHeight: '120px' }}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <span className="text-sm text-slate-500">Uploading...</span>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                <ImageIcon className="h-6 w-6 text-slate-400" />
              </div>
              <span className="text-sm font-medium text-slate-600">
                Click to upload
              </span>
              <span className="text-xs text-slate-400">
                JPG, PNG, or WebP up to {maxSizeMB}MB
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-rose-600">{error}</p>
      )}
    </div>
  );
}
