import React, { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageOptimizer from '@/components/ImageOptimizer';

const PhotoModal = ({ isOpen, images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Touch navigation refs
  const touchStartX = useRef(null);
  const touchCurrentX = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, initialIndex]);

  const handlePrevious = useCallback((e) => {
    e?.stopPropagation && e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images]);

  const handleNext = useCallback((e) => {
    e?.stopPropagation && e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images]);

  // Swipe Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchCurrentX.current === null) return;

    const diff = touchStartX.current - touchCurrentX.current;
    const threshold = 60; // 60px minimum distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe Left -> Next Image
        handleNext();
      } else {
        // Swipe Right -> Previous Image
        handlePrevious();
      }
    }

    // Reset refs
    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrevious, onClose]);

  if (!isOpen || !images) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          style={{ touchAction: 'none' }} // Prevent browser gestures on the container
          onClick={onClose}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 z-50 rounded-full w-10 h-10"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Main Image Container Wrapper - Swipe logic lives here */}
          <div 
            className="relative w-full h-full max-w-7xl max-h-screen p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} 
            style={{ touchAction: 'none' }} // Disable browser pan/zoom gestures
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full max-h-[85vh] flex items-center justify-center pointer-events-none select-none"
              >
                <ImageOptimizer
                  src={images[currentIndex]}
                  sources={[
                    ...images.slice(currentIndex + 1),
                    ...images.slice(0, currentIndex),
                  ]}
                  alt={`Foto ${currentIndex + 1}`}
                  className="w-full h-full max-h-[85vh] bg-transparent shadow-2xl rounded-lg"
                  objectFit="contain"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows (Desktop) */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 rounded-full w-12 h-12 hidden md:flex"
                  onClick={handlePrevious}
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 rounded-full w-12 h-12 hidden md:flex"
                  onClick={handleNext}
                  aria-label="Próximo"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 font-medium px-4 py-2 bg-black/40 rounded-full backdrop-blur-md">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhotoModal;
