import { useEffect } from "react";

interface UseDisablePrintOptions {
    className?: string;
    styleId?: string;
}

export function useDisablePrint({
    className = "printing-disabled",
    styleId = "printing-disabled-style",
}: UseDisablePrintOptions = {}) {
    useEffect(() => {
        let style = document.getElementById(styleId) as HTMLStyleElement | null;
        if (!style) {
            style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
        @media print {
          body.${className} * {
            display: none !important;
          }
        }
      `;
            document.head.appendChild(style);
        }

        const handleBeforePrint = () => {
            document.body.classList.add(className);
        };

        const handleAfterPrint = () => {
            document.body.classList.remove(className);
        };

        window.addEventListener("beforeprint", handleBeforePrint);
        window.addEventListener("afterprint", handleAfterPrint);

        const mediaQueryList = window.matchMedia?.("print");
        const mediaQueryHandler = (e: MediaQueryListEvent) => {
            if (e.matches) {
                handleBeforePrint();
            } else {
                handleAfterPrint();
            }
        };

        mediaQueryList?.addEventListener?.("change", mediaQueryHandler);

        return () => {
            if (style && style.textContent?.includes(`body.${className}`)) {
                style.remove();
            }

            window.removeEventListener("beforeprint", handleBeforePrint);
            window.removeEventListener("afterprint", handleAfterPrint);
            mediaQueryList?.removeEventListener?.("change", mediaQueryHandler);
        };
    }, [className, styleId]);
}