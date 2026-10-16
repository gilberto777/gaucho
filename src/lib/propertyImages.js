import { supabase } from '@/lib/supabase';

export const PROPERTY_IMAGE_FALLBACK = '/sem-foto.svg';

const IMAGE_OBJECT_FIELDS = [
  'url',
  'publicUrl',
  'public_url',
  'storage_path',
  'src',
  'original_url',
  'original',
  'large',
  'medium',
  'photo_url',
  'image_url',
];

const stripWrappingCharacters = (value) => value
  .trim()
  .replace(/^["']+|["',]+$/g, '')
  .trim();

const splitPostgresArray = (value) => {
  const body = value.slice(1, -1);
  const items = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < body.length; index += 1) {
    const character = body[index];

    if (character === '"' && body[index - 1] !== '\\') {
      quoted = !quoted;
      continue;
    }

    if (character === ',' && !quoted) {
      items.push(current);
      current = '';
      continue;
    }

    current += character;
  }

  if (current) items.push(current);
  return items;
};

const collectImageValues = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap(collectImageValues);
  }

  if (typeof value === 'object') {
    const directValue = IMAGE_OBJECT_FIELDS
      .map((field) => value[field])
      .find((candidate) => typeof candidate === 'string' && candidate.trim());

    if (directValue) return collectImageValues(directValue);

    return ['images', 'photos', 'fotos', 'gallery', 'galeria', 'media']
      .flatMap((field) => collectImageValues(value[field]));
  }

  if (typeof value !== 'string') return [];

  const text = value.trim();
  if (!text || /^(null|undefined)$/i.test(text)) return [];

  if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
    try {
      return collectImageValues(JSON.parse(text));
    } catch {
      if (text.startsWith('{') && text.endsWith('}')) {
        return splitPostgresArray(text).flatMap(collectImageValues);
      }
    }
  }

  if (text.includes('|')) return text.split('|').flatMap(collectImageValues);
  if (/\r?\n/.test(text)) return text.split(/\r?\n/).flatMap(collectImageValues);

  // Do not split ordinary URLs: commas can legally occur in their query string.
  if (text.includes(',') && !/^(https?:)?\/\//i.test(text) && !text.startsWith('data:')) {
    return text.split(',').flatMap(collectImageValues);
  }

  return [text];
};

const encodeStoragePath = (path) => path
  .split('/')
  .filter(Boolean)
  .map((segment) => {
    try {
      return encodeURIComponent(decodeURIComponent(segment));
    } catch {
      return encodeURIComponent(segment);
    }
  })
  .join('/');

const toStoragePublicUrl = (rawPath) => {
  const path = rawPath
    .replace(/^\/+/, '')
    .replace(/^storage\/v1\/object\/public\//i, '')
    .replace(/^property-images\//i, '');

  if (!path) return '';

  return supabase?.storage
    ?.from?.('property-images')
    ?.getPublicUrl?.(encodeStoragePath(path))
    ?.data?.publicUrl || '';
};

export const normalizeImageUrl = (raw, { assumeStoragePath = false } = {}) => {
  if (raw && typeof raw === 'object') {
    const candidate = IMAGE_OBJECT_FIELDS
      .map((field) => raw[field])
      .find((value) => typeof value === 'string' && value.trim());
    return normalizeImageUrl(candidate, { assumeStoragePath });
  }

  if (typeof raw !== 'string') return '';

  let value = stripWrappingCharacters(raw);
  if (!value || /^(null|undefined)$/i.test(value)) return '';

  if (/^data:image\//i.test(value) || /^blob:/i.test(value)) return value;
  if (/^\/\//.test(value)) value = `https:${value}`;

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value.replace(/ /g, '%20'));
      // Avoid mixed-content failures when the site is served over HTTPS.
      if (parsed.protocol === 'http:') parsed.protocol = 'https:';
      return parsed.toString();
    } catch {
      return '';
    }
  }

  if (/^(javascript|file|ftp):/i.test(value)) return '';

  const isStorageRoute = /^\/?(?:storage\/v1\/object\/public\/)?property-images\//i.test(value)
    || /^\/?storage\/v1\/object\/public\//i.test(value);

  if (assumeStoragePath || isStorageRoute) {
    return toStoragePublicUrl(value);
  }

  // Generic local assets (hero, logos and the local placeholder) remain local.
  if (value.startsWith('/')) return value;
  return `/${value.replace(/^\.\//, '')}`;
};

export const normalizeImageList = (value, options = { assumeStoragePath: true }) => {
  const seen = new Set();

  return collectImageValues(value)
    .map((item) => normalizeImageUrl(item, options))
    .filter((url) => {
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
};

export const getPropertyImageCandidates = (property = {}) => {
  const relatedImages = Array.isArray(property.property_images)
    ? [...property.property_images].sort((left, right) => {
      if (Boolean(left?.is_cover) !== Boolean(right?.is_cover)) return left?.is_cover ? -1 : 1;
      return (left?.order_index ?? Number.MAX_SAFE_INTEGER) - (right?.order_index ?? Number.MAX_SAFE_INTEGER);
    })
    : [];

  const candidates = [
    ...normalizeImageList(property.cover_image),
    ...normalizeImageList(relatedImages),
    ...normalizeImageList(property.images),
  ];

  return [...new Set(candidates)];
};

export const normalizePropertyMedia = (property) => {
  if (!property) return property;

  const plans = normalizeImageList(property.plans_urls);
  const legacyPlans = normalizeImageList(property.floor_plans);

  return {
    ...property,
    images: getPropertyImageCandidates(property),
    plans_urls: plans.length ? plans : legacyPlans,
    floor_plans: legacyPlans.length ? legacyPlans : plans,
  };
};

export const normalizePropertiesMedia = (properties = []) => properties.map(normalizePropertyMedia);
