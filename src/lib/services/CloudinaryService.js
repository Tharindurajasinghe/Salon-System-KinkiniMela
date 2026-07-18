import { v2 as cloudinary } from "cloudinary";

/**
 * CloudinaryService
 * -----------------
 * OOP wrapper around Cloudinary for image upload/delete. Credentials come
 * exclusively from environment variables.
 */
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    this.client = cloudinary;
  }

  /**
   * Upload a base64 data URI or remote URL.
   * @returns { url, publicId }
   */
  async upload(fileData, folder = "salon") {
    const res = await this.client.uploader.upload(fileData, {
      folder,
      resource_type: "image",
    });
    return { url: res.secure_url, publicId: res.public_id };
  }

  /** Delete an image by its stored public_id. */
  async destroy(publicId) {
    if (!publicId) return;
    return this.client.uploader.destroy(publicId);
  }
}

export const cloudinaryService = new CloudinaryService();
