import React, { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeImageUrl, PROPERTY_IMAGE_FALLBACK } from '@/lib/propertyImages';

// Helper to determine if we can optimize this URL (e.g., Unsplash)
const getOptimizedUrl = (url, width, format = 'webp', quality = 75) => {
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    // Ensure we don't duplicate query params if they exist
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}&q=${quality}&fm=${format}&fit=crop`;
  }
  return url;
};

const ImageOptimizer = ({
  src,
  sources = [],
  alt,
  className,
  width,
  height,
  onLoad,
  onError,
  priority = false, // If true, eager load (LCP candidate)
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  objectFit = "cover",
  objectPosition,
  imageFilter,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (priority) return;

    // Use a simpler observer for standard lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Load slightly before view
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const sourceList = useMemo(() => {
    const requestedSources = [src, ...(Array.isArray(sources) ? sources : [sources])]
      .map((value) => normalizeImageUrl(value))
      .filter(Boolean);

    return [...new Set([...requestedSources, PROPERTY_IMAGE_FALLBACK])];
  }, [src, sources]);
  const sourceKey = sourceList.join('\n');
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
    setIsLoaded(false);
  }, [sourceKey]);

  const originalSrc = sourceList[sourceIndex] || PROPERTY_IMAGE_FALLBACK;

  const canOptimizeFormats = originalSrc.includes('images.unsplash.com');

  // Generate responsive srcsets for AVIF (best compression), WebP (great support), JPG (fallback)
  const formats = ['avif', 'webp', 'jpg'];
  const breakpoints = [480, 800, 1200, 1600];

  const generateSrcSet = (format) => {
    return breakpoints
      .map(w => `${getOptimizedUrl(originalSrc, w, format)} ${w}w`)
      .join(', ');
  };

  const defaultSrc = getOptimizedUrl(originalSrc, 1200, 'jpg');

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-gray-100", className)}
      style={{ 
        aspectRatio: width && height ? `${width}/${height}` : undefined,
        height: height && !width ? `${height}px` : undefined 
      }}
    >
      {(isVisible || priority) && (
        canOptimizeFormats ? (
          <picture>
            <source type="image/avif" srcSet={generateSrcSet('avif')} sizes={sizes} />
            <source type="image/webp" srcSet={generateSrcSet('webp')} sizes={sizes} />
            <source type="image/jpeg" srcSet={generateSrcSet('jpg')} sizes={sizes} />
            <img
              ref={imgRef}
              src={defaultSrc}
              alt={alt || "Imagem do imóvel"}
              width={width}
              height={height}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "auto"}
              onLoad={(e) => {
                setIsLoaded(true);
                onLoad && onLoad(e);
              }}
              onError={(e) => {
                onError && onError(e);
                setSourceIndex((current) => {
                  if (current >= sourceList.length - 1) {
                    setIsLoaded(true);
                    return current;
                  }
                  setIsLoaded(false);
                  return current + 1;
                });
              }}
              style={{ objectPosition, filter: imageFilter }}
              className={cn(
                "w-full h-full transition-all duration-700",
                objectFit === "contain" ? "object-contain" : "object-cover",
                !isLoaded && !priority ? "blur-sm scale-105 opacity-0" : "blur-0 scale-100 opacity-100"
              )}
            />
          </picture>
        ) : (
          <img
            ref={imgRef}
            src={originalSrc}
            alt={alt || "Imagem do imóvel"}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            onLoad={(e) => {
              setIsLoaded(true);
              onLoad && onLoad(e);
            }}
            onError={(e) => {
              onError && onError(e);
              setSourceIndex((current) => {
                if (current >= sourceList.length - 1) {
                  setIsLoaded(true);
                  return current;
                }
                setIsLoaded(false);
                return current + 1;
              });
            }}
            style={{ objectPosition, filter: imageFilter }}
            className={cn(
              "w-full h-full transition-all duration-700",
              objectFit === "contain" ? "object-contain" : "object-cover",
              !isLoaded && !priority ? "blur-sm scale-105 opacity-0" : "blur-0 scale-100 opacity-100"
            )}
          />
        )
      )}
      
      {!isLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
    </div>
  );
};

export default React.memo(ImageOptimizer);
