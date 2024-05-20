"use client";

import React, { useState } from "react";

const ImageSwitcher = () => {
  const [currentImage, setCurrentImage] = useState("image3");

  const handleImageChange = (image: React.SetStateAction<string>) => {
    setCurrentImage(image);
  };
  const isActive = (image: string) => currentImage === image;

  return (
    <div className="mx-auto flex w-full flex-col items-center">
      <div className="flex w-full flex-col items-center">
        <div className="flex h-full max-h-[100vh] w-full overflow-hidden rounded-3xl">
          {currentImage === "image1" && (
            <img
              src="https://assets.papermark.io/upload/file_CDitomftzRxJt82S8uhBta-Screenshot-2024-05-18-at-12.51.59-PM.png"
              alt="Image 1"
              className="h-full w-full object-cover"
              style={{ boxShadow: "none" }}
            />
          )}
          {currentImage === "image2" && (
            <img
              src="https://assets.papermark.io/upload/file_Lmm6NZRt9ReP8WRc74p6w9-Screenshot-2024-05-18-at-12.56.53-PM.png"
              alt="Image 2"
              className="h-full w-full object-cover"
            />
          )}
          {currentImage === "image3" && (
            <img
              src="https://assets.papermark.io/upload/file_6yutnL8q4gEc1iJxMbMiaZ-Screenshot-2024-05-18-at-1.02.30-PM.png"
              alt="Image 3"
              className="h-full w-full object-cover"
            />
          )}
          {currentImage === "image4" && (
            <img
              src="https://assets.papermark.io/upload/file_Y1UuAt51v17QtBKTuP9Rj5-Screenshot-2024-05-18-at-12.56.35-PM.png"
              alt="Image 4"
              className="h-full w-full object-cover"
            />
          )}
          {currentImage === "image5" && (
            <img
              src="https://assets.papermark.io/upload/file_7bRAcyf4H3FmSQ74Rh6rMN-Screenshot-2024-05-18-at-1.02.03-PM.png"
              alt="Image 5"
              className="h-full w-full object-cover"
            />
          )}
        </div>
      </div>
      <div className="mb-8 mt-4 flex w-full justify-center">
        <div className="hidden flex-wrap justify-center rounded-3xl border bg-black px-2 py-1 text-sm md:flex">
          <button
            className={`m-2 rounded-full px-4 py-1 ${isActive("image1") ? "bg-[#fb7a00]" : "bg-transparent text-white hover:bg-[#fb7a00]"}`}
            onClick={() => handleImageChange("image1")}
          >
            Upload documents
          </button>
          <button
            className={`m-2 rounded-full px-4 py-1 ${isActive("image2") ? "bg-[#fb7a00]" : "bg-transparent text-white hover:bg-[#fb7a00]"}`}
            onClick={() => handleImageChange("image2")}
          >
            Set link permissions
          </button>
          <button
            className={`m-2 rounded-full px-4 py-1 ${isActive("image3") ? "bg-[#fb7a00]" : "bg-transparent text-white hover:bg-[#fb7a00]"}`}
            onClick={() => handleImageChange("image3")}
          >
            Track time on each page
          </button>
          <button
            className={`m-2 rounded-full px-4 py-1 ${isActive("image4") ? "bg-[#fb7a00]" : "bg-transparent text-white hover:bg-[#fb7a00]"}`}
            onClick={() => handleImageChange("image4")}
          >
            Create data room
          </button>
          <button
            className={`m-2 rounded-full px-4 py-1 ${isActive("image5") ? "bg-[#fb7a00]" : "bg-transparent text-white hover:bg-[#fb7a00]"}`}
            onClick={() => handleImageChange("image5")}
          >
            Set up custom brand and domain
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageSwitcher;
