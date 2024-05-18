"use client";

import React, { useState } from "react";

const ImageSwitcher = () => {
  const [currentImage, setCurrentImage] = useState("image3");

  const handleImageChange = (image: React.SetStateAction<string>) => {
    setCurrentImage(image);
  };
  const isActive = (image) => currentImage === image;

  return (
    <div className="mx-auto w-full flex flex-col items-center">
      <div className="flex flex-col items-center w-full">
        <div className="flex w-full h-full max-h-[100vh] overflow-hidden rounded-3xl">
          {currentImage === "image1" && (
            <img
              src="https://assets.papermark.io/upload/file_CDitomftzRxJt82S8uhBta-Screenshot-2024-05-18-at-12.51.59-PM.png"
              alt="Image 1"
              className="w-full h-full object-cover"
              style={{ boxShadow: "none" }}
            />
          )}
          {currentImage === "image2" && (
            <img
              src="https://assets.papermark.io/upload/file_Lmm6NZRt9ReP8WRc74p6w9-Screenshot-2024-05-18-at-12.56.53-PM.png"
              alt="Image 2"
              className="w-full h-full object-cover"
            />
          )}
          {currentImage === "image3" && (
            <img
              src="https://assets.papermark.io/upload/file_6yutnL8q4gEc1iJxMbMiaZ-Screenshot-2024-05-18-at-1.02.30-PM.png"
              alt="Image 3"
              className="w-full h-full object-cover"
            />
          )}
          {currentImage === "image4" && (
            <img
              src="https://assets.papermark.io/upload/file_Y1UuAt51v17QtBKTuP9Rj5-Screenshot-2024-05-18-at-12.56.35-PM.png"
              alt="Image 4"
              className="w-full h-full object-cover"
            />
          )}
          {currentImage === "image5" && (
            <img
              src="https://assets.papermark.io/upload/file_7bRAcyf4H3FmSQ74Rh6rMN-Screenshot-2024-05-18-at-1.02.03-PM.png"
              alt="Image 5"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
      <div className="w-full flex justify-center mt-4 mb-8">
        <div className="border bg-black rounded-3xl px-2 py-1 flex flex-wrap justify-center hidden md:flex text-sm">
          <button
            className={`m-2 px-4 py-1 rounded-full ${isActive("image1") ? "bg-[#fb7a00]" : "bg-transparent text-white hover:bg-[#fb7a00]"}`}
            onClick={() => handleImageChange("image1")}
          >
            Upload documents
          </button>
          <button
            className={`m-2 px-4 py-1 rounded-full ${isActive("image2") ? "bg-[#fb7a00]" : "bg-transparent text-white hover:bg-[#fb7a00]"}`}
            onClick={() => handleImageChange("image2")}
          >
            Set link permissions
          </button>
          <button
            className={`m-2 px-4 py-1 rounded-full ${isActive("image3") ? "bg-[#fb7a00]" : "bg-transparent text-white hover:bg-[#fb7a00]"}`}
            onClick={() => handleImageChange("image3")}
          >
            Track time on each page
          </button>
          <button
            className={`m-2 px-4 py-1 rounded-full ${isActive("image4") ? "bg-[#fb7a00]" : "bg-transparent text-white hover:bg-[#fb7a00]"}`}
            onClick={() => handleImageChange("image4")}
          >
            Create data room
          </button>
          <button
            className={`m-2 px-4 py-1 rounded-full ${isActive("image5") ? "bg-[#fb7a00]" : "bg-transparent text-white hover:bg-[#fb7a00]"}`}
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
