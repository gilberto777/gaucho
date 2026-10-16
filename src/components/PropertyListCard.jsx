import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bed, Bath, Car, MapPin, Phone, ExternalLink, Heart } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import WhatsAppButton from '@/components/WhatsAppButton';
import { useToast } from "@/components/ui/use-toast";
import ImageOptimizer from '@/components/ImageOptimizer';
import { getPropertyImageCandidates } from '@/lib/propertyImages';
import { formatPrice } from '@/utils/seoHelpers';
import { cn } from '@/lib/utils';

const AmenitiesDisplay = ({ amenities }) => {
  if (!amenities || !Array.isArray(amenities) || amenities.length === 0) return null;
  const visible = amenities.slice(0, 5);
  const remaining = amenities.length - 5;
  
  return (
    <div className="flex flex-wrap gap-1 mt-3 mb-2">
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

const PropertyListCard = ({ property, index = 0 }) => {
  const imageCandidates = getPropertyImageCandidates(property);
  const { toast } = useToast();
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();

  // BUSINESS LOGIC: Determine display values strictly from business_type
  const isRent = property.business_type === 'rent';
  const typeLabel = isRent ? 'LOCAÇÃO' : 'VENDA';
  const typeColor = isRent ? 'bg-orange-500' : 'bg-blue-600';
  const priceVal = isRent ? property.rental_price : property.price;
  const formattedPrice = formatPrice(priceVal, isRent);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'launch':
        return { text: 'Lançamento', color: 'bg-indigo-600' };
      case 'construction':
        return { text: 'Em Construção', color: 'bg-amber-500' };
      case 'ready':
        return { text: 'Pronto', color: 'bg-green-600' };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo(property.property_status);

  const handleImageClick = () => {
    navigate(`/imovel/${property.slug}`);
  };

  const animationProps = shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 };
  const transitionProps = shouldReduceMotion ? { duration: 0 } : { duration: 0.3, delay: Math.min(index * 0.05, 0.3) };

  return (
    <motion.div
      initial={animationProps}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionProps}
      viewport={{ once: true }}
      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col md:flex-row h-auto md:h-64 mb-6"
    >
      {/* Left: Image Section */}
      <div
        className="relative w-full md:w-[320px] h-64 md:h-full flex-shrink-0 overflow-hidden bg-black cursor-pointer"
        style={{ backgroundColor: '#000' }}
        onClick={handleImageClick}
      >
        <ImageOptimizer
          src={imageCandidates[0]}
          sources={imageCandidates.slice(1)}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          sizes="(max-width: 768px) 100vw, 320px"
          objectFit="cover"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 pointer-events-none">
          <span className={cn("px-2 py-1 text-white text-[10px] font-bold uppercase rounded shadow-sm", typeColor)}>
            {typeLabel}
          </span>
          {property.featured && (
            <span className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold uppercase rounded shadow-sm">
              Destaque
            </span>
          )}
          {statusInfo && (
            <span className={`px-2 py-1 ${statusInfo.color} text-white text-[10px] font-bold uppercase rounded shadow-sm`}>
              {statusInfo.text}
            </span>
          )}
        </div>
      </div>

      {/* Middle: Details Section */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          {/* Header Info */}
          <div className="mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              {property.type}
            </span>
            <Link to={`/imovel/${property.slug}`} className="block">
              <h3 className="text-xl font-bold text-[#1a3a52] hover:text-[#0ea5e9] transition-colors line-clamp-1 mt-1">
                {property.title}
              </h3>
            </Link>
          </div>

          {/* Price */}
          <div className="mb-3">
            <span className={cn("text-2xl font-extrabold", "text-orange-700")}>
              {formattedPrice}
            </span>
          </div>

          {/* Address */}
          <div className="flex items-start text-gray-500 mb-2 text-sm">
            <MapPin className="w-4 h-4 mr-1.5 mt-0.5 text-[#ff8c42] flex-shrink-0" />
            <span className="line-clamp-2">
              {property.address}
              {property.neighborhood && ` - ${property.neighborhood}`}
              {property.location && `, ${property.location}`}
            </span>
          </div>

          <AmenitiesDisplay amenities={property.amenities} />
        </div>

        {/* Characteristics Badges */}
        <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t border-gray-100 mt-2">
          <div className="flex items-center" title="Quartos">
            <Bed className="w-4 h-4 mr-1.5 text-gray-400" />
            <span className="font-semibold">{property.bedrooms}</span>
            <span className="hidden sm:inline ml-1">Qtos</span>
          </div>
          <div className="flex items-center" title="Banheiros">
            <Bath className="w-4 h-4 mr-1.5 text-gray-400" />
            <span className="font-semibold">{property.bathrooms}</span>
            <span className="hidden sm:inline ml-1">Ban</span>
          </div>
          <div className="flex items-center" title="Vagas">
            <Car className="w-4 h-4 mr-1.5 text-gray-400" />
            <span className="font-semibold">{property.parking_spaces}</span>
            <span className="hidden sm:inline ml-1">Vagas</span>
          </div>
          <div className="flex items-center" title="Área">
            <span className="text-gray-400 font-bold mr-1">M²</span>
            <span className="font-semibold">{property.area}</span>
          </div>
        </div>
      </div>

      {/* Right: Actions Section */}
      <div className="w-full md:w-48 p-4 bg-gray-50 md:border-l border-t md:border-t-0 border-gray-100 flex md:flex-col justify-center gap-2">
        <div className="flex md:flex-col gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1 md:w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 h-9"
            onClick={() => toast({ title: "🚧 Recurso não implementado", description: "Em breve você poderá ligar diretamente!" })}
          >
            <Phone className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Ligar</span>
          </Button>

          {/* Updated Tracking Button without overrides */}
          <WhatsAppButton
            property={property}
            className="flex-1 md:w-full h-9"
          />
        </div>

        <div className="flex gap-2 w-full mt-auto md:pt-4">
          <Link to={`/imovel/${property.slug}`} className="flex-1">
            <Button className="w-full bg-[#1a3a52] hover:bg-[#132c3e] text-white">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
            onClick={() => toast({ title: "🚧 Recurso não implementado", description: "Favoritos em breve!" })}
          >
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(PropertyListCard);
