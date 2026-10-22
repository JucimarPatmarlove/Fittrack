import React, { useEffect, useRef, useState } from 'react';

interface ChartContainerProps {
  children: React.ReactElement;
  minWidth?: number;
  minHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ChartContainer replaces ResponsiveContainer by using ResizeObserver
 * to measure the actual container size and pass explicit width/height
 * to the chart child. This prevents the infinite render loop caused
 * by ResponsiveContainer's internal measurement cycle.
 */
export function ChartContainer({
  children,
  minWidth = 0,
  minHeight = 0,
  className = '',
  style = {},
}: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial measurement
    const rect = container.getBoundingClientRect();
    setDimensions({
      width: Math.max(rect.width, minWidth),
      height: Math.max(rect.height, minHeight),
    });

    const resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to batch measurements and prevent layout thrashing
      rafRef.current = requestAnimationFrame(() => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setDimensions(() => ({
            width: Math.max(width, minWidth),
            height: Math.max(height, minHeight),
          }));
        }
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [minWidth, minHeight]);

  // Don't render until we have valid dimensions to prevent flash
  if (dimensions.width === 0 || dimensions.height === 0) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          ...style,
          minWidth,
          minHeight,
          width: '100%',
          height: '100%',
        }}
      />
    );
  }

  // Clone the child and inject explicit width/height
  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        ...style,
        width: '100%',
        height: '100%',
        minWidth,
        minHeight,
      }}
    >
      {React.cloneElement(children as React.ReactElement<any>, {
        width: dimensions.width,
        height: dimensions.height,
      })}
    </div>
  );
}