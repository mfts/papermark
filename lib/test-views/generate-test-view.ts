import { newId } from "@/lib/id-helper";
import { publishPageView } from "@/lib/tinybird";

// Test viewers details (Iuliia first, then Marc)
const TEST_VIEWERS = [
  {
    email: "iuliia@papermark.com",
    name: "Iuliia Shnai",
  },
  {
    email: "marc@papermark.com",
    name: "Marc Seitz",
  },
];

// Export first viewer for backwards compatibility
const TEST_VIEWER = TEST_VIEWERS[0];

interface GenerateTestViewParams {
  viewId: string;
  linkId: string;
  documentId: string;
  numPages: number;
  versionNumber?: number;
  completionPercentage?: number; // 0-100, defaults to 100
}

/**
 * Generate random duration for a page view (5-120 seconds in milliseconds)
 */
function getRandomDuration(): number {
  const minSeconds = 5;
  const maxSeconds = 120;
  return Math.floor(
    Math.random() * (maxSeconds - minSeconds + 1) + minSeconds
  ) * 1000;
}

/**
 * Generate a random time offset within the last 24 hours
 */
function getRandomTimeOffset(): number {
  const maxHoursAgo = 24;
  const hoursAgo = Math.random() * maxHoursAgo;
  return Math.floor(hoursAgo * 60 * 60 * 1000);
}

/**
 * Generate page view events for all pages of a document
 * Each page gets a random viewing duration, simulating realistic engagement
 */
export async function generateTestPageViews({
  viewId,
  linkId,
  documentId,
  numPages,
  versionNumber = 1,
  completionPercentage = 100,
}: GenerateTestViewParams): Promise<void> {
  const baseTime = Date.now() - getRandomTimeOffset();
  
  // Calculate how many pages to view based on completion percentage
  const pagesToView = Math.max(1, Math.ceil((completionPercentage / 100) * numPages));
  
  // Generate page views for each page up to the completion percentage
  const pageViewPromises = [];
  let cumulativeTime = 0;
  
  for (let page = 1; page <= pagesToView; page++) {
    const duration = getRandomDuration();
    const pageViewTime = baseTime + cumulativeTime;
    
    const pageViewData = {
      id: newId("view"),
      linkId,
      documentId,
      viewId,
      dataroomId: null,
      versionNumber,
      time: pageViewTime,
      duration,
      pageNumber: page.toString(),
      country: "United States",
      city: "San Francisco",
      region: "California",
      latitude: "37.7749",
      longitude: "-122.4194",
      ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      browser: "Chrome",
      browser_version: "121.0.0.0",
      engine: "Blink",
      engine_version: "121.0.0.0",
      os: "Mac OS",
      os_version: "10.15.7",
      device: "Desktop",
      device_vendor: "Apple",
      device_model: "Macintosh",
      cpu_architecture: "amd64",
      bot: false,
      referer: "(direct)",
      referer_url: "(direct)",
    };
    
    pageViewPromises.push(publishPageView(pageViewData));
    cumulativeTime += duration;
  }
  
  await Promise.all(pageViewPromises);
}

export { TEST_VIEWER, TEST_VIEWERS };
