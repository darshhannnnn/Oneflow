import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

// Initialize Google Cloud Storage
// For production: uses service account credentials from environment variables
// For local development: uses service account key file
let storage = null;
let isGCSEnabled = false;

const bucketName = process.env.GCP_BUCKET_NAME || 'oneflow-storage';

try {
  const storageConfig = {
    projectId: process.env.GCP_PROJECT_ID,
  };

  // Priority 1: Use JSON credentials from environment variable (recommended)
  if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
    try {
      const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
      storageConfig.credentials = credentials;
      console.log('✅ Using GCP_SERVICE_ACCOUNT_KEY credentials');
    } catch (error) {
      console.error('Failed to parse GCP_SERVICE_ACCOUNT_KEY:', error);
      throw error;
    }
  }
  // Priority 2: Use key file path (for local development)
  else if (process.env.GCP_KEY_FILE) {
    storageConfig.keyFilename = process.env.GCP_KEY_FILE;
    console.log('✅ Using GCP_KEY_FILE credentials');
  }
  // Priority 3: Use default credentials (e.g., Cloud Run default service account)
  else {
    console.log('✅ Using default GCP credentials');
  }

  storage = new Storage(storageConfig);
  isGCSEnabled = true;
  console.log('✅ GCS Storage initialized successfully');
} catch (error) {
  console.warn('⚠️  GCS Storage not configured. File uploads will use fallback URLs.');
  console.warn('Error:', error.message);
  console.warn('To enable GCS uploads, set GCP_PROJECT_ID and GCP_SERVICE_ACCOUNT_KEY environment variables.');
  isGCSEnabled = false;
}

/**
 * Upload a file to Google Cloud Storage
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} filename - Original filename
 * @param {string} mimetype - File MIME type
 * @param {string} folder - Optional folder path in bucket (e.g., 'avatars', 'documents')
 * @returns {Promise<{url: string, filename: string}>} - Public URL and stored filename
 */
export async function uploadToGCS(fileBuffer, filename, mimetype, folder = '') {
  // Check if GCS is enabled
  if (!isGCSEnabled || !storage) {
    throw new Error('GCS Storage is not configured. Please set up GCP credentials in environment variables.');
  }

  try {
    const bucket = storage.bucket(bucketName);
    
    // Generate unique filename to prevent overwrites
    const ext = filename.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${ext}`;
    const path = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;
    
    const file = bucket.file(path);
    
    // Upload options
    const options = {
      metadata: {
        contentType: mimetype,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
      resumable: false, // For files < 5MB, resumable upload is not needed
    };
    
    // Upload the file
    await file.save(fileBuffer, options);
    
    // Note: With Uniform bucket-level access, files inherit bucket permissions
    // No need to call makePublic() on individual files
    
    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${path}`;
    
    return {
      url: publicUrl,
      filename: uniqueFilename,
      path: path,
    };
  } catch (error) {
    console.error('GCS Upload Error:', error);
    throw new Error(`Failed to upload file to GCS: ${error.message}`);
  }
}

/**
 * Delete a file from Google Cloud Storage
 * @param {string} filePath - The file path in the bucket (e.g., 'avatars/xxx.jpg')
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteFromGCS(filePath) {
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.warn(`File ${filePath} does not exist in GCS`);
      return true; // Consider it deleted
    }
    
    // Delete the file
    await file.delete();
    
    return true;
  } catch (error) {
    console.error('GCS Delete Error:', error);
    throw new Error(`Failed to delete file from GCS: ${error.message}`);
  }
}

/**
 * Upload avatar image specifically
 * @param {Buffer} fileBuffer - The image buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - Image MIME type
 * @param {string} userId - User ID for organizing files
 * @returns {Promise<{url: string}>} - Public URL
 */
export async function uploadAvatar(fileBuffer, filename, mimetype, userId) {
  // Validate image types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(mimetype)) {
    throw new Error('Invalid image type. Only JPEG, PNG, WebP, and GIF are allowed.');
  }
  
  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (fileBuffer.length > maxSize) {
    throw new Error('File size exceeds 5MB limit.');
  }
  
  // Upload to avatars folder with user ID
  const folder = `avatars/${userId}`;
  return await uploadToGCS(fileBuffer, filename, mimetype, folder);
}

/**
 * Upload any file (generic function for future use)
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - File MIME type
 * @param {string} category - Category/folder (e.g., 'documents', 'attachments', 'receipts')
 * @param {string} userId - User ID for organizing files
 * @returns {Promise<{url: string}>} - Public URL
 */
export async function uploadFile(fileBuffer, filename, mimetype, category, userId) {
  // Validate file size (max 10MB for general files)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (fileBuffer.length > maxSize) {
    throw new Error('File size exceeds 10MB limit.');
  }
  
  // Upload to category folder with user ID
  const folder = `${category}/${userId}`;
  return await uploadToGCS(fileBuffer, filename, mimetype, folder);
}

/**
 * Extract file path from GCS URL
 * @param {string} url - The GCS public URL
 * @returns {string|null} - File path in bucket or null if invalid
 */
export function extractPathFromUrl(url) {
  try {
    const pattern = new RegExp(`https://storage.googleapis.com/${bucketName}/(.+)`);
    const match = url.match(pattern);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

export default {
  uploadToGCS,
  deleteFromGCS,
  uploadAvatar,
  uploadFile,
  extractPathFromUrl,
};
