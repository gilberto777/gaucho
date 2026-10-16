const PROPERTY_FIELDS = [
  'id',
  'code',
  'broker_id',
  'title',
  'slug',
  'description',
  'business_type',
  'price',
  'rental_price',
  'starting_from_price',
  'bedrooms',
  'bathrooms',
  'suites',
  'parking_spaces',
  'area',
  'type',
  'neighborhood',
  'address',
  'location',
  'lat',
  'lng',
  'status',
  'property_status',
  'featured',
  'images',
  'cover_image',
  'plans_urls',
  'floor_plans',
  'video_url',
  'youtube_url',
  'virtual_tour_url',
  'amenities',
  'meta_title',
  'meta_description',
  'created_at',
  'updated_at',
];

const PROPERTY_CARD_FIELDS = [
  'id',
  'code',
  'title',
  'slug',
  'business_type',
  'price',
  'rental_price',
  'starting_from_price',
  'bedrooms',
  'bathrooms',
  'suites',
  'parking_spaces',
  'area',
  'type',
  'neighborhood',
  'address',
  'location',
  'lat',
  'lng',
  'status',
  'property_status',
  'featured',
  'images',
  'cover_image',
  'video_url',
  'youtube_url',
  'virtual_tour_url',
  'amenities',
  'created_at',
  'updated_at',
];

const PROPERTY_IMAGE_FIELDS = 'id,image_url,storage_path,alt_text,order_index,is_cover';

export const PROPERTY_SELECT_FIELDS = PROPERTY_FIELDS.join(', ');
export const PROPERTY_CARD_SELECT_FIELDS = `${PROPERTY_CARD_FIELDS.join(', ')}, property_images(${PROPERTY_IMAGE_FIELDS})`;
export const PROPERTY_DETAIL_SELECT_FIELDS = `${PROPERTY_SELECT_FIELDS}, property_images(${PROPERTY_IMAGE_FIELDS})`;

const orderRelatedImages = (query) => query
  .order('is_cover', { foreignTable: 'property_images', ascending: false })
  .order('order_index', { foreignTable: 'property_images', ascending: true });

// Cards only need a small ordered candidate set: the stored cover plus enough
// related photos to recover if one remote URL is unavailable.
export const withPropertyCardImages = (query) => orderRelatedImages(query)
  .limit(4, { foreignTable: 'property_images' });

export const withPropertyDetailImages = (query) => orderRelatedImages(query);
