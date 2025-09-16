"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [trail, setTrail] = useState<
    Array<{ x: number; y: number; id: string }>
  >([]);
  const cursorRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastTrailUpdate = useRef<number>(0);

  // Use RAF for smooth cursor movement
  const updateCursorPosition = useCallback(
    (x: number, y: number) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x - 10}px, ${
          y - 10
        }px, 0) scale(${isHovering ? 1.5 : 1}) ${
          isClicking ? "scale(0.8)" : ""
        }`;
      }
    },
    [isHovering, isClicking]
  );

  useEffect(() => {
    let trailId = 0;
    const startTime = Date.now();

    const updateMousePosition = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      // Immediately update position without state to avoid lag
      setMousePosition({ x, y });

      // Use RAF for smooth movement
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      animationRef.current = requestAnimationFrame(() => {
        updateCursorPosition(x, y);
      });

      // Throttle trail updates for better performance
      const now = Date.now();
      if (now - lastTrailUpdate.current > 16) {
        // ~60fps
        lastTrailUpdate.current = now;
        setTrail((prev) => {
          // Create unique ID using timestamp and counter
          const uniqueId = `${startTime}-${trailId++}`;
          const newTrail = [...prev, { x, y, id: uniqueId }];
          return newTrail.slice(-6); // Reduced trail length for better performance
        });
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    // Debounced hover detection for better performance
    let hoverTimeout: NodeJS.Timeout;
    const handleMouseOver = (e: MouseEvent) => {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        const target = e.target as HTMLElement;
        const isInteractive =
          target.matches(
            'button, a, input, textarea, select, [role="button"], .cursor-pointer'
          ) ||
          target.closest(
            'button, a, input, textarea, select, [role="button"], .cursor-pointer'
          );
        setIsHovering(!!isInteractive);
      }, 50); // Small delay to prevent excessive updates
    };

    // Use passive listeners for better performance
    document.addEventListener("mousemove", updateMousePosition, {
      passive: true,
    });
    document.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", updateMousePosition);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(hoverTimeout);
    };
  }, [updateCursorPosition]);

  return (
    <>
      {/* Hide default cursor */}
      <style jsx global>{`
        * {
          cursor: none !important;
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes sparkle {
          0%,
          100% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
        }
      `}</style>

      {/* Mouse trail - Optimized */}
      {trail.map((point, index) => (
        <div
          key={point.id}
          className="fixed pointer-events-none z-[9999] will-change-transform"
          style={{
            transform: `translate3d(${point.x - 2}px, ${
              point.y - 2
            }px, 0) scale(${(index + 1) / trail.length})`,
            opacity: ((index + 1) / trail.length) * 0.5, // Reduced opacity for better performance
          }}
        >
          <div className="w-1 h-1 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full"></div>
        </div>
      ))}

      {/* Main cursor - Hardware accelerated */}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none z-[10000] will-change-transform"
        style={{
          left: 0,
          top: 0,
          transform: `translate3d(${mousePosition.x - 10}px, ${
            mousePosition.y - 10
          }px, 0)`,
        }}
      >
        {/* Outer ring */}
        <div
          className={`w-5 h-5 border-2 rounded-full transition-colors duration-100 ${
            isHovering
              ? "border-primary-500 bg-primary-500/20"
              : "border-primary-400/60 bg-primary-400/10"
          } ${isClicking ? "animate-pulse" : ""}`}
        >
          {/* Inner dot */}
          <div
            className={`absolute top-1/2 left-1/2 w-1 h-1 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ${
              isHovering ? "bg-primary-600 scale-150" : "bg-primary-500"
            }`}
          ></div>
        </div>

        {/* Pulse ring on click */}
        {isClicking && (
          <div
            className="absolute top-1/2 left-1/2 w-5 h-5 border-2 border-primary-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{ animation: "pulse-ring 0.4s ease-out" }}
          ></div>
        )}

        {/* Sparkle effects on hover - Reduced for performance */}
        {isHovering && (
          <>
            <div
              className="absolute top-0 left-0 w-1.5 h-1.5 bg-secondary-400 rounded-full"
              style={{ animation: "sparkle 0.8s ease-in-out infinite" }}
            ></div>
            <div
              className="absolute bottom-0 right-0 w-1 h-1 bg-primary-400 rounded-full"
              style={{ animation: "sparkle 0.8s ease-in-out infinite 0.2s" }}
            ></div>
          </>
        )}
      </div>
    </>
  );
}
