import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { trackLeadEvent } from '@/utils/gaHelper';
import { PROPERTY_DETAIL_SELECT_FIELDS, withPropertyDetailImages } from '@/lib/propertySelect';
import { normalizePropertyMedia } from '@/lib/propertyImages';

/**
 * Custom hook to fetch property data and handle related states/tracking
 * @param {string} slug - The property slug to fetch
 * @returns {Object} { property, loading, error }
 */
const useProperty = (slug) => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If no slug provided, don't attempt fetch
    if (!slug) return;

    // AbortController to cancel fetch if component unmounts
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: slugData, error: slugError } = await withPropertyDetailImages(
          supabase
            .from('properties')
            .select(PROPERTY_DETAIL_SELECT_FIELDS)
            .eq('slug', slug)
        ).maybeSingle();

        if (slugError) throw slugError;

        let data = slugData;

        if (!data) {
          const { data: codeData, error: codeError } = await withPropertyDetailImages(
            supabase
              .from('properties')
              .select(PROPERTY_DETAIL_SELECT_FIELDS)
              .eq('code', slug)
          ).maybeSingle();

          if (codeError) throw codeError;
          data = codeData;
        }

        if (!data) throw new Error('Property not found');

        // Only update state if not aborted
        if (!signal.aborted) {
          const normalized = normalizePropertyMedia(data);

          setProperty(normalized);

          // Trigger GA4 event for viewing item
          // This should ideally happen only once per valid view
          trackLeadEvent('view_item', {
            currency: 'BRL',
            value: normalized.business_type === 'rent' ? normalized.rental_price : normalized.price,
            items: [{
                item_id: normalized.code || normalized.slug,
                item_name: normalized.title,
                item_category: normalized.business_type === 'rent' ? 'Locação' : 'Venda',
            }],
          });
        }
      } catch (err) {
        if (!signal.aborted) {
          console.error('Error fetching property:', err);
          setError(err);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProperty();

    // Cleanup function
    return () => {
      controller.abort();
    };
  }, [slug]);

  return { property, loading, error };
};

export default useProperty;
