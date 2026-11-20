import { API_BASE_URL } from '../api/axiosClient.js';

export const DEFAULT_PRODUCT_IMAGE = '/placeholder.svg';

const API_ORIGIN = new URL(API_BASE_URL).origin;

export function getProductImageUrl(path) {
  if (typeof path !== 'string' || !path.trim()) return DEFAULT_PRODUCT_IMAGE;

  const imagePath = path.trim();
  if (imagePath === DEFAULT_PRODUCT_IMAGE) return DEFAULT_PRODUCT_IMAGE;

  try {
    const url = new URL(imagePath, `${API_ORIGIN}/`);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
  } catch {
    return DEFAULT_PRODUCT_IMAGE;
  }

  return DEFAULT_PRODUCT_IMAGE;
}

export function handleProductImageError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
}
