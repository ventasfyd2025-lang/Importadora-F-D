'use client';

import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

type PopupSize = '1x1' | '2x1' | '2x2' | '3x1' | '3x3' | '6x4' | '6x6';

interface OfferPopupProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
  isActive: boolean;
  size?: PopupSize;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  mediaUrl?: string;
  isVideo?: boolean;
  popupType?: 'category' | 'information';
  onClose: () => void;
}

export default function OfferPopup({
  title,
  description,
  buttonText = "Ver Ofertas",
  buttonLink = "/?filter=ofertas",
  isActive,
  size = '2x2',
  position = 'bottom-right',
  mediaUrl,
  isVideo = false,
  popupType = 'category',
  onClose
}: OfferPopupProps) {
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();

  const sizePresets: Record<PopupSize, { width: number; height: number }> = {
    '1x1': { width: 320, height: 320 },
    '2x1': { width: 560, height: 280 },
    '2x2': { width: 480, height: 480 },
    '3x1': { width: 720, height: 240 },
    '3x3': { width: 640, height: 640 },
    '6x4': { width: 960, height: 640 },
    '6x6': { width: 960, height: 960 }
  };

  const positionClasses: Record<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center', string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  useEffect(() => {
    if (!isActive) {
      setShowPopup(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isActive]);

  const handleClose = () => {
    setShowPopup(false);
    onClose();
  };

  const handleButtonClick = () => {
    if (buttonLink.startsWith('/')) {
      router.push(buttonLink);
    } else {
      window.open(buttonLink, '_blank');
    }
    handleClose();
  };

  if (!isActive || !showPopup) {
    return null;
  }

  const sizePreset = sizePresets[size] ?? sizePresets['2x2'];
  const positionClass = positionClasses[position] ?? positionClasses['bottom-right'];

  const ratio = sizePreset.height / sizePreset.width;
  const paddingPercent = ratio * 100;
  const containerStyle: CSSProperties = {
    width: `min(${sizePreset.width}px, calc(100vw - 2rem), calc((100vh - 2rem) / ${ratio.toFixed(3)}))`,
    maxWidth: 'calc(100vw - 2rem)',
    maxHeight: 'calc(100vh - 2rem)'
  };

  const bgStyle: CSSProperties | undefined = mediaUrl && !isVideo
    ? { backgroundImage: `url(${mediaUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  return (
    <div className={`fixed z-[100] ${positionClass}`} style={containerStyle}>
      <div className="relative w-full" style={{ paddingBottom: `${paddingPercent}%` }}>
        <div className="absolute inset-0 rounded-xl shadow-2xl overflow-hidden bg-gradient-to-br from-orange-500 to-red-500" style={bgStyle}>
          {mediaUrl && !isVideo && (
            <div className="absolute inset-0 bg-black/30"></div>
          )}

          {mediaUrl && isVideo && (
            <>
              <video
                autoPlay
                muted
                loop
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={mediaUrl} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-black/20"></div>
            </>
          )}

          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-20 p-1 rounded-full bg-white/80 hover:bg-white transition-all"
          >
            <XMarkIcon className="h-4 w-4 text-gray-600" />
          </button>

          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="text-3xl mb-3">
              {popupType === 'category' ? '🛍️' : '📢'}
            </div>
            <h2 className="text-lg font-bold mb-2">{title}</h2>
            <p className="text-sm mb-4 opacity-90">{description}</p>
            <button
              onClick={handleButtonClick}
              className="bg-white text-orange-500 font-bold py-2 px-4 rounded-lg text-sm hover:shadow-lg transition-all"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
