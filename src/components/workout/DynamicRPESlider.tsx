import React from "react";

export const DynamicRPESlider = ({ value, onChange, theme }: { value: number, onChange: (v: number) => void, theme: any }) => {
  const getRPEColor = (rpe: number) => {
    if (rpe <= 6) return theme.success;
    if (rpe <= 8) return theme.accent;
    return theme.danger;
  };
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onChange(val);
    if (navigator.vibrate) navigator.vibrate(10);
  };
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
      <input
        type="range"
        min="1" max="10" step="0.5"
        value={value || 8}
        onChange={handleSliderChange}
        style={{
          width: '100%',
          accentColor: getRPEColor(value || 8),
          background: `linear-gradient(to right, ${getRPEColor(value || 8)} ${(value || 8) * 10}%, #1e2832 ${(value || 8) * 10}%)`,
          height: '4px', borderRadius: '4px', outline: 'none', appearance: 'none'
        }}
      />
      <div style={{ position: 'absolute', top: -15, right: 0, fontSize: 10, color: getRPEColor(value || 8), fontWeight: 'bold' }}>{value || 8}</div>
    </div>
  );
};
