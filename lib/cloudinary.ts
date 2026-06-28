import crypto from "crypto";

export async function uploadToCloudinary(imageUrl: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Cloudinary credentials missing, returning original URL.");
    return imageUrl;
  }

  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  
  // Generate signature: SHA-1 of `timestamp=<timestamp><api_secret>`
  const signatureString = `timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

  const formData = new FormData();
  formData.append("file", imageUrl);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Cloudinary upload failed:", errorData);
    return imageUrl; // Fallback to original URL
  }

  const data = await response.json();
  return data.secure_url;
}
