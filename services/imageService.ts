import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database/types';
import type { ImageInsert } from '../lib/database/queries/images';

export interface ImageUploadResult {
  uri: string;
  publicUrl: string;
  fileName: string;
}

export interface ImageCompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: ImageManipulator.SaveFormat;
}

export class ImageService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Test Supabase connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing database connection...');
      const { data, error } = await this.supabase
        .from('images')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }
      
      console.log('Database connection successful');
      
      // Also test storage connection
      console.log('Testing storage connection...');
      const { data: buckets, error: storageError } = await this.supabase.storage.listBuckets();
      
      if (storageError) {
        console.error('Storage connection test failed:', storageError);
        return false;
      }
      
      console.log('Storage connection successful, buckets:', buckets?.map(b => b.name));
      return true;
    } catch (error) {
      console.error('Connection test error:', error);
      return false;
    }
  }

  /**
   * Fallback upload method using direct REST API
   */
  private async uploadWithFallback(
    filePath: string, 
    arrayBuffer: ArrayBuffer, 
    contentType: string
  ): Promise<void> {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    // Get current session for auth token
    const { data: { session } } = await this.supabase.auth.getSession();
    const authToken = session?.access_token || supabaseKey;

    const url = `${supabaseUrl}/storage/v1/object/images/${filePath}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'apikey': supabaseKey,
        'Content-Type': contentType,
        'x-upsert': 'false',
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  }

  /**
   * Compress and optimize image for upload
   */
  async compressImage(
    uri: string,
    options: ImageCompressionOptions = {}
  ): Promise<string> {
    const {
      quality = 0.8,
      maxWidth = 1024,
      maxHeight = 1024,
      format = ImageManipulator.SaveFormat.JPEG // Always use JPEG format
    } = options;

    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxHeight,
            },
          },
        ],
        {
          compress: quality,
          format,
          base64: false,
        }
      );

      return result.uri;
    } catch (error) {
      console.error('Image compression failed:', error);
      throw new Error('Failed to compress image');
    }
  }

  /**
   * Upload image to Supabase Storage
   */
  async uploadImage(
    uri: string,
    userId: string,
    fileName?: string
  ): Promise<ImageUploadResult> {
    try {
      console.log('Starting image upload for user:', userId);
      
      // Compress image before upload
      const compressedUri = await this.compressImage(uri);
      console.log('Image compressed successfully');
      
      // Read file info to get size
      const fileInfo = await FileSystem.getInfoAsync(compressedUri);
      console.log('File info:', fileInfo);

      // Generate unique filename
      const timestamp = Date.now();
      let fileExtension = uri.split('.').pop() || 'jpg';
      
      // Normalize file extension and MIME type
      if (fileExtension.toLowerCase() === 'jpg') {
        fileExtension = 'jpeg';
      }
      
      const finalFileName = fileName || `image_${timestamp}.${fileExtension}`;
      const filePath = `${userId}/${finalFileName}`;
      console.log('Generated file path:', filePath);

      // Read file as binary data using fetch (React Native compatible)
      console.log('Reading file as blob using fetch...');
      let arrayBuffer: ArrayBuffer;
      try {
        const response = await fetch(compressedUri);
        if (!response.ok) {
          throw new Error(`Failed to read file: ${response.status}`);
        }
        arrayBuffer = await response.arrayBuffer();
        console.log('Created ArrayBuffer, size:', arrayBuffer.byteLength);
      } catch (fetchError) {
        console.error('Failed to read file with fetch:', fetchError);
        throw new Error('Failed to read image file for upload');
      }

      // Upload ArrayBuffer to Supabase Storage
      const mimeType = `image/${fileExtension}`;
      console.log('Attempting upload to Supabase storage with MIME type:', mimeType);
      const { data, error } = await this.supabase.storage
        .from('images')
        .upload(filePath, arrayBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        
        // Try fallback method using direct REST API
        console.log('Trying fallback upload method...');
        try {
          const fallbackResult = await this.uploadWithFallback(filePath, arrayBuffer, mimeType);
          console.log('Fallback upload successful');
          
          // Get public URL
          const { data: publicUrlData } = this.supabase.storage
            .from('images')
            .getPublicUrl(filePath);

          return {
            uri: compressedUri,
            publicUrl: publicUrlData.publicUrl,
            fileName: finalFileName,
          };
        } catch (fallbackError) {
          console.error('Fallback upload also failed:', fallbackError);
          throw error; // Throw original error
        }
      }

      console.log('Upload successful, data:', data);

      // Get public URL
      const { data: publicUrlData } = this.supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      console.log('Generated public URL:', publicUrlData.publicUrl);

      return {
        uri: compressedUri,
        publicUrl: publicUrlData.publicUrl,
        fileName: finalFileName,
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      // Re-throw the original error for better debugging
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Save image metadata to database
   */
  async saveImageRecord(imageData: ImageInsert): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('images')
        .insert(imageData)
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('Failed to save image record:', error);
      throw new Error('Failed to save image metadata');
    }
  }

  /**
   * Update image status
   */
  async updateImageStatus(
    imageId: string,
    status: string,
    additionalData?: Partial<ImageInsert>
  ): Promise<void> {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData,
      };

      const { error } = await this.supabase
        .from('images')
        .update(updateData)
        .eq('id', imageId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to update image status:', error);
      throw new Error('Failed to update image status');
    }
  }

  /**
   * Get user's images from database
   */
  async getUserImages(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch user images:', error);
      throw new Error('Failed to fetch images');
    }
  }

  /**
   * Delete image from storage and database
   */
  async deleteImage(imageId: string, filePath: string): Promise<void> {
    try {
      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from('images')
        .remove([filePath]);

      if (storageError) {
        console.warn('Failed to delete from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await this.supabase
        .from('images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        throw dbError;
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Convert image to base64 for AI analysis
   */
  async imageToBase64(uri: string): Promise<string> {
    try {
      // Check if it's a remote URL (starts with http/https)
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        // Download the image first
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        // Convert to ArrayBuffer then to base64
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      } else {
        // Local file, use FileSystem
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
      }
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
    try {
      const result = await ImageManipulator.manipulateAsync(uri, [], {
        base64: false,
      });
      return {
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Failed to get image dimensions:', error);
      return { width: 0, height: 0 };
    }
  }

  /**
   * Create thumbnail version of image
   */
  async createThumbnail(uri: string, size: number = 200): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: size,
              height: size,
            },
          },
        ],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return result.uri;
    } catch (error) {
      console.error('Failed to create thumbnail:', error);
      throw new Error('Failed to create thumbnail');
    }
  }

  /**
   * Retry upload with exponential backoff
   */
  async uploadWithRetry(
    uri: string,
    userId: string,
    fileName?: string,
    maxRetries: number = 3
  ): Promise<ImageUploadResult> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.uploadImage(uri, userId, fileName);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}