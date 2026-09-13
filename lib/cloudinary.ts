import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:
    process.env.CLOUDINARY_API_KEY ||
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret:
    process.env.CLOUDINARY_API_SECRET ||
    process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

export function extractPublicId(cloudinaryUrl: string): string | null {
  try {
    const urlPattern = /\/upload\/(?:v\d+\/)?(.+)$/;
    const match = cloudinaryUrl.match(urlPattern);

    if (match && match[1]) {
      const pathWithExtension = match[1];
      const publicId = pathWithExtension.replace(/\.[^/.]+$/, "");
      return publicId;
    }

    return null;
  } catch (error) {
    console.error("Error extracting public_id:", error);
    return null;
  }
}

export async function deleteImage(url: string) {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey =
    process.env.CLOUDINARY_API_KEY ||
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret =
    process.env.CLOUDINARY_API_SECRET ||
    process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary configuration");
  }

  if (!url.includes("cloudinary.com")) {
    return { result: "ignored", message: "Not a cloudinary URL" };
  }

  const publicId = extractPublicId(url);
  if (!publicId) {
    throw new Error("Could not extract public_id");
  }

  return await cloudinary.uploader.destroy(publicId);
}
