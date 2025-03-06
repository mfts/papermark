import { COUNTRIES } from "@/lib/constants";

import UAIcon from "../user-agent-icon";

function decodeCity(city: string) {
  try {
    return decodeURIComponent(city);
  } catch (e) {
    // If decoding fails, return the original string
    return city;
  }
}

export default function VisitorUserAgentBase({
  userAgent,
}: {
  userAgent: {
    device: string;
    browser: string;
    os: string;
    country?: string;
    city?: string;
  };
}) {
  const { device, browser, os, country, city } = userAgent;

  return (
    <div>
      <div className="pb-0.5 pl-0.5 md:pb-1 md:pl-1">
        {city && country ? (
          <div className="flex items-center">
            <div className="flex items-center gap-x-1 px-1">
              <img
                alt={country}
                src={`https://flag.vercel.app/m/${country}.svg`}
                className="h-3 w-4"
              />
              <span>{decodeCity(city)},</span>
              <span>{COUNTRIES[country]}</span>
            </div>
          </div>
        ) : null}
      </div>
      <div className="pb-0.5 pl-0.5 md:pb-1 md:pl-1">
        <div className="flex items-center">
          <div className="flex items-center gap-x-1 px-1">
            <UAIcon display={device} type="devices" className="size-4" />{" "}
            {device},
          </div>
          <div className="flex items-center gap-x-1 px-1">
            <UAIcon display={browser} type="browsers" className="size-4" />{" "}
            {browser},
          </div>
          <div className="flex items-center gap-x-1 px-1">
            <UAIcon display={os} type="os" className="size-4" /> {os}
          </div>
        </div>
      </div>
    </div>
  );
}
