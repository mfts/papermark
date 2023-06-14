import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function classNames(...classes: string[]) {
  const uniqueClasses = Array.from(new Set(classes.join(" ").split(" ")));
  return uniqueClasses.join(" ");
}

export function getExtension(url: string) {
  // @ts-ignore
  return url.split(/[#?]/)[0].split(".").pop().trim();
}

interface SWRError extends Error {
  status: number;
}

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init);

  if (!res.ok) {
    const error = await res.text();
    const err = new Error(error) as SWRError;
    err.status = res.status;
    throw err;
  }

  return res.json();
}

export const log = async (message: string) => {
  /* Log a message to the console */
  try {
    return await fetch(`${process.env.PPMK_SLACK_WEBHOOK_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${message}`,
            },
          },
        ],
      }),
    });
  } catch (e) {
    console.log(`Failed to log to Dub Slack. Error: ${e}`);
  }
};

export function bytesToSize(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "n/a";
  const i = Math.floor(Math.log(bytes) / Math.log(1000));
  if (i === 0) return `${bytes} ${sizes[i]}`;
  const sizeInCurrentUnit = bytes / Math.pow(1000, i);
  if (sizeInCurrentUnit >= 1000 && i < sizes.length - 1) {
    return `1 ${sizes[i + 1]}`;
  }
  return `${Math.round(sizeInCurrentUnit)} ${sizes[i]}`;
}
