'use client';

import React, { useEffect, useState } from 'react';
import { Lottie } from 'lottie-react';

interface LottieAnimationProps {
  animationData: object | string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export function LottieAnimation({
  animationData,
  className = 'w-16 h-16',
  loop = true,
  autoplay = true,
}: LottieAnimationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={className} />;
  }

  return (
    <div className={className}>
      <Lottie
        src={animationData}
        loop={loop}
        autoplay={autoplay}
        className="w-full h-full"
      />
    </div>
  );
}
