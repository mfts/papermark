import { aptGet, ffmpeg } from "@trigger.dev/build/extensions/core";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";
import { defineConfig, timeout } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_plmsfqvqunboixacjjus",
  dirs: ["./lib/trigger"],
  maxDuration: timeout.None, // no max duration
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
  build: {
    extensions: [
      prismaExtension({
        schema: "prisma/schema.prisma",
      }),
      ffmpeg(),
      // aptGet({ packages: ["curl"] }),
      // {
      //   name: "mupdf",
      //   onBuildComplete: async (context, manifest) => {
      //     context.addLayer({
      //       id: "mupdf-tools",
      //       image: {
      //         instructions: [
      //           // Install build dependencies
      //           `RUN apt-get update && apt-get install -y \
      //             build-essential \
      //             curl \
      //             xz-utils \
      //             libc-dev \
      //             libstdc++-11-dev \
      //             libgcc-11-dev \
      //             netbase \
      //             libudev-dev \
      //             ca-certificates`,

      //           // Clone and build MuPDF from source
      //           `RUN curl -fsS https://pkgx.sh | sh && \
      //               MUPDF_PATH=$(pkgx +mupdf.com@1.25.2 --json | jq -r '.env.PATH' | cut -d: -f1) && \
      //               ln -sf $MUPDF_PATH/mutool /usr/local/bin/mutool && \
      //               ln -sf $MUPDF_PATH/mudraw /usr/local/bin/mudraw`,
      //         ],
      //       },
      //     });
      //   },
      // },
      {
        name: "nix",
        onBuildComplete: async (context, manifest) => {
          context.addLayer({
            id: "mupdf-tools",
            image: {
              instructions: [
                // Install prerequisites
                `RUN DEBIAN_FRONTEND=noninteractive apt-get update && apt-get install -y curl xz-utils ca-certificates`,

                // Install Nix and mupdf in a new shell session
                `RUN curl -L https://nixos.org/nix/install | sh -s -- --daemon`,
                `SHELL ["/bin/bash", "-l", "-c"]`,
                `RUN . /root/.nix-profile/etc/profile.d/nix.sh && \
                    nix-channel --update && \
                    nix-env -iA nixpkgs.mupdf && \
                    MUPDF_PATH=$(readlink -f $(which mutool)) && \
                    ln -sf $MUPDF_PATH /usr/local/bin/mutool && \
                    chmod 755 /usr/local/bin/mutool && \
                    chown root:root /usr/local/bin/mutool && \
                    echo "Verifying mupdf installation..." && \
                    ls -l /usr/local/bin/mutool && \
                    mutool -v`,
              ],
            },
          });
        },
      },
    ],
  },
});
