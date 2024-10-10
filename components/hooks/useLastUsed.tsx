import { classNames } from "@/lib/utils";
import { localStorage } from "@/lib/webstorage";
import { useState, useEffect } from "react";




type LoginType = "saml" | "google" | "credentials" | "linkedin";

export function useLastUsed() {
    const [lastUsed, setLastUsed] = useState<LoginType>();

    useEffect(() => {
        const storedValue = localStorage.getItem("last_papermark_login");
        if (storedValue) {
            setLastUsed(storedValue as LoginType);
        }
    }, []);

    useEffect(() => {
        if (lastUsed) {
            localStorage.setItem("last_papermark_login", lastUsed);
        } else {
            localStorage.removeItem("last_papermark_login");
        }
    }, [lastUsed]);

    return [lastUsed, setLastUsed] as const;
}

export const LastUsed = ({ className }: { className?: string | undefined }) => {
    return (
        <span className={classNames("text-gray-500 absolute right-1 text-xs", className ?? "")}>{("last_used")}</span>
    );
};
