import { supabase } from './supabase';

const CARD_FIELDS = [
  'id',
  'title',
  'slug',
  'type',
  'purpose',
  'status',
  'price',
  'area_total',
  'area_useful',
  'bedrooms',
  'bathrooms',
  'parking_spaces',
  'neighborhood',
  'city',
  'state',
  'latitude',
  'longitude',
  'features',
  'is_featured',
  'is_active',
  'short_description',
  'property_stage',
  'whatsapp_number',
  'internal_code',
  'code',
  'video_url',
  'tour_url',
  'created_at',
  'updated_at',
].join(',');

const IMAGE_FIELDS = 'id,url,storage_path,alt_text,order_index,is_cover,image_type';

// Cards never need descriptions, embeddings or entire image galleries. Keeping
// this projection small prevents a listing visit from exhausting database egress.
export const PUBLIC_PROPERTY_CARD_SELECT = `${CARD_FIELDS},property_images(${IMAGE_FIELDS})`;
export const PUBLIC_PROPERTY_DETAIL_SELECT = `*,property_images(${IMAGE_FIELDS})`;

export const withCardImageScope = (query) => query
  .eq('property_images.image_type', 'photo')
  .order('is_cover', { foreignTable: 'property_images', ascending: false })
  .order('order_index', { foreignTable: 'property_images', ascending: true })
  .limit(1, { foreignTable: 'property_images' });

const toPublicImageUrl = (raw) => {
  if (typeof raw !== 'string') return '';

  const url = raw.trim().replace(/^["']+|["',]+$/g, '').trim();
  if (!url) return '';

  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) {
    return url.includes(' ') ? url.replace(/ /g, '%20') : url;
  }

  const path = url
    .replace(/^\/+/, '')
    .replace(/^storage\/v1\/object\/public\//, '')
    .replace(/^property-images\//, '');

  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return supabase?.storage
    ?.from?.('property-images')
    ?.getPublicUrl?.(encodedPath)
    ?.data?.publicUrl || url;
};

const normalizeLegacyUrls = (value) => {
  if (!value) return [];

  let values = value;
  if (typeof value === 'string') {
    try {
      values = JSON.parse(value);
    } catch {
      values = value.split(/\s*[|,]\s*/);
    }
  }

  if (!Array.isArray(values)) return [];

  return values
    .map((item) => {
      if (typeof item === 'string') return toPublicImageUrl(item);
      if (item && typeof item === 'object') {
        return toPublicImageUrl(item.url || item.publicUrl || item.public_url || item.storage_path || '');
      }
      return '';
    })
    .filter(Boolean);
};

const stageToLegacyStatus = (stage) => {
  if (stage === 'under_construction') return 'construction';
  if (stage === 'resale' || stage === 'decorated') return 'ready';
  return stage;
};

export const normalizeProperty = (property) => {
  if (!property) return property;

  const relatedImages = Array.isArray(property.property_images)
    ? [...property.property_images].sort((a, b) => {
      if (Boolean(a.is_cover) !== Boolean(b.is_cover)) return a.is_cover ? -1 : 1;
      return (a.order_index || 0) - (b.order_index || 0);
    })
    : [];

  const photos = relatedImages
    .filter((image) => !image.image_type || image.image_type === 'photo')
    .map((image) => toPublicImageUrl(image.url || image.storage_path || ''))
    .filter(Boolean);

  const floorPlans = relatedImages
    .filter((image) => image.image_type === 'floor_plan')
    .map((image) => toPublicImageUrl(image.url || image.storage_path || ''))
    .filter(Boolean);

  const businessType = property.business_type || property.purpose || 'sale';
  const area = property.area ?? property.area_useful ?? property.area_total ?? null;
  const location = property.location || [property.city, property.state].filter(Boolean).join(', ');

  return {
    ...property,
    business_type: businessType,
    rental_price: property.rental_price ?? (businessType === 'rent' ? property.price : null),
    featured: property.featured ?? property.is_featured ?? false,
    property_status: property.property_status || stageToLegacyStatus(property.property_stage),
    area,
    location,
    lat: property.lat ?? property.latitude ?? null,
    lng: property.lng ?? property.longitude ?? null,
    amenities: property.amenities || property.features || [],
    images: photos.length ? photos : normalizeLegacyUrls(property.images),
    plans_urls: floorPlans.length ? floorPlans : normalizeLegacyUrls(property.plans_urls),
    floor_plans: floorPlans.length ? floorPlans : normalizeLegacyUrls(property.floor_plans),
    video_url: property.video_url || null,
    virtual_tour_url: property.virtual_tour_url || property.tour_url || null,
  };
};

export const normalizeProperties = (properties = []) => properties.map(normalizeProperty);
