import { useState, useEffect } from 'react';
// For performant ui change
export function useDebounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    const [timeoutId, setTimeoutId] = useState<number | null>(null);

    useEffect(() => {
        return () => {

            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);

    return function (...args: Parameters<T>) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        const context = this;
        const newTimeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);

        setTimeoutId(newTimeoutId);
    };
}
