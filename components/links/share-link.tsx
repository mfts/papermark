import React, { useState } from "react";
import { Linkedin, Facebook, MailIcon } from "lucide-react";
import Whatsapp from "../shared/icons/whatsapp";
import Reddit from "../shared/icons/reddit";
import Twitter from "../shared/icons/twitter";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { copyToClipboard } from "@/lib/utils";

type ShareLinkPorps = {
  url: string;
  title: string;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ShareLink = ({ url, title, isOpen, setIsOpen }: ShareLinkPorps) => {
  const [isCopied, setIsCopied] = useState(false);

  const platforms = [
    {
      name: "Linkedin",
      icon: Linkedin,
      url: "https://www.linkedin.com/shareArticle?url=encodedUrl&title=encodedTitle",
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: "https://twitter.com/intent/tweet?url=encodedUrl&text=encodedTitle",
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: "https://www.facebook.com/sharer/sharer.php?u=encodedUrl&quote=encodedTitle",
    },
    {
      name: "Email",
      icon: MailIcon,
      url: "mailto:?subject=encodedTitle&body=encodedTitle: encodedUrl",
    },
    {
      name: "Reddit",
      icon: Reddit,
      url: "https://www.reddit.com/submit?url=encodedUrl&title=encodedTitle",
    },
    {
      name: "WhatsApp",
      icon: Whatsapp,
      url: `https://api.whatsapp.com/send?text=encodedTitle: encodedUrl`,
    },
  ];

  const handleCopyLink = () => {
    copyToClipboard(url, "Link copied to clipboard.");
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => setIsOpen(open)}>
      <DialogContent className="!w-[90%] sm:!w-[550px] sm:p-7">
        <DialogHeader>
          <DialogTitle className="text-start">Share Document URL</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:space-x-2 mt-4 mb-8">
          {platforms.map((item) => (
            <a
              key={item.name}
              href={item.url
                .replace("encodedUrl", encodeURIComponent(url))
                .replace("encodedTitle", encodeURIComponent(title))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center text-xs w-[75px] h-[70px] rounded-md border px-2 py-1 *:opacity-90 m-1.5 sm:m-0 hover:bg-secondary duration-200"
            >
              <span className="*:w-6 *:h-6 mb-1">
                <item.icon />
              </span>
              {item.name}
            </a>
          ))}
        </div>

        <p className="mb-1 text-sm font-medium opacity-80">Or Copy Link</p>
        <div className="w-full py-1 px-3 pr-1 border rounded-md flex items-center justify-between">
          <span className="w-full truncate text-sm overflow-hidden">{url}</span>
          <Button
            className="ml-2 h-8 ring-0 outline-none"
            variant="outline"
            onClick={handleCopyLink}
          >
            {isCopied ? "Copied" : "Copy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareLink;
