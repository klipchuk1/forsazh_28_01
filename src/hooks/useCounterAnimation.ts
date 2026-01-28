import { useState, useEffect } from 'react';

export function useCounterAnimation(target: number, duration: number = 1500, start: number = 0) {
  const [displayValue, setDisplayValue] = useState(start);

  useEffect(() => {
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(start + (target - start) * eased);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration, start]);

  return displayValue;
}

export function useIntersectionObserver(options: IntersectionObserverInit = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = (element: HTMLDivElement | null) => {
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, options);
    observer.observe(element);
  };
  return { ref, isVisible };
}
