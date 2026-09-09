import React, { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
  target: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  target,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [displayVal, setDisplayVal] = useState(`${prefix}0${suffix}`);
  const containerRef = useRef<HTMLHeadingElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          startAnimation();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [target, prefix, suffix]);

  const startAnimation = () => {
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out expo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const val = Math.floor(easeProgress * target);
      let displayString = '';
      
      if (target >= 1000 && (suffix === 'k' || suffix === 'M')) {
        const divisor = suffix === 'k' ? 1000 : 1000000;
        displayString = (val / divisor).toFixed(1);
      } else {
        displayString = val.toLocaleString();
      }

      setDisplayVal(`${prefix}${displayString}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // Ensure final target value is set accurately
        const finalDivisor = (suffix === 'k' || suffix === 'M') ? (suffix === 'k' ? 1000 : 1000000) : 1;
        const finalDisplay = (suffix === 'k' || suffix === 'M') 
          ? (target / finalDivisor).toFixed(1) 
          : target.toLocaleString();
        setDisplayVal(`${prefix}${finalDisplay}${suffix}`);
      }
    };

    requestAnimationFrame(update);
  };

  return (
    <h3 ref={containerRef} className={className}>
      {displayVal}
    </h3>
  );
};

export default AnimatedCounter;
