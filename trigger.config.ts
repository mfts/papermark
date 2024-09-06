import { PrismaInstrumentation } from "@prisma/instrumentation";
import type { TriggerConfig } from "@trigger.dev/sdk/v3";

export const config: TriggerConfig = {
  project: "proj_plmsfqvqunboixacjjus",
  triggerDirectories: ["./lib/trigger"],
  instrumentations: [new PrismaInstrumentation()],
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dependenciesToBundle: ["nanoid"],
  additionalFiles: ["./prisma/schema.prisma"],
  additionalPackages: ["prisma@5.11.0"],
  postInstall: "npm exec --package prisma -- prisma generate",
};
