"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import Div100vh from "react-div-100vh";
import { BoundingBox } from "./boundingBox";
import { drawCircles } from "./drawCircles";

export default function Detect() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [image, setImage] = useState<string>();
  const [rectangles, setRectangles] = useState<BoundingBox[]>([]);
  const [count, setCount] = useState(0);

  const getRectangles = async (dataURL: string) => {
    const blobResponse = await fetch(dataURL);
    const blob = await blobResponse.blob();

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      console.error("NEXT_PUBLIC_BACKEND_URL is not set");
      return;
    }

    const jsonResponse = await fetch(`${backendUrl}/api/detect`, {
      method: "POST",
      headers: {
        "Content-Type": blob.type,
      },
      body: blob,
    });
    const data: BoundingBox[] = await jsonResponse.json();

    setRectangles(
      data.filter((rectangle) => rectangle.name === "Four Leaf Clover")
    );
  };

  const captureFrame = async () => {
    if (videoRef.current?.srcObject == null) {
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.height = 640;
    canvas.width = 480;

    const ctx = canvas.getContext("2d");

    if (ctx == null) {
      return;
    }

    ctx.drawImage(
      videoRef.current,
      0,
      0,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (count % 10 === 0 || (rectangles.length === 0 && count % 5 === 0)) {
      try {
        getRectangles(canvas.toDataURL("image/jpeg", 0.35));
      } catch (error) {
        console.error(error);
      }
    }

    await drawCircles(ctx, rectangles);
    setImage(canvas.toDataURL());

    setCount((prevCount) => prevCount + 1);
  };

  const ref = useRef(captureFrame);
  useEffect(() => {
    ref.current = captureFrame;
  }, [captureFrame]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { exact: "environment" },
        },
      })
      .then((mediaStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;

          videoRef.current.setAttribute("muted", "");
          videoRef.current.setAttribute("playsinline", "");

          videoRef.current.addEventListener("loadeddata", () => {
            videoRef.current?.play();
          });
        }
      });

    const intervalID = setInterval(() => {
      ref.current();
    }, 100);
    return () => {
      clearInterval(intervalID);
    };
  }, []);

  return (
    <Div100vh
      style={{
        backgroundColor: "#F2F2F2",
        zIndex: 1,
      }}
    >
      <Box
        sx={{
          bgcolor: "rgb(255 255 255 / 50%)",
          display: "flex",
          justifyContent: "center",
          left: "50%",
          position: "absolute",
          top: "5%",
          transform: "translateX(-50%)",
          width: "90%",
          zIndex: 3,
        }}
      >
        <Typography variant="h5" sx={{ color: "#252020", paddingY: 3 }}>
          Aim at Clover and Hold Still
        </Typography>
      </Box>
      <video ref={videoRef} hidden></video>
      {image && (
        <img
          src={image}
          style={{
            left: "50%",
            position: "absolute",
            top: "50%",
            transform: "translateX(-50%) translateY(-50%)",
            zIndex: 2,
          }}
        />
      )}
      {/* <Button
        href="/congrats"
        variant="contained"
        sx={{
          bgcolor: "#EA6A74",
          bottom: "20px",
          position: "absolute",
          right: "20px",
          width: "40%",
          zIndex: 3,
        }}
      >
        Found
      </Button> */}
    </Div100vh>
  );
}
