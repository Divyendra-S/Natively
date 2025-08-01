import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';
import { EnhancementRecommendations, DetailedAnalysis } from './analysisEngine';

export interface EditingOptions {
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  sharpness?: number; // -100 to 100
  reduceNoise?: boolean;
  autoEnhance?: boolean;
  crop?: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
  resize?: {
    width?: number;
    height?: number;
  };
  rotate?: number; // degrees
  flip?: 'horizontal' | 'vertical';
}

export interface EditingResult {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

export class EditingEngine {
  async enhanceImage(
    imageUri: string,
    analysis: DetailedAnalysis,
    customOptions?: Partial<EditingOptions>
  ): Promise<EditingResult> {
    try {
      let options = this.buildOptionsFromAnalysis(analysis);
      
      // Merge with custom options if provided
      if (customOptions) {
        options = { ...options, ...customOptions };
      }

      return await this.applyEdits(imageUri, options);
    } catch (error) {
      console.error('Enhancement failed:', error);
      throw new Error('Failed to enhance image');
    }
  }

  async applyEdits(imageUri: string, options: EditingOptions): Promise<EditingResult> {
    try {
      const actions = [];

      // Apply cropping first if specified
      if (options.crop) {
        actions.push({
          crop: options.crop,
        });
      }

      // Apply resize if specified
      if (options.resize) {
        actions.push({
          resize: options.resize,
        });
      }

      // Apply rotation if specified
      if (options.rotate && options.rotate !== 0) {
        actions.push({
          rotate: options.rotate,
        });
      }

      // Apply flip if specified
      if (options.flip) {
        actions.push({
          flip: options.flip === 'horizontal' ? FlipType.Horizontal : FlipType.Vertical,
        });
      }

      // Apply basic adjustments using filters (limited by expo-image-manipulator)
      // Note: expo-image-manipulator has limited filter support
      // For production, consider using react-native-image-filter-kit or similar
      
      const result = await manipulateAsync(
        imageUri,
        actions,
        {
          compress: 0.9,
          format: SaveFormat.JPEG,
          base64: false,
        }
      );

      return result;
    } catch (error) {
      console.error('Image manipulation failed:', error);
      throw new Error('Failed to apply image edits');
    }
  }

  private buildOptionsFromAnalysis(analysis: DetailedAnalysis): EditingOptions {
    const { recommendations } = analysis;

    const options: EditingOptions = {
      brightness: recommendations.adjustBrightness,
      contrast: recommendations.adjustContrast,
      saturation: recommendations.adjustSaturation,
      sharpness: recommendations.adjustSharpness,
      reduceNoise: recommendations.reduceNoise,
      autoEnhance: true,
    };

    // Add crop suggestion if available
    if (recommendations.cropSuggestion) {
      options.crop = {
        originX: recommendations.cropSuggestion.x,
        originY: recommendations.cropSuggestion.y,
        width: recommendations.cropSuggestion.width,
        height: recommendations.cropSuggestion.height,
      };
    }

    return options;
  }

  async batchEnhance(
    imageUris: string[],
    analyses: DetailedAnalysis[]
  ): Promise<EditingResult[]> {
    if (imageUris.length !== analyses.length) {
      throw new Error('Image URIs and analyses arrays must have the same length');
    }

    const results = await Promise.allSettled(
      imageUris.map((uri, index) => this.enhanceImage(uri, analyses[index]))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<EditingResult> => 
        result.status === 'fulfilled')
      .map(result => result.value);
  }

  async createThumbnail(imageUri: string, size: number = 200): Promise<EditingResult> {
    try {
      const result = await manipulateAsync(
        imageUri,
        [{ resize: { width: size, height: size } }],
        {
          compress: 0.8,
          format: SaveFormat.JPEG,
        }
      );

      return result;
    } catch (error) {
      console.error('Thumbnail creation failed:', error);
      throw new Error('Failed to create thumbnail');
    }
  }

  async watermarkImage(
    imageUri: string,
    watermarkText: string = 'AI Enhanced'
  ): Promise<EditingResult> {
    // Note: expo-image-manipulator doesn't support text overlays
    // For production, you'd need react-native-image-filter-kit or similar
    // This is a placeholder implementation
    
    try {
      // For now, just return the original image
      // In production, add watermark using a more capable library
      const result = await manipulateAsync(
        imageUri,
        [],
        {
          compress: 0.9,
          format: SaveFormat.JPEG,
        }
      );

      return result;
    } catch (error) {
      console.error('Watermarking failed:', error);
      throw new Error('Failed to add watermark');
    }
  }

  async optimizeForWeb(imageUri: string): Promise<EditingResult> {
    try {
      const result = await manipulateAsync(
        imageUri,
        [{ resize: { width: 1200 } }], // Max width for web
        {
          compress: 0.85,
          format: SaveFormat.JPEG,
        }
      );

      return result;
    } catch (error) {
      console.error('Web optimization failed:', error);
      throw new Error('Failed to optimize for web');
    }
  }

  async optimizeForPrint(imageUri: string): Promise<EditingResult> {
    try {
      const result = await manipulateAsync(
        imageUri,
        [], // Keep original dimensions for print
        {
          compress: 0.95, // Higher quality for print
          format: SaveFormat.JPEG,
        }
      );

      return result;
    } catch (error) {
      console.error('Print optimization failed:', error);
      throw new Error('Failed to optimize for print');
    }
  }

  // Helper method to simulate advanced filters
  // In production, replace with actual filter implementations
  private async applyAdvancedFilters(
    imageUri: string,
    options: EditingOptions
  ): Promise<string> {
    // This is a mock implementation
    // For real advanced filters, use libraries like:
    // - react-native-image-filter-kit
    // - react-native-gl-image-filters
    // - Custom native modules

    let processedUri = imageUri;

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    return processedUri;
  }

  getEditingSummary(options: EditingOptions): string {
    const changes = [];

    if (options.brightness && Math.abs(options.brightness) > 5) {
      changes.push(options.brightness > 0 ? 'brightened' : 'darkened');
    }
    if (options.contrast && Math.abs(options.contrast) > 5) {
      changes.push('adjusted contrast');
    }
    if (options.saturation && Math.abs(options.saturation) > 5) {
      changes.push('enhanced colors');
    }
    if (options.sharpness && Math.abs(options.sharpness) > 5) {
      changes.push('sharpened');
    }
    if (options.reduceNoise) {
      changes.push('noise reduced');
    }
    if (options.crop) {
      changes.push('cropped');
    }
    if (options.resize) {
      changes.push('resized');
    }
    if (options.rotate) {
      changes.push('rotated');
    }
    if (options.flip) {
      changes.push('flipped');
    }

    if (changes.length === 0) {
      return 'No changes applied';
    }

    return `Applied: ${changes.join(', ')}`;
  }

  // Preset editing styles
  static readonly PRESETS = {
    NATURAL: {
      brightness: 5,
      contrast: 10,
      saturation: 5,
      sharpness: 10,
    },
    VIBRANT: {
      brightness: 10,
      contrast: 20,
      saturation: 25,
      sharpness: 15,
    },
    PORTRAIT: {
      brightness: 8,
      contrast: 12,
      saturation: -5, // Lower saturation for skin tones
      sharpness: 20,
    },
    LANDSCAPE: {
      brightness: 5,
      contrast: 25,
      saturation: 30,
      sharpness: 15,
    },
    BLACK_AND_WHITE: {
      brightness: 0,
      contrast: 30,
      saturation: -100, // Remove all color
      sharpness: 20,
    },
    VINTAGE: {
      brightness: -10,
      contrast: 15,
      saturation: -20,
      sharpness: 5,
    },
  } as const;

  async applyPreset(
    imageUri: string,
    preset: keyof typeof EditingEngine.PRESETS
  ): Promise<EditingResult> {
    const options = EditingEngine.PRESETS[preset];
    return await this.applyEdits(imageUri, options);
  }
}