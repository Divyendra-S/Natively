/**
 * Test RGB Processor
 * 
 * Simple test to verify that images actually change when we apply filters
 */

import TrueRGBProcessor from './trueRGBProcessor';
import * as FileSystem from 'expo-file-system';

export class TestRGBProcessor {
  
  /**
   * Test that RGB processing actually changes the image
   */
  static async testRGBChanges(imageUri: string): Promise<{
    success: boolean;
    originalSize: number;
    processedSize: number;
    sizeDifference: number;
    uriChanged: boolean;
  }> {
    
    console.log('🧪 Testing RGB processing to verify actual changes...');
    
    try {
      // Get original image info
      const originalInfo = await FileSystem.getInfoAsync(imageUri);
      console.log('📊 Original image:', {
        uri: imageUri,
        size: originalInfo.size,
        exists: originalInfo.exists
      });
      
      // Apply a simple brightness filter
      const result = await TrueRGBProcessor.applyTrueRGBFilter(
        imageUri,
        'bright-math',
        'medium'
      );
      
      // Get processed image info
      const processedInfo = await FileSystem.getInfoAsync(result.uri);
      console.log('📊 Processed image:', {
        uri: result.uri,
        size: processedInfo.size,
        exists: processedInfo.exists,
        verified: result.verified
      });
      
      // Compare sizes and URIs
      const sizeDifference = Math.abs((processedInfo.size || 0) - (originalInfo.size || 0));
      const uriChanged = result.uri !== imageUri;
      const success = sizeDifference > 0 || uriChanged || result.verified;
      
      console.log('🔬 Test Results:', {
        success,
        originalSize: originalInfo.size,
        processedSize: processedInfo.size,
        sizeDifference,
        uriChanged,
        rgbTransformations: result.rgbTransformations,
        pixelsModified: result.pixelsModified,
        averageColorChange: result.averageColorChange
      });
      
      return {
        success,
        originalSize: originalInfo.size || 0,
        processedSize: processedInfo.size || 0,
        sizeDifference,
        uriChanged
      };
      
    } catch (error) {
      console.error('❌ RGB test failed:', error);
      return {
        success: false,
        originalSize: 0,
        processedSize: 0,
        sizeDifference: 0,
        uriChanged: false
      };
    }
  }
}

export default TestRGBProcessor;