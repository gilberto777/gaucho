import { supabase } from '@/lib/supabase';
import { generateSlug } from '@/lib/slugGenerator';
import { getPropertyImageCandidates } from '@/lib/propertyImages';

const ensureUniqueSlug = async (baseSlug) => {
  let slug = baseSlug;
  let counter = 2;

  // Avoid infinite loops by limiting attempts
  while (counter < 50) {
    const { data, error } = await supabase
      .from('properties')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return slug;

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  // Fallback: timestamp
  return `${baseSlug}-${Date.now()}`;
};

// Minimal, functional shape for an Orulo-like payload.
// You can extend mapping later without breaking callers.
export const importOruloProperty = async ({ broker_id, data }) => {
  try {
    if (!broker_id) throw new Error('broker_id is required');
    if (!data || typeof data !== 'object') throw new Error('data is required');

    const title = data.title || data.nome || data.name || 'Imóvel sem título';
    const neighborhood = data.neighborhood || data.bairro || 'Bairro a confirmar';

    const baseSlug = generateSlug(data.slug || title);
    const slug = await ensureUniqueSlug(baseSlug);
    const images = getPropertyImageCandidates({
      cover_image: data.cover_image
        || data.main_image
        || data.main_photo
        || data.featured_image
        || data.image
        || data.imagem,
      images: data.images
        || data.photos
        || data.fotos
        || data.gallery
        || data.galeria
        || data.media,
    });

    const payload = {
      broker_id,
      title,
      slug,
      description: data.description || data.descricao || '',
      neighborhood,
      address: data.address || data.endereco || null,
      location: data.location || 'São Paulo, SP',
      lat: data.lat ? Number(data.lat) : null,
      lng: data.lng ? Number(data.lng) : null,
      business_type: data.business_type || data.negocio || 'venda',
      price: data.price ? Number(data.price) : null,
      rental_price: data.rental_price ? Number(data.rental_price) : null,
      starting_from_price: data.starting_from_price ? Number(data.starting_from_price) : null,
      type: data.type || 'Apartamento',
      property_status: data.property_status || 'Pronto',
      area: data.area ? Number(data.area) : null,
      bedrooms: data.bedrooms ? Number(data.bedrooms) : 0,
      bathrooms: data.bathrooms ? Number(data.bathrooms) : 0,
      parking_spaces: data.parking_spaces ? Number(data.parking_spaces) : 0,
      cover_image: images[0] || null,
      images,
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      status: 'active'
    };

    const { data: inserted, error } = await supabase
      .from('properties')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: inserted };
  } catch (error) {
    console.error('Error importing Orulo property:', error);
    return { success: false, error };
  }
};
