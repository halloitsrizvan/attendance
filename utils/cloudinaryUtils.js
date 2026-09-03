import { CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_UPLOAD_URL } from '@/Constants';

/**
 * Uploads an image file to Cloudinary and returns the secure URL.
 * Uses native fetch to ensure request headers remain clean and bypass any Axios interceptors.
 * @param {File|Blob} file 
 * @returns {Promise<string>} secure_url of uploaded image
 */
export async function uploadToCloudinary(file) {
  if (!file) throw new Error("No file provided");

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || 'diia_files');

  const res = await fetch(CLOUDINARY_UPLOAD_URL || 'https://api.cloudinary.com/v1_1/yhaatr1q/image/upload', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Failed to upload image to Cloudinary');
  }

  return data.secure_url;
}
