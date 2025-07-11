import { useState } from "react";

import { CircleXIcon } from "lucide-react";
import { createPortal } from "react-dom";

export const SecuredByPapermark = ({
  linkId,
  isClosable = true,
}: {
  linkId: string;
  isClosable?: boolean;
}) => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
      <div className="flex items-center justify-between px-12 py-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <span>© {new Date().getFullYear()} All rights reserved</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span>Secured by</span>
          <a
            href={`https://www.papermark.com?utm_campaign=securedby&utm_medium=securedby&utm_source=papermark-${linkId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            Papermark
          </a>
        </div>
        {isClosable && (
          <button
            onClick={() => setVisible(false)}
            className="absolute right-4 rounded text-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <CircleXIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
};
