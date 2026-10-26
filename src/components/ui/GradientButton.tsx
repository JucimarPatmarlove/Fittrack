import { motion } from 'framer-motion';
import type React from 'react';
import { useCallback } from 'react';

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export function GradientButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  style = {},
  ariaLabel,
}: GradientButtonProps) {
  const gradients = {
    primary: 'linear-gradient(135deg, #e8c84a 0%, #d4b83a 100%)',
    secondary: 'linear-gradient(135deg, #2a3a4a 0%, #1e2e3e 100%)',
    danger: 'linear-gradient(135deg, #e84a4a 0%, #c23a3a 100%)',
  };

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '0';
  }, []);

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      aria-label={ariaLabel ?? (typeof children === 'string' ? children : undefined)}
      className={className}
      style={{
        position: 'relative',
        padding: '12px 24px',
        borderRadius: '12px',
        fontWeight: 'bold',
        fontSize: '14px',
        letterSpacing: '1px',
        transition: 'all 0.2s ease-in-out',
        background: gradients[variant],
        color: variant === 'primary' ? '#080b0f' : '#fff',
        boxShadow: disabled ? 'none' : '0 4px 15px rgba(232,200,74,0.25)',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
        overflow: 'hidden',
        outline: 'none',
        ...style,
      }}
    >
      <span style={{ position: 'relative', zIndex: 10 }}>{children}</span>
      {!disabled && variant === 'primary' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            backgroundColor: 'rgba(255,255,255,0.2)',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.2s',
            zIndex: 1,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}
    </motion.button>
  );
}
