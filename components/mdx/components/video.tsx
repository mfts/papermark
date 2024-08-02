"use client";

import React from "react";

import ReactPlayer from "react-player/youtube";

type VideoProps = {
  url: string;
};

export const YoutubePlayer: React.FC<VideoProps> = ({ url }) => {
  return (
    <div className="mt-4 h-auto w-full">
      <ReactPlayer
        url={url}
        className="aspect-video w-full"
        width="100%"
        height="100%"
        controls
        light
        playing
        config={{
          embedOptions: {
            host: "https://www.youtube-nocookie.com",
          },
        }}
      />
    </div>
  );
};

export const VideoPlayer: React.FC<VideoProps> = ({ url }) => {
  return (
    <div className="mt-4 h-auto w-full">
      <video
        width="100%"
        id="video1"
        aria-hidden="true"
        playsInline
        muted
        loop
        controls
      >
        <source src={url} type="video/mp4" />
      </video>
    </div>
  );
};
