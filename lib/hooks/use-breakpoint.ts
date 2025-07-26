import { useEffect, useState } from "react";

export function useBreakpoint(breakpoint: number) {
  const [isSmaller, setIsSmaller] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // Use matchMedia for better performance
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const handleChange = () => {
      const newIsSmaller = window.innerWidth <= breakpoint - 1;
      setIsSmaller((prevIsSmaller) => {
        // Only update state if the value actually changed
        if (prevIsSmaller !== newIsSmaller) {
          return newIsSmaller;
        }
        return prevIsSmaller;
      });
    };

    // Set initial value
    handleChange();

    // Listen for changes using matchMedia (more efficient than resize)
    mediaQuery.addEventListener("change", handleChange);

    // Fallback resize listener with debouncing for edge cases
    let timeoutId: number;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(handleChange, 100); // 100ms debounce
    };

    window.addEventListener("resize", debouncedResize);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return !!isSmaller; // Convert undefined to false for initial render
}
