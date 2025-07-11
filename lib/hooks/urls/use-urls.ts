import React, { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { isValidUrl } from "@/lib/utils";

interface UseUrlsOptions {
    initialUrls?: string[];
    debounceMs?: number;
}

export function useUrls(options: UseUrlsOptions = {}) {
    const { initialUrls = [], debounceMs = 300 } = options;

    const [urls, setUrls] = useState(initialUrls.join("\n"));
    const [invalidUrls, setInvalidUrls] = useState<string[]>([]);

    const parseUrls = (value: string) => {
        return value
            .split(/[\n,]/) // Split on both newlines and commas
            .map((url) => url.trim())
            .filter(Boolean);
    };

    const debouncedUrlValidation = useDebouncedCallback((value: string) => {
        const urlList = parseUrls(value);
        const invalid = urlList.filter((url) => !isValidUrl(url));
        setInvalidUrls(invalid);
    }, debounceMs);

    const handleUrlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setUrls(value);
        debouncedUrlValidation(value);
    };

    const getValidUrls = () => {
        return parseUrls(urls).filter((url) => isValidUrl(url));
    };

    const getAllUrls = () => {
        return parseUrls(urls);
    };

    const hasValidUrls = () => {
        return getValidUrls().length > 0;
    };

    const hasInvalidUrls = () => {
        return invalidUrls.length > 0;
    };

    const isUrlInputValid = () => {
        const allUrls = getAllUrls();
        const validUrls = getValidUrls();
        return allUrls.length > 0 && allUrls.length === validUrls.length;
    };

    const resetUrls = (newUrls?: string[]) => {
        const urlsToSet = newUrls || initialUrls;
        setUrls(urlsToSet.join("\n"));
        setInvalidUrls([]);
    };

    return {
        urls,
        invalidUrls,
        handleUrlChange,
        getValidUrls,
        getAllUrls,
        hasValidUrls,
        hasInvalidUrls,
        isUrlInputValid,
        resetUrls,
        setUrls,
    };
} 