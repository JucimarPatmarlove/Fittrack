import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  glow?: boolean;
  hoverable?: boolean;
}

export function GlassCard({ 
  children, 
  glow = false, 
  hoverable = true,
  className = '', 
  style = {}, 
  ...props 
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={hoverable ? { 
        y: -2, 
        scale: 1.01,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      } : undefined}
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        background: glow 
          ? 'linear-gradient(135deg, rgba(232,200,74,0.08) 0%, rgba(18,25,35,0.6) 50%, rgba(232,200,74,0.04) 100%)'
          : 'rgba(18, 25, 35, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: glow 
          ? '1px solid rgba(232, 200, 74, 0.25)' 
          : '1px solid rgba(232, 200, 74, 0.08)',
        boxShadow: glow 
          ? '0 0 20px rgba(232, 200, 74, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)' 
          : '0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        ...style
      }}
      className={className}
      {...props}
    >
      {/* Overlay gradient animado no hover */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          background: 'linear-gradient(135deg, rgba(232,200,74,0.12) 0%, transparent 50%, rgba(232,200,74,0.06) 100%)',
        }}
      />
      
      {/* Borda sutil com gradiente */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          padding: '1px',
          background: glow 
            ? 'linear-gradient(135deg, rgba(232,200,74,0.3), transparent 50%, rgba(232,200,74,0.1))'
            : 'transparent',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {children}
    </motion.div>
  );
}