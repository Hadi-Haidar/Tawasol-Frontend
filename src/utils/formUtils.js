/**
 * Form utilities for consistent FormData handling
 */

/**
 * Create FormData from an object with proper handling of files and arrays
 * @param {Object} data - The data object to convert to FormData
 * @param {Object} options - Configuration options
 * @returns {FormData} The created FormData object
 */
export const createFormData = (data, options = {}) => {
  const formData = new FormData();
  const {
    method = null, // For Laravel method override
    arrayIndexing = true, // Whether to use array indexing for arrays
    skipEmpty = false // Whether to skip null/undefined values
  } = options;

  // Add Laravel method override if specified
  if (method) {
    formData.append('_method', method);
  }

  // Helper function to append data
  const appendToFormData = (key, value) => {
    if (skipEmpty && (value === null || value === undefined || value === '')) {
      return;
    }

    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const arrayKey = arrayIndexing ? `${key}[${index}]` : key;
        appendToFormData(arrayKey, item);
      });
    } else if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0');
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  };

  // Process all data
  Object.entries(data).forEach(([key, value]) => {
    appendToFormData(key, value);
  });

  return formData;
};

/**
 * Create FormData for file uploads with metadata
 * @param {Object} fileData - Object containing file and metadata
 * @param {Object} options - Configuration options
 * @returns {FormData} The created FormData object
 */
export const createFileFormData = (fileData, options = {}) => {
  const { file, type, message, ...metadata } = fileData;
  
  return createFormData({
    file,
    type,
    message: message || '',
    ...metadata
  }, options);
};

/**
 * Create FormData for post/content creation
 * @param {Object} postData - The post data
 * @param {Object} options - Configuration options
 * @returns {FormData} The created FormData object
 */
export const createPostFormData = (postData, options = {}) => {
  const {
    title,
    content,
    visibility,
    is_featured,
    scheduled_at,
    media,
    mediaTypes,
    delete_media,
    ...rest
  } = postData;

  const data = {
    title,
    content,
    visibility,
    is_featured,
    ...rest
  };

  // Add scheduled_at if provided
  if (scheduled_at) {
    data.scheduled_at = scheduled_at;
  }

  // Handle media files
  if (media && media.length > 0) {
    data.media = media;
    if (mediaTypes) {
      data.media_types = mediaTypes;
    }
  }

  // Handle media deletion
  if (delete_media && delete_media.length > 0) {
    data.delete_media = delete_media;
  }

  return createFormData(data, options);
};

/**
 * Validate form data before submission
 * @param {Object} data - The data to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result with { isValid, errors }
 */
export const validateFormData = (data, requiredFields = []) => {
  const errors = [];

  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}; 