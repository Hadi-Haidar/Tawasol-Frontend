import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PhotoIcon,
  PlusIcon,
  CurrencyDollarIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { productApi } from '../../../services/api';

const AddProductModal = ({ room, product = null, onClose, onSuccess }) => {
  const isEditing = !!product;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    status: 'active',
    category: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when editing
  useEffect(() => {
    if (isEditing && product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        status: product.status || 'active',
        category: product.category || ''
      });
      
      // Set existing images
      if (product.images && product.images.length > 0) {
        setExistingImages(product.images);
      }
    }
  }, [isEditing, product]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 🛡️ PROTECTION: Prevent browser interference on stock field
    if (name === 'stock') {
      // Store the user's actual input
      const userInput = value;
      
      // Check for interference after a short delay
      setTimeout(() => {
        if (e.target.value !== userInput) {
          // Browser changed the value - restore it
          e.target.value = userInput;
          setFormData(prev => ({
            ...prev,
            [name]: userInput
          }));
        }
      }, 50);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check total count including existing images
    const totalCount = images.length + files.length;
    if (totalCount > 3) {
      setErrors(prev => ({
        ...prev,
        images: `Maximum 3 images allowed. You currently have ${images.length} image(s) and are trying to add ${files.length} more.`
      }));
      return;
    }

    // Validate file sizes (max 2MB each)
    const invalidFiles = files.filter(file => file.size > 2 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        images: 'Each image must be less than 2MB'
      }));
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalidTypes = files.filter(file => !validTypes.includes(file.type));
    if (invalidTypes.length > 0) {
      setErrors(prev => ({
        ...prev,
        images: 'Only JPEG, PNG, GIF and WebP images are allowed'
      }));
      return;
    }

    // Append new images to existing ones instead of replacing
    setImages(prev => [...prev, ...files]);
    setErrors(prev => ({
      ...prev,
      images: ''
    }));

    // Create previews for new files
    const previews = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({
          file,
          url: e.target.result,
          name: file.name
        });
        reader.readAsDataURL(file);
      });
    });

    // Append new previews to existing ones
    Promise.all(previews).then(newPreviews => {
      setImagePreviews(prev => [...prev, ...newPreviews]);
    });

    // Clear the file input so user can select more images
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId, index) => {
    setImagesToRemove(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Product name must be less than 255 characters';
    }
    
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }
    
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) < 0) {
      newErrors.price = 'Valid price is required';
    } else if (parseFloat(formData.price) > 999999.99) {
      newErrors.price = 'Price must be less than $999,999.99';
    }
    
    if (!formData.stock || isNaN(formData.stock) || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    } else if (parseInt(formData.stock) > 999999) {
      newErrors.stock = 'Stock must be less than 999,999';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        status: formData.status,
        category: formData.category.trim() || null,
        images: images,
        remove_images: imagesToRemove
      };

      let response;
      if (isEditing) {
        response = await productApi.updateProduct(product.id, productData);
      } else {
        response = await productApi.createProduct(room.id, productData);
      }
      
      if (response.product) {
        onSuccess(response.product);
      } else {
        throw new Error(`Product ${isEditing ? 'updated' : 'created'} but no data returned`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} product:`, error);
      
      // Handle validation errors from backend
      if (error.message.includes('validation') || error.message.includes('422')) {
        setErrors({ submit: 'Please check your input and try again.' });
      } else if (error.message.includes('403')) {
        setErrors({ submit: `You do not have permission to ${isEditing ? 'edit' : 'add'} products ${isEditing ? 'in' : 'to'} this room.` });
      } else if (error.message.includes('413')) {
        setErrors({ submit: 'Files are too large. Please reduce image sizes.' });
      } else {
        setErrors({ submit: error.message || `Failed to ${isEditing ? 'update' : 'create'} product. Please try again.` });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${isEditing ? 'from-blue-500 to-blue-600' : 'from-green-500 to-emerald-600'} rounded-lg flex items-center justify-center`}>
              {isEditing ? (
                <PencilIcon className="w-6 h-6 text-white" />
              ) : (
                <PlusIcon className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEditing ? `Update "${product?.name}"` : `Add a product to ${room.name}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Existing Images - Only show when editing */}
          {isEditing && existingImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Current Images
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {existingImages.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${image.file_path}`}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image.id, index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Click the × to remove images
              </p>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <TagIcon className="w-4 h-4 mr-2" />
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              maxLength={255}
              className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter product name..."
              required
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              maxLength={1000}
              className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${
                errors.description ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Describe your product..."
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
              {formData.description.length}/1000 characters
            </div>
            {errors.description && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <TagIcon className="w-4 h-4 mr-2" />
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              maxLength={255}
              className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.category ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="e.g., Electronics, Clothing, Books..."
            />
            {errors.category && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.category}
              </p>
            )}
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                Price (USD) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                max="999999.99"
                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.price ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0.00"
                required
              />
              {errors.price && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.price}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ArchiveBoxIcon className="w-4 h-4 mr-2" />
                Stock Quantity *
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                onInput={(e) => {
                  // Only allow numbers
                  e.target.value = e.target.value.replace(/[^0-9]/g, '');
                }}
                onKeyDown={(e) => {
                  // Only allow numbers and control keys
                  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                min="0"
                max="999999"
                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.stock ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0"
                required
              />
              {errors.stock && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.stock}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Images */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <PhotoIcon className="w-4 h-4 mr-2" />
              Product Images
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Max 3 images, 2MB each)</span>
            </label>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
                disabled={loading}
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer flex flex-col items-center justify-center space-y-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <PhotoIcon className="w-12 h-12 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    JPEG, PNG, GIF, WebP up to 2MB each
                  </p>
                </div>
              </label>
            </div>

            {errors.images && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.images}
              </p>
            )}

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selected Images ({imagePreviews.length}/3)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={loading}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                        {preview.name}
                      </div>
                      <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                        {(preview.file.size / 1024 / 1024).toFixed(1)}MB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditing ? (
                    <PencilIcon className="w-4 h-4 mr-2" />
                  ) : (
                    <PlusIcon className="w-4 h-4 mr-2" />
                  )}
                  {isEditing ? 'Update Product' : 'Create Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal; 