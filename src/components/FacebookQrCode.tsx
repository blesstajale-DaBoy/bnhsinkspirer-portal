import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ExternalLink } from 'lucide-react';

interface FacebookQrCodeProps {
  className?: string;
  size?: number;
}

export const FacebookQrCode: React.FC<FacebookQrCodeProps> = ({
  className = '',
  size = 76,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const fbUrl = 'https://www.facebook.com/profile.php?id=61565709500947';

  useEffect(() => {
    QRCode.toDataURL(
      fbUrl,
      {
        width: size * 2, // 2x resolution for crisp high-DPI displays
        margin: 1,
        color: {
          dark: '#38080F', // School deep maroon
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [size, fbUrl]);

  return (
    <a
      href={fbUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block bg-white/95 hover:bg-white text-stone-900 rounded-lg p-1.5 shadow-xl border-2 border-[#D4AF37] hover:border-[#F3C562] transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-2xl ${className}`}
      title="Scan QR Code or Click to Visit The Inkspirer Facebook Page"
      aria-label="The Inkspirer Facebook Page QR Code"
    >
      <div className="flex flex-col items-center">
        {/* Header Tag with Facebook Brand Styling */}
        <div className="w-full flex items-center justify-between gap-1 pb-1 px-0.5 border-b border-stone-200 text-[9px] font-bold text-[#1877F2]">
          <span className="flex items-center gap-1">
            <svg
              className="w-2.5 h-2.5 fill-[#1877F2]"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="text-[9px] tracking-tight uppercase text-stone-800">FB Page</span>
          </span>
          <ExternalLink className="w-2.5 h-2.5 text-stone-400 group-hover:text-[#1877F2] transition-colors" />
        </div>

        {/* QR Code Image Container */}
        <div className="relative p-0.5 bg-white rounded flex items-center justify-center my-0.5">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="The Inkspirer Official Facebook Page QR Code"
              className="object-contain rounded"
              style={{ width: `${size}px`, height: `${size}px` }}
            />
          ) : (
            <div
              className="animate-pulse bg-stone-100 rounded flex items-center justify-center text-[10px] text-stone-400"
              style={{ width: `${size}px`, height: `${size}px` }}
            >
              Loading QR...
            </div>
          )}
        </div>

        {/* Action Prompt */}
        <div className="pt-0.5 text-center">
          <span className="text-[8px] font-bold text-[#4A0E17] group-hover:text-[#801625] transition-colors uppercase tracking-wider block">
            Scan or Tap
          </span>
        </div>
      </div>
    </a>
  );
};
