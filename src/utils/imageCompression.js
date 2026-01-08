/**
 * Image Compression Utility
 * Compresses images before upload to improve chat performance
 * Similar to WhatsApp, Slack, Discord approach
 */

/**
 * Compress an image file
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width (default: 1920)
 * @param {number} options.maxHeight - Maximum height (default: 1920)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
 * @param {number} options.maxSizeMB - Maximum file size in MB (default: 1)
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.8,
      maxSizeMB = 1
    } = options;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      resolve(file); // Return original if not an image
      return;
    }

    // Check if file is already small enough
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB <= maxSizeMB) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new file from blob
            const compressedFile = new File(
              [blob],
              file.name,
              {
                type: 'image/jpeg', // Always convert to JPEG for better compression
                lastModified: Date.now()
              }
            );

            // Check if compressed size is acceptable
            const compressedSizeMB = compressedFile.size / (1024 * 1024);
            
            if (compressedSizeMB <= maxSizeMB) {
              resolve(compressedFile);
            } else {
              // If still too large, try with lower quality
              if (quality > 0.5) {
                compressImage(file, { ...options, quality: quality - 0.1 })
                  .then(resolve)
                  .catch(reject);
              } else {
                // Use the compressed version even if slightly over limit
                resolve(compressedFile);
              }
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Generate a thumbnail for an image
 * @param {File} file - The image file
 * @param {number} maxSize - Maximum dimension for thumbnail (default: 200)
 * @returns {Promise<string>} - Data URL of thumbnail
 */
export const generateThumbnail = (file, maxSize = 200) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate thumbnail dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas for thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        resolve(thumbnail);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Check if file needs compression
 * @param {File} file - The file to check
 * @param {number} maxSizeMB - Maximum size in MB (default: 1)
 * @returns {boolean}
 */
export const needsCompression = (file, maxSizeMB = 1) => {
  if (!file.type.startsWith('image/')) {
    return false;
  }
  const fileSizeMB = file.size / (1024 * 1024);
  return fileSizeMB > maxSizeMB;
};

