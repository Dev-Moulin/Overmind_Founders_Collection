/**
 * Pinata IPFS Upload Utility
 *
 * Upload images to IPFS via Pinata for use in atom creation (Thing schema).
 * Requires VITE_PINATA_API_KEY and VITE_PINATA_SECRET_KEY env vars.
 */

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

export function isPinataConfigured(): boolean {
  return !!(import.meta.env.VITE_PINATA_API_KEY && import.meta.env.VITE_PINATA_SECRET_KEY);
}

export async function uploadImageToPinata(file: File): Promise<string> {
  const apiKey = import.meta.env.VITE_PINATA_API_KEY;
  const secretKey = import.meta.env.VITE_PINATA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('Pinata API keys not configured');
  }

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(PINATA_API_URL, {
    method: 'POST',
    headers: {
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Pinata upload failed: ${res.statusText}`);
  }

  const { IpfsHash } = await res.json();
  return `${PINATA_GATEWAY}/${IpfsHash}`;
}
