'use client';

import React, { useSyncExternalStore } from 'react';
import { Lottie } from 'lottie-react';

interface LottieAnimationProps {
  animationData: object | string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

const subscribe = () => () => {};

export function LottieAnimation({
  animationData,
  className = 'w-16 h-16',
  loop = true,
  autoplay = true,
}: LottieAnimationProps) {
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!isMounted) {
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
