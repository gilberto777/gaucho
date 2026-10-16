import React, { useState, Suspense, lazy } from 'react';
import { Image as ImageIcon, Video, Rotate3D, FileText, Map as MapIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageOptimizer from '@/components/ImageOptimizer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const VideoEmbed = lazy(() => import('./VideoEmbed'));
const VirtualTourEmbed = lazy(() => import('./VirtualTourEmbed'));
const PropertyPlansViewer = lazy(() => import('./PropertyPlansViewer'));

const MediaSection = ({ property, onOpenGallery, onOpenMap }) => {
  const [activeImage, setActiveImage] = useState(0);

  const hasVideo = !!property.video_url; // Assuming video_url is the new column
  const hasYouTube = !!property.youtube_url; // Fallback to old column if needed
  const videoUrl = property.video_url || property.youtube_url;
  
  const hasTour = !!property.virtual_tour_url;
  const hasPlans = property.plans_urls && property.plans_urls.length > 0;
  const hasOldPlans = property.floor_plans && property.floor_plans.length > 0;
  const plans = property.plans_urls || (property.floor_plans || []).map(url => ({ url, name: 'Planta', type: 'image/jpeg' }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
      <Tabs defaultValue="photos" className="w-full">
        <div className="p-4 border-b bg-gray-50/50 overflow-x-auto">
          <TabsList className="w-full sm:w-auto justify-start inline-flex h-auto p-1 bg-gray-200/50 rounded-lg">
            <TabsTrigger value="photos" className="px-3 py-2 text-sm sm:px-4 sm:text-base">
              <ImageIcon className="w-4 h-4 mr-2" /> Fotos
            </TabsTrigger>
            
            {(hasVideo || hasYouTube) && (
              <TabsTrigger value="video" className="px-3 py-2 text-sm sm:px-4 sm:text-base">
                <Video className="w-4 h-4 mr-2" /> Vídeo
              </TabsTrigger>
            )}
            
            {hasTour && (
              <TabsTrigger value="tour" className="px-3 py-2 text-sm sm:px-4 sm:text-base">
                <Rotate3D className="w-4 h-4 mr-2" /> Tour 360º
              </TabsTrigger>
            )}
            
            {(hasPlans || hasOldPlans) && (
              <TabsTrigger value="plans" className="px-3 py-2 text-sm sm:px-4 sm:text-base">
                <FileText className="w-4 h-4 mr-2" /> Plantas
              </TabsTrigger>
            )}

            <TabsTrigger value="map" className="px-3 py-2 text-sm sm:px-4 sm:text-base" onClick={(e) => { e.preventDefault(); onOpenMap(); }}>
              <MapIcon className="w-4 h-4 mr-2" /> Mapa
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-0">
          <TabsContent value="photos" className="m-0 focus-visible:ring-0">
            <div className="relative group cursor-pointer bg-gray-100" onClick={onOpenGallery}>
              <div className="aspect-[4/3] sm:aspect-[16/9] w-full overflow-hidden relative">
                <ImageOptimizer 
                  src={property.images?.[activeImage]}
                  sources={[
                    ...(property.images || []).slice(activeImage + 1),
                    ...(property.images || []).slice(0, activeImage),
                  ]}
                  alt={property.title} 
                  className="w-full h-full object-cover" 
                  priority 
                />
                
                {/* Image Navigation Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                  {activeImage + 1} / {property.images?.length || 0}
                </div>
              </div>
            </div>
            
            {/* Thumbnails */}
            {property.images?.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto bg-white border-t border-gray-100 scrollbar-hide">
                {property.images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(idx)} 
                    className={cn(
                      "relative w-20 h-14 sm:w-24 sm:h-16 flex-shrink-0 rounded-md overflow-hidden transition-all duration-200 border-2",
                      activeImage === idx ? "border-[#1a3a52] ring-2 ring-[#1a3a52]/20" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <ImageOptimizer src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="video" className="m-0 p-4 sm:p-6 bg-gray-50/30">
            <Suspense fallback={<Skeleton className="w-full aspect-video rounded-xl" />}>
              <VideoEmbed url={videoUrl} title={property.title} />
            </Suspense>
          </TabsContent>

          <TabsContent value="tour" className="m-0 p-4 sm:p-6 bg-gray-50/30">
            <Suspense fallback={<Skeleton className="w-full aspect-video rounded-xl" />}>
              <VirtualTourEmbed url={property.virtual_tour_url} />
            </Suspense>
          </TabsContent>

          <TabsContent value="plans" className="m-0 p-4 sm:p-6 bg-gray-50/30">
             <Suspense fallback={<Skeleton className="w-full h-64 rounded-xl" />}>
                <PropertyPlansViewer plans={plans} />
             </Suspense>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default MediaSection;
