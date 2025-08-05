import { schedules } from "@trigger.dev/sdk/v3";
import { processSlackDigests, cleanupSlackNotifications } from "@/lib/slack/digest-processor";


export const processSlackDigestJob = schedules.task({
    id: "process-slack-digest",
    run: async (payload) => {
        if (!payload.externalId) {
            throw new Error("externalId (integrationId) is required");
        }
        await processSlackDigests(payload.externalId);
    },
});


export const cleanupSlackNotificationsJob = schedules.task({
    id: "cleanup-slack-notifications",
    cron: "0 2 * * *",
    run: async (payload) => {
        await cleanupSlackNotifications(30);
    },
}); 