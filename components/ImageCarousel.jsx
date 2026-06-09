"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ImageCarousel({ images = [], className, autoPlay = true, interval = 3000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef(null);

  // Define navigation functions before early return
  const goToNext = (e, isAuto = false) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  if (!images || images.length === 0) {
    return null;
  }

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || images.length <= 1 || isPaused) return;

    timeoutRef.current = setTimeout(() => {
      goToNext(null, true);
    }, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, autoPlay, interval, isPaused, images.length]);

  const goToPrevious = (e, isAuto = false) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
    setTimeout(() => setIsTransitioning(false), 300);
  };


  const goToSlide = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div 
      className={cn("relative w-full h-full group overflow-hidden", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image Container with Slide Effect */}
      <div className="relative w-full h-full">
        {/* Show only current image with fade transition */}
        {images.map((image, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-in-out",
              index === currentIndex
                ? "opacity-100 scale-100 z-10"
                : "opacity-0 scale-95 z-0 pointer-events-none"
            )}
          >
            <img
              src={image}
              alt={`Image ${index + 1} of ${images.length}`}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}

        {/* Navigation Arrows - Only show if more than 1 image */}
        {images.length > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 rounded-full"
              onClick={goToPrevious}
              disabled={isTransitioning}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 rounded-full"
              onClick={goToNext}
              disabled={isTransitioning}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/70 text-white text-xs font-medium rounded-full z-20">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Dots Indicator */}
        {images.length > 1 && images.length <= 10 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/60 px-2.5 py-1.5 rounded-full z-20">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => goToSlide(index, e)}
                disabled={isTransitioning}
                className={cn(
                  "rounded-full transition-all duration-200",
                  index === currentIndex
                    ? "bg-white w-6 h-1.5"
                    : "bg-white/50 hover:bg-white/75 w-1.5 h-1.5"
                )}
                aria-label={`Go to image ${index + 1}`}
                aria-current={index === currentIndex ? "true" : "false"}
              />
            ))}
          </div>
        )}

        {/* Auto-play indicator */}
        {autoPlay && images.length > 1 && !isPaused && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded-full z-20 flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Auto
          </div>
        )}
      </div>
    </div>
  );
}
