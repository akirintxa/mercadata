'use client';

import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductThumbProps {
  src?: string;
  alt: string;
  className?: string;
}

/**
 * Small product photo with a neutral placeholder when the store gives no
 * image or the image fails to load (some stores block hotlinking).
 */
export function ProductThumb({ src, alt, className }: ProductThumbProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        'shrink-0 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center',
        className ?? 'w-16 h-16'
      )}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-contain p-1"
        />
      ) : (
        <ImageOff className="w-5 h-5 text-slate-300" />
      )}
    </div>
  );
}
