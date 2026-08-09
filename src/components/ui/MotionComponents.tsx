// @ts-nocheck
// ============================================================
// FitTrack V7 — Motion Components Library
// ============================================================

import { AnimatePresence, type Variants, motion } from 'framer-motion';
import React, { Suspense } from 'react';
import { useInView } from 'react-intersection-observer';

// ============================================================
// 1. SKELETON — Placeholder de carregamento
// ============================================================

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  circle = false,
  count = 1,
}) => {
  const baseClasses = 'bg-gray-200 animate-pulse';
  const shapeClasses = circle ? 'rounded-full' : 'rounded';

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${shapeClasses} ${className}`}
          style={{ width, height }}
        />
      ))}
    </>
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        width={i === lines - 1 ? '75%' : '100%'}
        height="1rem"
        className="rounded"
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 rounded-xl border bg-white ${className}`}>
    <Skeleton width="60%" height="1.25rem" className="mb-3" />
    <SkeletonText lines={2} />
    <div className="flex gap-2 mt-3">
      <Skeleton width="4rem" height="2rem" className="rounded-lg" />
      <Skeleton width="4rem" height="2rem" className="rounded-lg" />
    </div>
  </div>
);

export const SkeletonBodyMap: React.FC = () => (
  <div className="w-[200px] h-[280px] flex items-center justify-center">
    <Skeleton width="160px" height="240px" circle className="opacity-50" />
  </div>
);

// ============================================================
// 2. LAZY LOAD WRAPPER — Suspense com skeleton
// ============================================================

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  skeleton?: 'card' | 'text' | 'bodymap' | 'custom';
  skeletonClassName?: string;
}

export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  fallback,
  skeleton = 'card',
  skeletonClassName = '',
}) => {
  const skeletonMap = {
    card: <SkeletonCard className={skeletonClassName} />,
    text: <SkeletonText className={skeletonClassName} />,
    bodymap: <SkeletonBodyMap />,
    custom: null,
  };

  return (
    <Suspense fallback={fallback || skeletonMap[skeleton] || <SkeletonCard />}>{children}</Suspense>
  );
};

// ============================================================
// 3. ENTRANCE ANIMATIONS — Fade, Slide, Scale
// ============================================================

const defaultEasing = [0.4, 0, 0.2, 1]; // ease-out

interface AnimatedProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<AnimatedProps> = ({
  children,
  delay = 0,
  duration = 0.4,
  className = '',
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration, delay, ease: defaultEasing }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideUp: React.FC<AnimatedProps> = ({
  children,
  delay = 0,
  duration = 0.4,
  className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration, delay, ease: defaultEasing }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideIn: React.FC<AnimatedProps & { direction?: 'left' | 'right' }> = ({
  children,
  delay = 0,
  duration = 0.4,
  direction = 'right',
  className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, x: direction === 'right' ? 30 : -30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration, delay, ease: defaultEasing }}
    className={className}
  >
    {children}
  </motion.div>
);

export const ScaleIn: React.FC<AnimatedProps> = ({
  children,
  delay = 0,
  duration = 0.35,
  className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration, delay, ease: defaultEasing }}
    className={className}
  >
    {children}
  </motion.div>
);

// ============================================================
// 4. STAGGER LIST — Animação sequencial de itens
// ============================================================

interface StaggerListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  itemDuration?: number;
  className?: string;
}

export const StaggerList: React.FC<StaggerListProps> = ({
  children,
  staggerDelay = 0.08,
  itemDuration = 0.35,
  className = '',
}) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: staggerDelay },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: itemDuration, ease: defaultEasing },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {React.Children.map(children, (child, i) => (
        <motion.div key={i} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// ============================================================
// 5. SCROLL TRIGGER — Animação ao entrar no viewport
// ============================================================

interface ScrollRevealProps {
  children: React.ReactNode;
  threshold?: number;
  triggerOnce?: boolean;
  animation?: 'fade' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scale';
  delay?: number;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  threshold = 0.2,
  triggerOnce = true,
  animation = 'slideUp',
  delay = 0,
  className = '',
}) => {
  const { ref, inView } = useInView({ threshold, triggerOnce });

  const animations = {
    fade: { opacity: 0 },
    slideUp: { opacity: 0, y: 30 },
    slideLeft: { opacity: 0, x: -30 },
    slideRight: { opacity: 0, x: 30 },
    scale: { opacity: 0, scale: 0.9 },
  };

  return (
    <motion.div
      ref={ref}
      initial={animations[animation]}
      animate={inView ? { opacity: 1, y: 0, x: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: defaultEasing }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ============================================================
// 6. PAGE TRANSITION — Transição entre screens
// ============================================================

interface PageTransitionProps {
  children: React.ReactNode;
  direction?: number;
  className?: string;
  viewKey?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  direction = 1,
  className = '',
  viewKey,
}) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={viewKey}
      initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
      transition={{ duration: 0.35, ease: defaultEasing }}
      className={className}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

// ============================================================
// 7. MODAL / PANEL — Com enter/exit animations
// ============================================================

interface AnimatedPanelProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
  position?: 'bottom' | 'right' | 'center';
}

export const AnimatedPanel: React.FC<AnimatedPanelProps> = ({
  children,
  isOpen,
  onClose,
  className = '',
  position = 'bottom',
}) => {
  const positionAnimations = {
    bottom: {
      hidden: { y: '100%' },
      visible: { y: 0 },
    },
    right: {
      hidden: { x: '100%' },
      visible: { x: 0 },
    },
    center: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={positionAnimations[position].hidden}
            animate={positionAnimations[position].visible}
            exit={positionAnimations[position].hidden}
            transition={{ duration: 0.3, ease: defaultEasing }}
            className={`fixed z-50 ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================================
// 8. MICRO-INTERACTIONS — Botões, cards, toggles
// ============================================================

interface InteractiveProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const InteractiveButton: React.FC<InteractiveProps> = ({
  children,
  onClick,
  className = '',
  disabled = false,
}) => (
  <motion.button
    whileTap={disabled ? {} : { scale: 0.97 }}
    whileHover={disabled ? {} : { scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    onClick={onClick}
    disabled={disabled}
    className={className}
  >
    {children}
  </motion.button>
);

export const InteractiveCard: React.FC<InteractiveProps> = ({
  children,
  onClick,
  className = '',
}) => (
  <motion.div
    whileTap={{ scale: 0.98 }}
    whileHover={{ scale: 1.01, y: -2 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    onClick={onClick}
    className={`cursor-pointer ${className}`}
  >
    {children}
  </motion.div>
);

// ============================================================
// 9. PROGRESS INDICATORS — Determinados e indeterminados
// ============================================================

interface ProgressBarProps {
  progress: number;
  className?: string;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  color = 'bg-blue-600',
}) => (
  <div className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
    <motion.div
      className={`h-full ${color} rounded-full`}
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(progress, 100)}%` }}
      transition={{ duration: 0.5, ease: defaultEasing }}
    />
  </div>
);

// ============================================================
// 10. REDUCED MOTION — Respeitar preferências de acessibilidade
// ============================================================

import { useReducedMotion } from 'framer-motion';

export const usePrefersReducedMotion = (): boolean => {
  return useReducedMotion() || false;
};

export const AccessibleMotion: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const shouldReduce = usePrefersReducedMotion();
  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }
  return <>{children}</>;
};

export default {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonBodyMap,
  LazyLoad,
  FadeIn,
  SlideUp,
  SlideIn,
  ScaleIn,
  StaggerList,
  ScrollReveal,
  PageTransition,
  AnimatedPanel,
  InteractiveButton,
  InteractiveCard,
  ProgressBar,
  usePrefersReducedMotion,
  AccessibleMotion,
};
