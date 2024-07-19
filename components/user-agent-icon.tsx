import {
  Gamepad2Icon,
  MonitorIcon,
  SmartphoneIcon,
  TabletSmartphoneIcon,
  TvIcon,
  WatchIcon,
} from "lucide-react";

import { BlurImage } from "@/components/blur-image";
import { Apple, Chrome, Safari } from "@/components/ui/devices";

export default function UAIcon({
  display,
  type,
  className,
}: {
  display: string;
  type: "devices" | "browsers" | "os";
  className: string;
}) {
  if (type === "devices") {
    switch (display) {
      case "Desktop":
        return <MonitorIcon className={className} />;
      case "Mobile":
        return <SmartphoneIcon className={className} />;
      case "Tablet":
        return <TabletSmartphoneIcon className={className} />;
      case "Wearable":
        return <WatchIcon className={className} />;
      case "Console":
        return <Gamepad2Icon className={className} />;
      case "Smarttv":
        return <TvIcon className={className} />;
      default:
        return <MonitorIcon className={className} />;
    }
  } else if (type === "browsers") {
    if (display === "Chrome") {
      return <Chrome className={className} />;
    } else if (display === "Safari" || display === "Mobile Safari") {
      return <Safari className={className} />;
    } else {
      return (
        <BlurImage
          src={`https://faisalman.github.io/ua-parser-js/images/browsers/${display.toLowerCase()}.png`}
          alt={display}
          width={20}
          height={20}
          className={className}
        />
      );
    }
  } else if (type === "os") {
    if (display === "Mac OS" || display === "iOS") {
      return <Apple className="-mx-1 h-5 w-5" />;
    } else {
      return (
        <BlurImage
          src={`https://faisalman.github.io/ua-parser-js/images/os/${display.toLowerCase()}.png`}
          alt={display}
          width={30}
          height={20}
          className="h-4 w-5"
        />
      );
    }
  } else {
    return (
      <BlurImage
        src={`https://faisalman.github.io/ua-parser-js/images/companies/default.png`}
        alt={display}
        width={20}
        height={20}
        className={className}
      />
    );
  }
}
