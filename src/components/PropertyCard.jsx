import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bed, Bath, Car, Maximize, MapPin, Video, Phone, ExternalLink, Heart } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import ImageOptimizer from '@/components/ImageOptimizer';
import { formatPrice } from '@/utils/seoHelpers';
import { cn } from '@/lib/utils';
import WhatsAppButton from '@/components/WhatsAppButton';
import { getPropertyImageCandidates } from '@/lib/propertyImages';

const AmenitiesDisplay = ({ amenities }) => {
  if (!amenities || !Array.isArray(amenities) || amenities.length === 0) return null;
  const visible = amenities.slice(0, 5);
  const remaining = amenities.length - 5;
  
  return (
    <div className="flex flex-wrap gap-1 mt-2 mb-2">
      {visible.map((item, i) => (
        <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 whitespace-nowrap">
          {item}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 font-medium">
          +{remaining}
        </span>
      )}
    </div>
  );
};

const PropertyCard = ({ property, index = 0, layout = 'grid' }) => {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isList = layout === 'list';
  const isRent = property.business_type === 'rent';
  const typeLabel = isRent ? 'LOCAÇÃO' : 'VENDA';
  const typeColor = isRent ? 'bg-orange-500' : 'bg-gray-800';

  const priceVal = isRent ? property.rental_price : property.price;
  const startingPrice = property.starting_from_price;
  const displayPrice = startingPrice || priceVal;
  const formattedPrice = formatPrice(displayPrice, isRent);
  const showStartingFrom = !!startingPrice;

	const formatDateBR = (value) => {
		if (!value) return null;
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return null;
		return d.toLocaleDateString('pt-BR');
	};

  const getStatusInfo = (status) => {
    switch (status) {
      case 'launch':
        return { text: 'Lançamento', color: 'bg-indigo-600' };
      case 'construction':
        return { text: 'Em Obras', color: 'bg-amber-500' };
      case 'ready':
        return { text: 'Pronto', color: 'bg-green-600' };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo(property.property_status);
  const codeLabel = (property?.code || '').trim();
  const imageCandidates = getPropertyImageCandidates(property);

  const handleImageClick = () => {
    navigate(`/imovel/${property.slug}`);
  };

  // Shared Animation Props
  const animationProps = shouldReduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 20 };
  const transitionProps = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.4, delay: Math.min(index * 0.05, 0.3) };

  // --- LIST LAYOUT RENDER ---
  if (isList) {
    return (
      <motion.div
        initial={animationProps}
        animate={{ opacity: 1, y: 0 }}
        transition={transitionProps}
        viewport={{ once: true }}
        className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden flex flex-col md:flex-row h-auto md:h-64 mb-6"
      >
        {/* Left: Image */}
        <div
          className="relative w-full md:w-[320px] h-64 md:h-full flex-shrink-0 bg-gray-900 cursor-pointer overflow-hidden"
          onClick={handleImageClick}
        >
          <ImageOptimizer
            src={imageCandidates[0]}
            sources={imageCandidates.slice(1)}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 pointer-events-none">
            <span className={cn("px-2 py-1 text-white text-[10px] font-bold uppercase rounded shadow-sm", typeColor)}>
              {typeLabel}
            </span>
            {statusInfo && (
              <span className={`px-2 py-1 ${statusInfo.color} text-white text-[10px] font-bold uppercase rounded shadow-sm`}>
                {statusInfo.text}
              </span>
            )}
            {(property.video_url || property.youtube_url) && (
                <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold uppercase rounded shadow-sm flex items-center gap-1">
                    <Video className="w-3 h-3" /> Vídeo
                </span>
            )}
          </div>
        </div>

        {/* Middle: Info */}
        <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
                <div className="mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    {property.type === 'apartment' ? 'Apartamento' : property.type === 'house' ? 'Casa' : 'Comercial'}
                    </span>

                    {codeLabel && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700 align-middle">
                        {codeLabel}
                      </span>
                    )}

                    <Link to={`/imovel/${property.slug}`} className="block group-hover:text-blue-600 transition-colors">
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-1 mt-1">
                            {property.title}
                        </h3>
                    </Link>
                </div>

                <div className="mb-3">
                    {showStartingFrom && <span className="text-xs text-gray-500 uppercase block">A partir de</span>}
                    <span className={cn("text-2xl font-extrabold", "text-orange-700")}>
                        {formattedPrice}
                    </span>
                </div>

                <div className="flex items-start text-gray-500 mb-2 text-sm">
                    <MapPin className="w-4 h-4 mr-1.5 mt-0.5 text-gray-400 flex-shrink-0" />
                    <span className="line-clamp-2">
                        {property.neighborhood}, {property.location}
                    </span>
                </div>

                <AmenitiesDisplay amenities={property.amenities} />
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t border-gray-100 mt-2">
                <div className="flex items-center" title="Quartos"><Bed className="w-4 h-4 mr-1.5 text-gray-400" /><span className="font-semibold">{property.bedrooms}</span></div>
                <div className="flex items-center" title="Banheiros"><Bath className="w-4 h-4 mr-1.5 text-gray-400" /><span className="font-semibold">{property.bathrooms}</span></div>
                <div className="flex items-center" title="Vagas"><Car className="w-4 h-4 mr-1.5 text-gray-400" /><span className="font-semibold">{property.parking_spaces}</span></div>
                <div className="flex items-center" title="Área"><Maximize className="w-4 h-4 mr-1.5 text-gray-400" /><span className="font-semibold">{property.area} m²</span></div>
            </div>
        </div>

        {/* Right: Actions (Desktop) / Bottom (Mobile) */}
        <div className="w-full md:w-52 p-4 bg-gray-50 md:border-l border-t md:border-t-0 border-gray-100 flex md:flex-col justify-center gap-3">
            <WhatsAppButton 
                property={property} 
                className="w-full"
            />
            <div className="flex gap-2 w-full mt-auto">
                <Link to={`/imovel/${property.slug}`} className="flex-1">
                    <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                        Detalhes
                    </Button>
                </Link>
            </div>
        </div>
      </motion.div>
    );
  }

  // --- GRID LAYOUT RENDER (Default) ---
  return (
    <motion.div
      initial={animationProps}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionProps}
      viewport={{ once: true }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full border border-gray-200"
    >
      <div
        className="relative w-full h-56 bg-gray-100 overflow-hidden cursor-pointer"
        onClick={handleImageClick}
      >
        <ImageOptimizer
          src={imageCandidates[0]}
          sources={imageCandidates.slice(1)}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />

        <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
          {statusInfo && (
            <span className={cn("w-fit px-3 py-1 text-white text-[11px] font-bold rounded-full shadow-sm", statusInfo.color)}>
              {statusInfo.text}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600 border border-gray-200">
            {property.type === 'apartment' ? 'APARTAMENTO' : property.type === 'house' ? 'CASA' : (property.type || 'IMÓVEL')}
          </span>
          {codeLabel ? (
            <span className="inline-flex items-center rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 border border-gray-200">
              {codeLabel}
            </span>
          ) : null}
        </div>

        <Link to={`/imovel/${property.slug}`} className="text-center">
          <h3 className="text-lg font-extrabold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          {property.neighborhood ? (
            <p className="mt-2 text-xs text-gray-500 flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{property.neighborhood}</span>
            </p>
          ) : null}
        </Link>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-2 text-center">
            <div className="text-sm font-bold text-gray-900">{property.bedrooms ?? '-'}</div>
            <div className="text-[11px] text-gray-600">dorm(s)</div>
          </div>
          <div className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-2 text-center">
            <div className="text-sm font-bold text-gray-900">{property.bathrooms ?? '-'}</div>
            <div className="text-[11px] text-gray-600">banheiro(s)</div>
          </div>
          <div className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-2 text-center">
            <div className="text-sm font-bold text-gray-900">{property.suites ?? '-'}</div>
            <div className="text-[11px] text-gray-600">suite(s)</div>
          </div>
          <div className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-2 text-center">
            <div className="text-sm font-bold text-gray-900">{property.parking_spaces ?? '-'}</div>
            <div className="text-[11px] text-gray-600">vaga(s)</div>
          </div>
          <div className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-2 text-center col-span-2">
            <div className="text-sm font-bold text-gray-900">{property.area ? `${property.area}` : '-'}</div>
            <div className="text-[11px] text-gray-600">m²</div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">
            {isRent ? 'Locação a partir de:' : showStartingFrom ? 'Venda a partir de:' : 'Valor:'}
          </p>
          <p className="mt-1 text-lg font-extrabold text-emerald-600">
            {formattedPrice}
          </p>
          {formatDateBR(property.updated_at || property.created_at) ? (
            <p className="mt-2 text-[11px] text-gray-400">
              Atualizado em: {formatDateBR(property.updated_at || property.created_at)}
            </p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(PropertyCard);
