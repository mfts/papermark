import "@/jobs";
import { client } from "@/trigger";
import { createAppRoute } from "@trigger.dev/nextjs";

// This is the maximum duration of a job in seconds
export const maxDuration = 180;

// This route is used to send and receive data with Trigger.dev
export const { POST, dynamic } = createAppRoute(client);
