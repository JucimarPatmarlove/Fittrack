import type React from 'react';
import { useState } from 'react';

interface GlowInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerStyle?: React.CSSProperties;
}

export function GlowInput({
  label,
  className = '',
  containerStyle = {},
  style = {},
  ...props
}: GlowInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...containerStyle }}>
      {label && (
        <label style={{ fontSize: '12px', color: '#9ca3af', letterSpacing: '0.05em' }}>
          {label}
        </label>
      )}
      <input
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          if (props.onFocus) props.onFocus(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          if (props.onBlur) props.onBlur(e);
        }}
        className={className}
        style={{
          width: '100%',
          backgroundColor: '#0f1419',
          border: '1px solid',
          borderColor: isFocused ? '#e8c84a' : '#2a2f36',
          borderRadius: '12px',
          padding: '12px 16px',
          color: '#ffffff',
          outline: 'none',
          transition: 'all 0.2s ease-in-out',
          boxShadow: isFocused
            ? '0 0 0 2px rgba(232,200,74,0.2), 0 0 0 4px rgba(232,200,74,0.1)'
            : 'none',
          ...style,
        }}
      />
    </div>
  );
}
