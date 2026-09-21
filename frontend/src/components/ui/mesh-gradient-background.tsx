'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export interface MeshGradientBackgroundProps {
  colors?: string[];
  speed?: number;
  blur?: number;
  interactive?: boolean;
  children?: React.ReactNode;
}

export const MeshGradientBackground: React.FC<MeshGradientBackgroundProps> = ({
  colors = ['#4f46e5', '#c026d3', '#f59e0b', '#10b981'],
  speed = 12,
  blur = 120,
  interactive = true,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springX = useSpring(mouseX, { damping: 30, stiffness: 100 });
  const springY = useSpring(mouseY, { damping: 30, stiffness: 100 });

  const cursorLeft = useTransform(springX, [0, 1], ['0%', '100%']);
  const cursorTop = useTransform(springY, [0, 1], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive) return;
    const { clientX, clientY } = e;
    mouseX.set(clientX / window.innerWidth);
    mouseY.set(clientY / window.innerHeight);
  };

  const blobs = [
    { x: '10%', y: '15%', animX: [0, 80, -60, 40, 0], animY: [0, -50, 70, -30, 0] },
    { x: '85%', y: '20%', animX: [0, -70, 40, -80, 0], animY: [0, 60, -40, 50, 0] },
    { x: '75%', y: '80%', animX: [0, 50, -70, 30, 0], animY: [0, -70, 40, -50, 0] },
    { x: '15%', y: '85%', animX: [0, -40, 60, -50, 0], animY: [0, 50, -60, 40, 0] },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-screen bg-[#020205] overflow-hidden selection:bg-white/20"
    >
      {/* Mesh blobs with 'screen' blend mode for dynamic color mixing */}
      <div className="absolute inset-0 mix-blend-screen overflow-hidden pointer-events-none">
        {blobs.map((blob, i) => (
          <motion.div
            key={i}
            className="absolute w-[600px] h-[600px] rounded-full opacity-60"
            style={{
              left: blob.x,
              top: blob.y,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${colors[i % colors.length]} 0%, transparent 75%)`,
              filter: `blur(${blur}px)`,
            }}
            animate={{
              x: blob.animX,
              y: blob.animY,
              scale: [1, 1.25, 0.9, 1.15, 1],
            }}
            transition={{
              duration: speed + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Interactive Cursor Glow */}
      {interactive && (
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full pointer-events-none opacity-40 mix-blend-screen"
          style={{
            left: cursorLeft,
            top: cursorTop,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${colors[0]} 0%, transparent 70%)`,
            filter: `blur(${blur}px)`,
          }}
        />
      )}

      {/* Noise + Texture */}
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-soft-light pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col justify-between min-h-screen">
        {children}
      </div>

      {/* Dark Vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#020205_100%)] pointer-events-none" />
    </div>
  );
};
