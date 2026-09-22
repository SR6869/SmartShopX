import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  Sparkles,
  Check,
  X,
  Image as ImageIcon,
  RotateCcw,
  Film,
} from 'lucide-react';
import { Button } from '../common/Button';

interface ProductImageUploaderProps {
  currentImage?: string;
  onImageChange: (newImageUrl: string) => void;
  onOpenAiStudio: (initialImage: string) => void;
  productName?: string;
  category?: string;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  currentImage,
  onImageChange,
  onOpenAiStudio,
}) => {
  const [selectedImages, setSelectedImages] = useState<string[]>(
    currentImage ? [currentImage] : []
  );
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeImage = selectedImages[activeImageIndex] || currentImage || '';

  // Handle file uploads (file picker & drag drop)
  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validImageFiles = fileArray.filter((file) => file.type.startsWith('image/'));

    if (validImageFiles.length === 0) return;

    const newImages: string[] = [];
    let loadedCount = 0;

    validImageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push(e.target.result as string);
        }
        loadedCount++;
        if (loadedCount === validImageFiles.length) {
          const combined = [...selectedImages, ...newImages];
          setSelectedImages(combined);
          const newIdx = selectedImages.length; // Focus on first newly added image
          setActiveImageIndex(newIdx);
          onImageChange(newImages[0]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Camera capture support
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('আপনার ব্রাউজার ক্যামেরা সাপোর্ট করে না');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err.message);
      setCameraError(err.message || 'ক্যামেরা চালু করা সম্ভব হয়নি। অনুগ্রহ করে পারমিশন চেক করুন।');
      // Fallback: trigger file input with capture attribute
      if (fileInputRef.current) {
        fileInputRef.current.setAttribute('capture', 'environment');
        fileInputRef.current.click();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 800;
    canvas.height = videoRef.current.videoHeight || 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const combined = [...selectedImages, dataUrl];
      setSelectedImages(combined);
      setActiveImageIndex(combined.length - 1);
      onImageChange(dataUrl);
    }
    stopCamera();
  };

  const removeImage = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = selectedImages.filter((_, i) => i !== idx);
    setSelectedImages(updated);
    if (activeImageIndex >= updated.length) {
      const nextIdx = Math.max(0, updated.length - 1);
      setActiveImageIndex(nextIdx);
      onImageChange(updated[nextIdx] || '');
    } else {
      onImageChange(updated[activeImageIndex] || '');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          পণ্যের ছবি (Product Image) *
        </label>
        {activeImage && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" /> ছবি সংযুক্ত আছে
          </span>
        )}
      </div>

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
          }
        }}
      />

      {/* Camera Modal / Live View */}
      {isCameraActive && (
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 p-2 shadow-lg">
          <div className="relative aspect-square max-h-72 w-full flex items-center justify-center bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-dashed border-emerald-400/60 rounded-xl pointer-events-none m-4 flex items-center justify-center">
              <span className="text-white/70 text-xs bg-black/40 px-2 py-1 rounded">
                পণ্যটি ফ্রেমের মাঝে রাখুন
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 px-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={stopCamera}
              className="text-white border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs"
            >
              বাতিল
            </Button>
            <button
              type="button"
              onClick={capturePhoto}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" /> ছবি তুলুন
            </button>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
          {cameraError}
        </div>
      )}

      {/* Primary Dropzone & Preview Box */}
      {!isCameraActive && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-200 text-center ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-50/80'
          }`}
        >
          {activeImage ? (
            <div className="space-y-3">
              {/* Image Display */}
              <div className="relative group mx-auto w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex items-center justify-center">
                <img
                  src={activeImage}
                  alt="Product preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-2"
                />

                {/* Overlays */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => removeImage(activeImageIndex, e)}
                    className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                    title="ছবি ডিলিট করুন"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Banner: Use Original vs AI Product Studio */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-left">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">ছবি নির্বাচন সম্পন্ন</span>
                    {activeImage.includes('data:image/svg+xml') && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                        AI স্টুডিও প্রসেসড
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    মূল ছবি ব্যবহার করতে পারেন অথবা AI দিয়ে ছবির কোয়ালিটি বাড়াতে পারেন
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Already using this image
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Use Original
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenAiStudio(activeImage)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    AI Product Studio
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                <ImageIcon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  পণ্যের ছবি আপলোড করুন অথবা ড্রপ করুন
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  JPG, PNG, WEBP বা একাধিক ছবি একসাথে সাপোর্ট করে (Max 10MB)
                </p>
              </div>

              {/* Upload Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> ফাইল সিলেক্ট করুন
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-600" /> ক্যামেরা তুলুন
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multiple Images Selector Bar */}
      {selectedImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {selectedImages.map((img, idx) => (
            <div
              key={idx}
              onClick={() => {
                setActiveImageIndex(idx);
                onImageChange(img);
              }}
              className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${
                activeImageIndex === idx
                  ? 'border-emerald-500 ring-2 ring-emerald-300'
                  : 'border-slate-200 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumb ${idx}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => removeImage(idx, e)}
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-[9px]"
              >
                ×
              </button>
            </div>
          ))}

          {/* Add more button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 text-slate-400 hover:text-emerald-600 flex flex-col items-center justify-center flex-shrink-0 text-xs transition-colors cursor-pointer bg-white"
            title="আরও ছবি যোগ করুন"
          >
            <Upload className="w-4 h-4" />
            <span className="text-[10px]">+যোগ</span>
          </button>
        </div>
      )}
    </div>
  );
};
