import { createAppRoute } from "@trigger.dev/nextjs";
import { client } from "@/trigger";

import "@/jobs";

// This is the maximum duration of a job in seconds
export const maxDuration = 60;

// This route is used to send and receive data with Trigger.dev
export const { POST, dynamic } = createAppRoute(client);
