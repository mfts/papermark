"use client";

import { useEffect, useRef } from "react";

interface GlobePoint {
  x: number;
  y: number;
  z: number;
  color: string;
}

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<GlobePoint[]>([]);
  const rotationRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    // Create globe points - land and ocean colors
    const generateGlobePoints = () => {
      const points: GlobePoint[] = [];
      const radius = 100;
      const density = 2500; // number of points

      // Land colors (greens, browns)
      const landColors = [
        "#2d5016", // dark green
        "#3d7020", // forest green
        "#5a8c2d", // medium green
        "#8b7355", // brown
        "#a69968", // tan
        "#6b8e23", // olive
      ];

      // Ocean colors (blues)
      const oceanColors = [
        "#1e3a8a", // dark blue
        "#2563eb", // medium blue
        "#0369a1", // cyan-blue
        "#3b82f6", // sky blue
      ];

      for (let i = 0; i < density; i++) {
        // Random spherical coordinates
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        // Determine if this point is "land" based on noise-like pattern
        const landChance = Math.sin(theta * 3) * Math.sin(phi * 2) * 0.5 + 0.5;
        const isLand = landChance > 0.45;

        const colorArray = isLand ? landColors : oceanColors;
        const color = colorArray[Math.floor(Math.random() * colorArray.length)];

        points.push({ x, y, z, color });
      }

      return points;
    };

    pointsRef.current = generateGlobePoints();

    let animationId: number;

    const animate = () => {
      // Clear canvas with transparent background
      ctx.clearRect(0, 0, width, height);

      // Rotation - only around Y axis for smooth round rotation
      rotationRef.current.y += 0.003;

      const cosY = Math.cos(rotationRef.current.y);
      const sinY = Math.sin(rotationRef.current.y);
      // Fixed tilt for a nice viewing angle
      const tiltAngle = 0.3;
      const cosX = Math.cos(tiltAngle);
      const sinX = Math.sin(tiltAngle);

      // Project and sort points
      const projectedPoints = pointsRef.current
        .map((point) => {
          // Rotation around X axis
          const y = point.y * cosX - point.z * sinX;
          let z = point.y * sinX + point.z * cosX;

          // Rotation around Y axis
          const x = point.x * cosY + z * sinY;
          z = -point.x * sinY + z * cosY;

          // Perspective projection
          const scale = 300 / (z + 150);
          const x2d = x * scale + width / 2;
          const y2d = y * scale + height / 2;

          return { x: x2d, y: y2d, z, color: point.color };
        })
        .sort((a, b) => a.z - b.z); // Sort by depth

      // Draw points
      projectedPoints.forEach((point) => {
        const depth = (point.z + 150) / 300;
        const size = Math.max(0.5, depth * 1.5);

        ctx.fillStyle = point.color;
        ctx.globalAlpha = Math.max(0.3, depth);
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ background: "transparent" }}
    />
  );
}

