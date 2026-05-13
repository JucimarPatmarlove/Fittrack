import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  glow?: boolean;
}

export function GlassCard({ children, glow = false, className = '', style = {}, ...props }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'rgba(18, 25, 35, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(232, 200, 74, 0.15)',
        boxShadow: glow 
          ? '0 0 20px rgba(232, 200, 74, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)' 
          : '0 4px 15px rgba(0,0,0,0.3)',
        ...style
      }}
      className={className}
      {...props}
    >
      {/* Borda animada transparente */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          background: 'linear-gradient(135deg, rgba(232,200,74,0.2) 0%, rgba(232,200,74,0) 50%, rgba(232,200,74,0.1) 100%)',
          opacity: 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.opacity = '0';
        }}
      />
      {children}
    </motion.div>
  );
}
