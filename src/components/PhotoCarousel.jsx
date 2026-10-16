import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Loader2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ImageOptimizer from '@/components/ImageOptimizer';
import { Button } from '@/components/ui/button';

const PhotoCarousel = ({ images = [], onPhotoClick, className, hasFloorPlans, onFloorPlansClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [isImgLoading, setIsImgLoading] = useState(true);

  // Preload images logic
  useEffect(() => {
    if (!images || images.length === 0) return;

    const preloadImage = (index) => {
      if (index < 0 || index >= images.length) return;
      const img = new Image();
      img.src = images[index];
      img.onload = () => {
        setLoadedImages((prev) => new Set(prev).add(index));
      };
    };

    // Preload current, next, and previous
    preloadImage(currentIndex);
    const nextIndex = (currentIndex + 1) % images.length;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    preloadImage(nextIndex);
    preloadImage(prevIndex);

  }, [currentIndex, images]);

  const handlePrevious = useCallback((e) => {
    e?.stopPropagation();
    setIsImgLoading(true);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback((e) => {
    e?.stopPropagation();
    setIsImgLoading(true);
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };
    
    // Only attach if element is in view/focused ideally, but broadly applied here for carousel functionality
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious]);

  if (!images || images.length === 0) {
    return (
      <div className={cn("w-full h-64 md:h-[500px] bg-gray-100 flex items-center justify-center rounded-xl", className)}>
        <p className="text-gray-400">Sem fotos disponíveis</p>
      </div>
    );
  }

  return (
    <div className={cn("relative group w-full overflow-hidden rounded-xl bg-gray-900 select-none aspect-video md:aspect-auto md:h-[500px]", className)}>
      <div 
        className="w-full h-full relative cursor-pointer"
        onClick={() => onPhotoClick && onPhotoClick(currentIndex)}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, zIndex: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full z-10"
          >
             {/* Loading State Skeleton/Blur */}
             {!loadedImages.has(currentIndex) && (
               <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center z-0">
                  <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
               </div>
             )}

             <ImageOptimizer 
               src={images[currentIndex]}
               sources={[
                 ...images.slice(currentIndex + 1),
                 ...images.slice(0, currentIndex),
               ]}
               alt={`Foto ${currentIndex + 1}`}
               className="w-full h-full object-cover"
               priority={true}
               onLoad={() => {
                 setIsImgLoading(false);
                 setLoadedImages(prev => new Set(prev).add(currentIndex));
               }}
             />
          </motion.div>
        </AnimatePresence>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 z-20 pointer-events-none" />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between p-4 z-30 pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="pointer-events-auto bg-black/20 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="pointer-events-auto bg-black/20 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
              aria-label="Próxima foto"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-auto z-30">
           
           {/* Custom Floor Plans Button */}
           {hasFloorPlans && (
             <Button
               variant="default"
               size="sm"
               onClick={(e) => {
                 e.stopPropagation();
                 onFloorPlansClick && onFloorPlansClick();
               }}
               className="bg-[#1E40AF] hover:bg-[#1E40AF]/90 text-white backdrop-blur-md rounded-lg shadow-lg border border-white/10"
             >
                <FileText className="w-4 h-4 mr-2" />
                Plantas
             </Button>
           )}

          <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onPhotoClick && onPhotoClick(currentIndex);
            }}
            className="bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md h-8 w-8"
            aria-label="Expandir"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile Swipe Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden z-30">
          {images.slice(0, 5).map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all shadow-sm",
                idx === (currentIndex % 5) ? "bg-white scale-125" : "bg-white/50"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhotoCarousel;
