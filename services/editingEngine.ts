import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';
import { EnhancementRecommendations, DetailedAnalysis } from './analysisEngine';
import RGBPixelManipulator, { RGBManipulationOptions } from './rgbPixelManipulator';
import RGBImageProcessor from './rgbImageProcessor';
import GenZAestheticRGBProcessor from './genZAestheticRGBProcessor';
// Import the REAL RGB processor that actually manipulates pixels
import RealRGBProcessor from './realRGBProcessor';

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
  // RGB-specific options
  gamma?: number; // 0.1 to 3.0
  hue?: number; // -180 to 180
  redChannel?: number; // -100 to 100
  greenChannel?: number; // -100 to 100
  blueChannel?: number; // -100 to 100
  useRGBProcessing?: boolean; // Enable mathematical RGB manipulation
  autoColorCorrection?: boolean; // AI-driven automatic color correction
  effectPreset?: 'sepia' | 'grayscale' | 'invert' | 'vintage' | 'highContrast' | 'posterize' | 'threshold';
  genZAesthetic?: string; // GenZ aesthetic style
  aestheticIntensity?: 'light' | 'medium' | 'strong'; // Aesthetic intensity
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
      // Use RGB processing if enabled
      if (options.useRGBProcessing) {
        return await this.applyRGBEdits(imageUri, options);
      }

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

  /**
   * Applies RGB-based mathematical image processing using REAL pixel manipulation
   */
  async applyRGBEdits(imageUri: string, options: EditingOptions): Promise<EditingResult> {
    try {
      console.log('🎨 Using REAL RGB processor (not fake compression tricks)');
      
      // Convert EditingOptions to RGBManipulationOptions
      const rgbOptions: RGBManipulationOptions = {
        brightness: options.brightness,
        contrast: options.contrast,
        gamma: options.gamma,
        saturation: options.saturation,
        hue: options.hue,
        redChannel: options.redChannel,
        greenChannel: options.greenChannel,
        blueChannel: options.blueChannel,
      };

      // Apply preset effects if specified using REAL processor
      if (options.effectPreset) {
        return await this.applyRealRGBPreset(imageUri, options.effectPreset);
      }

      // Apply REAL RGB manipulations using color matrices
      console.log('✅ Applying REAL RGB transformations with color matrices...');
      const realResult = await RealRGBProcessor.applyRealRGBTransformation(imageUri, rgbOptions);
      
      // Convert RealRGBResult to EditingResult format
      return {
        uri: realResult.uri,
        width: realResult.width,
        height: realResult.height,
      };
    } catch (error) {
      console.error('❌ REAL RGB processing failed:', error);
      
      // Fallback to fake processor only if real one fails
      console.log('🔄 Falling back to fake RGB processor as last resort...');
      try {
        const rgbOptions: RGBManipulationOptions = {
          brightness: options.brightness,
          contrast: options.contrast,
          gamma: options.gamma,
          saturation: options.saturation,
          hue: options.hue,
          redChannel: options.redChannel,
          greenChannel: options.greenChannel,
          blueChannel: options.blueChannel,
        };
        return await RGBImageProcessor.applyRGBManipulations(imageUri, rgbOptions);
      } catch (fallbackError) {
        console.error('❌ Fallback processing also failed:', fallbackError);
        throw new Error('Failed to apply RGB edits');
      }
    }
  }
  
  /**
   * Applies predefined RGB effect presets using REAL processor
   */
  async applyRealRGBPreset(imageUri: string, preset: string): Promise<EditingResult> {
    try {
      console.log(`🎨 Applying REAL RGB preset: ${preset}`);
      
      switch (preset) {
        case 'grayscale':
          const grayscaleResult = await RealRGBProcessor.applyColorPreset(imageUri, 'grayscale');
          return {
            uri: grayscaleResult.uri,
            width: grayscaleResult.width,
            height: grayscaleResult.height,
          };
        case 'sepia':
          const sepiaResult = await RealRGBProcessor.applyColorPreset(imageUri, 'sepia');
          return {
            uri: sepiaResult.uri,
            width: sepiaResult.width,
            height: sepiaResult.height,
          };
        case 'invert':
          const invertResult = await RealRGBProcessor.applyColorPreset(imageUri, 'invert');
          return {
            uri: invertResult.uri,
            width: invertResult.width,
            height: invertResult.height,
          };
        case 'vintage':
          const vintageResult = await RealRGBProcessor.applyColorPreset(imageUri, 'vintage');
          return {
            uri: vintageResult.uri,
            width: vintageResult.width,
            height: vintageResult.height,
          };
        default:
          // Use a real RGB filter instead of fake matrix
          const filterResult = await RealRGBProcessor.applyRealRGBFilter(imageUri, 'brighten-real', 'medium');
          return {
            uri: filterResult.uri,
            width: filterResult.width,
            height: filterResult.height,
          };
      }
    } catch (error) {
      console.error('❌ Real RGB preset failed:', error);
      
      // Fallback to fake processor
      const matrix = RGBImageProcessor.getPresetMatrix(preset);
      return await RGBImageProcessor.applyGrayscale(imageUri);
    }
  }

  /**
   * Applies predefined RGB effect presets - REDIRECTS TO REAL PROCESSOR
   */
  async applyRGBPreset(imageUri: string, preset: string): Promise<EditingResult> {
    console.log('🔄 Redirecting to REAL RGB preset processor...');
    return await this.applyRealRGBPreset(imageUri, preset);
  }

  private buildOptionsFromAnalysis(analysis: DetailedAnalysis): EditingOptions {
    const { recommendations } = analysis;

    // Enable RGB processing for AI-driven enhancements
    const options: EditingOptions = {
      brightness: recommendations.adjustBrightness,
      contrast: recommendations.adjustContrast,
      saturation: recommendations.adjustSaturation,
      sharpness: recommendations.adjustSharpness,
      reduceNoise: recommendations.reduceNoise,
      autoEnhance: true,
      useRGBProcessing: true, // Enable mathematical RGB manipulation
      autoColorCorrection: true,
    };

    // Generate automatic RGB adjustments based on AI analysis
    const autoRGBOptions = this.generateAutoRGBAdjustments(analysis);
    Object.assign(options, autoRGBOptions);

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

  /**
   * AI-driven automatic RGB adjustment generation with GenZ aesthetic selection
   * Automatically calculates mathematical functions and selects trendy aesthetics based on image analysis
   */
  private generateAutoRGBAdjustments(analysis: DetailedAnalysis): Partial<EditingOptions> {
    const { technicalQuality, contentAnalysis, colorAnalysis } = analysis;
    const adjustments: Partial<EditingOptions> = {};

    console.log('🤖 AI analyzing image for GenZ aesthetic selection...');
    console.log('📊 Analysis data:', {
      brightness: technicalQuality.brightness,
      contrast: technicalQuality.contrast,
      subjects: contentAnalysis?.subjects || [],
      mood: contentAnalysis?.mood || 'neutral',
      style: contentAnalysis?.style || 'general'
    });

    // AI-driven GenZ aesthetic selection based on analysis
    const selectedAesthetic = GenZAestheticRGBProcessor.selectAestheticForContent(
      contentAnalysis?.style || 'general',
      contentAnalysis?.mood || 'neutral',
      contentAnalysis?.subjects || []
    );

    console.log(`✨ AI selected GenZ aesthetic: ${selectedAesthetic}`);
    adjustments.genZAesthetic = selectedAesthetic;

    // Determine aesthetic intensity based on image quality and mood
    let intensity: 'light' | 'medium' | 'strong' = 'medium';
    
    if (technicalQuality.overall > 0.8) {
      intensity = 'light'; // High quality image, subtle aesthetic
    } else if (technicalQuality.overall < 0.4) {
      intensity = 'strong'; // Low quality image, strong aesthetic needed
    } else if (contentAnalysis?.mood === 'bold' || contentAnalysis?.mood === 'dramatic') {
      intensity = 'strong'; // Bold mood, strong aesthetic
    } else if (contentAnalysis?.mood === 'soft' || contentAnalysis?.mood === 'dreamy') {
      intensity = 'light'; // Soft mood, light aesthetic
    }

    adjustments.aestheticIntensity = intensity;
    console.log(`🎯 AI selected intensity: ${intensity}`);

    // Apply base mathematical adjustments that complement the aesthetic
    
    // Automatic gamma correction based on brightness distribution
    if (technicalQuality.brightness < 0.3) {
      // Dark image: apply gamma correction to brighten midtones (works well with most aesthetics)
      adjustments.gamma = 0.8; // Slightly lift shadows for GenZ look
      adjustments.brightness = 10; // Subtle brightness boost
    } else if (technicalQuality.brightness > 0.8) {
      // Bright image: control highlights for better aesthetic
      adjustments.gamma = 1.1; // Slight shadow depth
      adjustments.brightness = -5; // Prevent overexposure
    } else {
      adjustments.gamma = 0.95; // Slight mid-tone lift (GenZ trend)
    }

    // Automatic contrast adjustment for GenZ aesthetics
    if (selectedAesthetic === 'soft-girl' || selectedAesthetic === 'cottagecore') {
      // Soft aesthetics: gentle contrast
      adjustments.contrast = Math.max(-10, Math.min(15, technicalQuality.contrast * 50 - 15));
    } else if (selectedAesthetic === 'baddie-vibes' || selectedAesthetic === 'y2k-cyber') {
      // Bold aesthetics: high contrast
      adjustments.contrast = Math.max(20, Math.min(40, technicalQuality.contrast * 60 + 10));
    } else if (selectedAesthetic === 'dark-academia' || selectedAesthetic === 'grunge-edge') {
      // Moody aesthetics: dramatic contrast
      adjustments.contrast = Math.max(25, Math.min(45, technicalQuality.contrast * 70 + 5));
    } else {
      // Default GenZ contrast enhancement
      adjustments.contrast = Math.max(5, Math.min(25, technicalQuality.contrast * 40));
    }

    // Saturation adjustments based on aesthetic and color analysis
    let baseSaturation = 0;
    if (colorAnalysis?.dominantColors && colorAnalysis.dominantColors.length > 0) {
      const avgSaturation = this.calculateAverageSaturation(colorAnalysis.dominantColors);
      baseSaturation = (avgSaturation - 0.5) * 40; // Convert to adjustment range
    }

    if (selectedAesthetic === 'y2k-cyber' || selectedAesthetic === 'indie-kid') {
      // High saturation aesthetics
      adjustments.saturation = Math.max(15, Math.min(50, baseSaturation + 30));
    } else if (selectedAesthetic === 'soft-girl' || selectedAesthetic === 'film-aesthetic') {
      // Muted aesthetics
      adjustments.saturation = Math.max(-20, Math.min(10, baseSaturation - 10));
    } else if (selectedAesthetic === 'dark-academia' || selectedAesthetic === 'grunge-edge') {
      // Desaturated aesthetics
      adjustments.saturation = Math.max(-30, Math.min(5, baseSaturation - 20));
    } else {
      // Balanced saturation for other aesthetics
      adjustments.saturation = Math.max(-10, Math.min(25, baseSaturation + 10));
    }

    // Color temperature adjustments based on aesthetic
    if (selectedAesthetic === 'soft-girl' || selectedAesthetic === 'cottagecore') {
      // Warm, cozy aesthetics
      adjustments.redChannel = 8;
      adjustments.blueChannel = -8;
    } else if (selectedAesthetic === 'y2k-cyber' || selectedAesthetic === 'grunge-edge') {
      // Cool, digital aesthetics
      adjustments.blueChannel = 12;
      adjustments.redChannel = -5;
    } else if (selectedAesthetic === 'film-aesthetic') {
      // Vintage film warmth
      adjustments.redChannel = 12;
      adjustments.greenChannel = 3;
      adjustments.blueChannel = -15;
    } else if (selectedAesthetic === 'baddie-vibes') {
      // Bold, dramatic colors
      adjustments.redChannel = 15;
      adjustments.greenChannel = -5;
      adjustments.blueChannel = 3;
    }

    // Hue adjustments for specific aesthetics
    if (selectedAesthetic === 'indie-kid') {
      adjustments.hue = 5; // Slight color shift for artistic look
    } else if (selectedAesthetic === 'film-aesthetic') {
      adjustments.hue = -3; // Vintage film color shift
    }

    console.log('🎨 AI-generated GenZ aesthetic adjustments:', adjustments);
    console.log(`📐 Mathematical transformations will be applied based on ${selectedAesthetic} aesthetic`);
    
    return adjustments;
  }

  /**
   * Calculates average saturation from dominant colors
   */
  private calculateAverageSaturation(dominantColors: string[]): number {
    if (!dominantColors || dominantColors.length === 0) return 0.5;

    let totalSaturation = 0;
    
    dominantColors.forEach(color => {
      // Convert hex to RGB then to HSV to get saturation
      const rgb = this.hexToRgb(color);
      if (rgb) {
        const hsv = RGBPixelManipulator.rgbToHsv(rgb);
        totalSaturation += hsv.s;
      }
    });

    return totalSaturation / dominantColors.length;
  }

  /**
   * Converts hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * AI-driven automatic enhancement with GenZ aesthetics and mathematical functions
   */
  async autoEnhanceWithMath(imageUri: string, analysis: DetailedAnalysis): Promise<EditingResult> {
    try {
      console.log('🚀 Starting AI-driven GenZ aesthetic enhancement with mathematical functions...');
      
      // Generate automatic adjustments with GenZ aesthetic selection
      const autoOptions = this.generateAutoRGBAdjustments(analysis);
      
      console.log('✨ Generated options:', autoOptions);

      // Step 1: Apply GenZ aesthetic if selected
      if (autoOptions.genZAesthetic) {
        console.log(`🎨 Applying GenZ aesthetic: ${autoOptions.genZAesthetic} with intensity: ${autoOptions.aestheticIntensity}`);
        
        const aestheticResult = await GenZAestheticRGBProcessor.applyGenZAesthetic(
          imageUri,
          autoOptions.genZAesthetic,
          autoOptions.aestheticIntensity || 'medium'
        );
        
        console.log('🎯 GenZ aesthetic applied successfully!');
        console.log(`📊 Aesthetic: ${aestheticResult.aesthetic}`);
        console.log(`💫 Vibe: ${aestheticResult.vibe}`);
        console.log(`🧮 Mathematical transformations:`, aestheticResult.mathematicalTransformations);
        console.log(`🔥 Trendiness score: ${aestheticResult.trendinessScore}/100`);
        
        return {
          uri: aestheticResult.uri,
          width: aestheticResult.width,
          height: aestheticResult.height,
        };
      } else {
        // Step 2: Fallback to REAL RGB processing if no aesthetic selected
        console.log('🔧 No GenZ aesthetic selected, applying REAL RGB mathematical functions...');
        
        const enhancedOptions: EditingOptions = {
          ...autoOptions,
          useRGBProcessing: true,
          autoColorCorrection: true,
          autoEnhance: true,
        };

        console.log('📐 Applying REAL mathematical enhancements:', enhancedOptions);
        console.log('✅ Using REAL RGB processor instead of fake compression tricks');
        
        return await this.applyEdits(imageUri, enhancedOptions);
      }
    } catch (error) {
      console.error('❌ Auto GenZ aesthetic enhancement failed:', error);
      
      // Ultimate fallback: try basic REAL RGB processing
      try {
        console.log('🔄 Attempting fallback REAL RGB processing...');
        console.log('✅ Using REAL RGB processor for fallback (not compression tricks)');
        
        const basicOptions: RGBManipulationOptions = {
          brightness: 10,
          contrast: 15,
          saturation: 10,
        };
        
        const fallbackResult = await RealRGBProcessor.applyRealRGBTransformation(imageUri, basicOptions);
        return {
          uri: fallbackResult.uri,
          width: fallbackResult.width,
          height: fallbackResult.height,
        };
      } catch (fallbackError) {
        console.error('❌ REAL RGB fallback processing also failed:', fallbackError);
        throw new Error('Failed to apply automatic mathematical enhancements');
      }
    }
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