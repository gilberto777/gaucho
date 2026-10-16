import { cleanWordPressHTML } from './cleanWordPressHTML';
import { getPropertyImageCandidates } from './propertyImages';

/**
 * Maps raw CSV data to the application's property schema.
 * @param {Object} rawData - A single row object from the CSV.
 * @param {string} brokerId - The ID of the current broker importing the data.
 * @returns {Object} - Mapped property object ready for Supabase insertion.
 */
export function mapPropertyData(rawData, brokerId) {
  // 1. Title
  const title = rawData.post_title || rawData.title || 'Imóvel sem título';

  // 2. Description (Cleaned)
  const rawDesc = rawData.post_content || rawData.description || rawData.post_excerpt || '';
  const description = cleanWordPressHTML(rawDesc);

  // 3. Type
  // Map common CSV values to our 'apartment', 'house', 'commercial', 'land' enum
  let type = 'apartment'; // Default
  const rawType = (rawData.property_type || rawData.type || '').toLowerCase();
  
  if (rawType.includes('casa') || rawType.includes('sobrado') || rawType.includes('house')) {
    type = 'house';
  } else if (rawType.includes('comercial') || rawType.includes('loja') || rawType.includes('sala') || rawType.includes('office')) {
    type = 'commercial';
  } else if (rawType.includes('terreno') || rawType.includes('lote') || rawType.includes('land')) {
    type = 'land';
  }

  // 4. Status
  // Map to 'active', 'sold', 'rented'
  let status = 'active';
  const rawStatus = (rawData.property_status || rawData.status || '').toLowerCase();
  if (rawStatus.includes('vendido') || rawStatus.includes('sold')) {
    status = 'sold';
  } else if (rawStatus.includes('alugado') || rawStatus.includes('rented')) {
    status = 'rented';
  }

  // 5. Neighborhood / Location
  // CSV often has 'property_label' or just a location string
  // If property_label is array-like string ["Bairro"], clean it
  let neighborhood = rawData.property_label || rawData.neighborhood || 'Bairro a confirmar';
  neighborhood = neighborhood.replace(/[\[\]"]/g, ''); // Remove JSON array chars if present
  
  // Location string (City/State) - usually generic if not in CSV
  const location = 'São Paulo, SP'; // Defaulting for this context, or could extract if available

  // 6. Area
  // Clean '120 m²' strings to number
  let area = 0;
  const rawArea = rawData.property_area || rawData.area || '0';
  const areaMatch = rawArea.toString().match(/(\d+([.,]\d+)?)/);
  if (areaMatch) {
    area = parseFloat(areaMatch[0].replace(',', '.'));
  }

  // 7. Prices
  // Try to find price. Sometimes it's in a specific column or mixed.
  // Assuming simple columns for now or raw 'price'
  let price = 0;
  let rental_price = 0;
  
  // Naive price parsing
  const parsePrice = (val) => {
    if (!val) return 0;
    const match = val.toString().replace(/[^\d,.]/g, '').replace(',', '.');
    return parseFloat(match) || 0;
  };

  // Check if status implies rent or sale to assign price correctly if only one price column exists
  const rawPriceVal = rawData.price || rawData.sale_price || rawData.meta_price || '0';
  const parsedVal = parsePrice(rawPriceVal);

  if (rawStatus.includes('aluguel') || rawStatus.includes('rent')) {
    rental_price = parsedVal;
  } else {
    price = parsedVal;
  }

  // 8. Bedrooms / Bathrooms / Parking
  // Often in meta fields or specific columns
  const bedrooms = parseInt(rawData.bedrooms || rawData.property_bedrooms || 0);
  const bathrooms = parseInt(rawData.bathrooms || rawData.property_bathrooms || 0);
  const parking_spaces = parseInt(rawData.parking || rawData.garage || 0);

  // 9. Images
  // 'featured_image' is usually a single URL. 
  // If there's a gallery, it might be in another field. We'll start with featured_image.
  let images = [];
  if (rawData.featured_image && rawData.featured_image.trim()) {
    images.push(rawData.featured_image.trim());
  }
  // Try to find other image columns like 'image_1', 'gallery', etc.
  if (rawData.gallery) {
     const galleryUrls = rawData.gallery.split('|').map(u => u.trim()).filter(Boolean);
     images = [...images, ...galleryUrls];
  }
  images = getPropertyImageCandidates({ images });
  // If no image, use placeholder? No, leave empty array is better, UI handles fallbacks.

  return {
    broker_id: brokerId,
    title,
    description,
    type,
    status,
    neighborhood,
    location,
    area,
    price,
    rental_price,
    bedrooms,
    bathrooms,
    parking_spaces,
    cover_image: images[0] || null,
    images, // Array of strings
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
