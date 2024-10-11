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
        <>
            <div className="absolute left-11 sm:left-0 top-1/2 -translate-y-1/2  -translate-x-full">
                <div className="bg-[#333333] text-white text-xs py-1 px-2 rounded-md relative">
                    Last used
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-r-0 border-transparent border-l-[#333333]"></div>
                </div>
            </div>
        </>
    );
};
