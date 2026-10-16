import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { Bed, Bath, Maximize, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageOptimizer from '@/components/ImageOptimizer';
import { getPropertyImageCandidates } from '@/lib/propertyImages';

const PropertyMarker = ({ property }) => {
  // Ensure we have valid coordinates
  if (!property?.lat || !property?.lng) return null;

  const formatPrice = (price) => {
    // R$ X.XXX,XX
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(price);
  };

  // Determine which price to show
  const displayPrice = property.price || property.rental_price;
  const priceLabel = property.type === 'rent' ? 'Aluguel' : 'Venda';
  const imageCandidates = getPropertyImageCandidates(property);

  return (
    <Marker position={[Number(property.lat), Number(property.lng)]}>
      <Popup className="property-popup" minWidth={280} maxWidth={280}>
        <div className="w-full p-0">
          <div className="relative h-40 mb-3 rounded-lg overflow-hidden group">
            <ImageOptimizer
              src={imageCandidates[0]}
              sources={imageCandidates.slice(1)}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute top-2 left-2">
              <span className="px-2 py-1 bg-[#ff8c42] text-white text-[10px] font-bold uppercase rounded shadow-sm">
                {priceLabel}
              </span>
            </div>
            {property.property_status === 'launch' && (
                <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase rounded shadow-sm">
                        Lançamento
                    </span>
                </div>
            )}
          </div>
          
          <Link to={`/imovel/${property.slug}`} className="block group-hover:text-blue-600">
             <h3 className="font-bold text-[#1a3a52] text-sm mb-1 line-clamp-2 leading-tight hover:text-[#0ea5e9] transition-colors">
                {property.title}
             </h3>
          </Link>

          <p className="font-bold text-[#0d5a7a] text-lg mb-2">
            {displayPrice ? `A partir de ${formatPrice(displayPrice)}` : 'Preço sob consulta'}
          </p>
          
          <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-1.5 justify-center bg-gray-50 p-1.5 rounded">
              <Bed className="w-3.5 h-3.5 text-gray-400" /> 
              <span className="font-semibold">{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center bg-gray-50 p-1.5 rounded">
              <Bath className="w-3.5 h-3.5 text-gray-400" /> 
              <span className="font-semibold">{property.bathrooms}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center bg-gray-50 p-1.5 rounded">
              <Maximize className="w-3.5 h-3.5 text-gray-400" /> 
              <span className="font-semibold">{property.area}m²</span>
            </div>
          </div>
          
          <Link to={`/imovel/${property.slug}`} className="block">
            <Button size="sm" className="w-full bg-[#1a3a52] hover:bg-[#132c3e] text-white h-9 text-xs font-semibold shadow-sm transition-all hover:shadow-md">
              Ver Detalhes <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </Popup>
    </Marker>
  );
};

export default PropertyMarker;
