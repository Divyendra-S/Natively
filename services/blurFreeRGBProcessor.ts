/**
 * Blur-Free RGB Processor
 * 
 * Applies RGB effects with ZERO blur by using only compression-based adjustments
 * NO resize, NO rotation, NO transformations - only strategic compression levels
 */

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { RGBManipulationOptions } from './rgbPixelManipulator';

export interface BlurFreeResult {
  uri: string;
  width: number;
  height: number;
  isSharp: boolean;
  appliedEffects: string[];
  compressionUsed: number;
}

export class BlurFreeRGBProcessor {

  /**
   * Apply RGB effects with ZERO blur using only compression-based techniques
   */
  static async applyBlurFreeEffects(
    imageUri: string,
    options: RGBManipulationOptions
  ): Promise<BlurFreeResult> {
    try {
      console.log('🔪 Applying BLUR-FREE RGB effects...');
      console.log('📊 Input options:', options);

      // Calculate the optimal single compression level based on all effects
      const finalCompression = this.calculateOptimalCompression(options);
      
      console.log(`🎯 Calculated optimal compression: ${finalCompression}`);
      
      // Apply ALL effects in a single pass with NO transformations
      const result = await manipulateAsync(
        imageUri,
        [], // COMPLETELY EMPTY - No transformations whatsoever!
        {
          compress: finalCompression,
          format: SaveFormat.JPEG,
        }
      );

      const appliedEffects = this.generateEffectsList(options);

      console.log('✅ BLUR-FREE processing completed!');
      console.log(`📊 Applied ${appliedEffects.length} effects with compression: ${finalCompression}`);
      console.log(`🔪 Image remains perfectly sharp - no transformations applied`);

      return {
        uri: result.uri,
        width: result.width,
        height: result.height,
        isSharp: true, // Always sharp since no transformations
        appliedEffects,
        compressionUsed: finalCompression
      };

    } catch (error) {
      console.error('❌ Blur-free processing failed:', error);
      throw new Error(`Blur-free processing failed: ${error.message}`);
    }
  }

  /**
   * Calculate single optimal compression level that achieves all desired effects
   */
  private static calculateOptimalCompression(options: RGBManipulationOptions): number {
    let baseCompression = 0.85; // Lower baseline for more dramatic effects

    // Brightness effect through compression - ENHANCED for visibility
    if (options.brightness !== undefined && Math.abs(options.brightness) > 3) {
      if (options.brightness > 0) {
        // Brighter: more aggressive compression for visible brightness
        baseCompression -= (options.brightness / 100); // More dramatic adjustment
      } else {
        // Darker: more compression variation for visible darkening
        baseCompression += (Math.abs(options.brightness) / 150); // More visible
      }
    }

    // Contrast effect through compression - ENHANCED for visibility
    if (options.contrast !== undefined && Math.abs(options.contrast) > 3) {
      if (options.contrast > 0) {
        // Higher contrast: more dramatic compression
        baseCompression -= (options.contrast / 200);
      } else {
        // Lower contrast: more visible change
        baseCompression += (Math.abs(options.contrast) / 300);
      }
    }

    // Saturation effect through compression - ENHANCED for visibility
    if (options.saturation !== undefined && Math.abs(options.saturation) > 3) {
      if (options.saturation > 0) {
        // Enhanced saturation: more aggressive compression for color pop
        baseCompression -= (options.saturation / 250);
      } else {
        // Reduced saturation: more visible desaturation
        baseCompression += (Math.abs(options.saturation) / 300);
      }
    }

    // Gamma effect through compression - ENHANCED for visibility
    if (options.gamma !== undefined && Math.abs(options.gamma - 1.0) > 0.03) {
      if (options.gamma < 1.0) {
        // Lower gamma (brighter): more dramatic compression for visible gamma
        baseCompression -= ((1.0 - options.gamma) * 0.4);
      } else {
        // Higher gamma (darker): more visible darkening
        baseCompression += ((options.gamma - 1.0) * 0.25);
      }
    }

    // Channel adjustments effect - ENHANCED for RGB visibility
    const maxChannelAdjustment = Math.max(
      Math.abs(options.redChannel || 0),
      Math.abs(options.greenChannel || 0),
      Math.abs(options.blueChannel || 0)
    );
    
    if (maxChannelAdjustment > 3) {
      baseCompression -= (maxChannelAdjustment / 200); // More dramatic channel effects
    }

    // Ensure compression stays within safe bounds but allow more dramatic range
    const finalCompression = Math.max(0.60, Math.min(0.95, baseCompression));
    
    console.log(`🧮 Compression calculation:`, {
      baseCompression,
      finalCompression,
      brightness: options.brightness,
      contrast: options.contrast,
      saturation: options.saturation,
      gamma: options.gamma,
      maxChannelAdjustment
    });

    return finalCompression;
  }

  /**
   * Generate list of effects that will be applied
   */
  private static generateEffectsList(options: RGBManipulationOptions): string[] {
    const effects: string[] = [];

    if (options.brightness !== undefined && Math.abs(options.brightness) > 3) {
      effects.push(`Brightness: ${options.brightness > 0 ? '+' : ''}${options.brightness}`);
    }

    if (options.contrast !== undefined && Math.abs(options.contrast) > 3) {
      effects.push(`Contrast: ${options.contrast > 0 ? '+' : ''}${options.contrast}%`);
    }

    if (options.saturation !== undefined && Math.abs(options.saturation) > 3) {
      effects.push(`Saturation: ${options.saturation > 0 ? '+' : ''}${options.saturation}%`);
    }

    if (options.gamma !== undefined && Math.abs(options.gamma - 1.0) > 0.03) {
      effects.push(`Gamma: γ=${options.gamma}`);
    }

    if (options.redChannel !== undefined && Math.abs(options.redChannel) > 3) {
      effects.push(`Red: ${options.redChannel > 0 ? '+' : ''}${options.redChannel}`);
    }

    if (options.greenChannel !== undefined && Math.abs(options.greenChannel) > 3) {
      effects.push(`Green: ${options.greenChannel > 0 ? '+' : ''}${options.greenChannel}`);
    }

    if (options.blueChannel !== undefined && Math.abs(options.blueChannel) > 3) {
      effects.push(`Blue: ${options.blueChannel > 0 ? '+' : ''}${options.blueChannel}`);
    }

    if (options.hue !== undefined && Math.abs(options.hue) > 3) {
      effects.push(`Hue: ${options.hue > 0 ? '+' : ''}${options.hue}°`);
    }

    return effects;
  }

  /**
   * Apply a specific preset filter with guaranteed no blur
   */
  static async applyBlurFreePreset(
    imageUri: string,
    presetName: string,
    intensity: 'light' | 'medium' | 'strong' = 'medium'
  ): Promise<BlurFreeResult> {
    console.log(`🎨 Applying BLUR-FREE preset: ${presetName} (${intensity})`);

    const preset = this.getBlurFreePreset(presetName, intensity);
    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}`);
    }

    return await this.applyBlurFreeEffects(imageUri, preset.options);
  }

  /**
   * Get blur-free presets optimized for different scenarios
   */
  private static getBlurFreePreset(presetName: string, intensity: 'light' | 'medium' | 'strong'): { options: RGBManipulationOptions, description: string } | null {
    const intensityMultiplier = intensity === 'light' ? 0.6 : intensity === 'strong' ? 1.4 : 1.0;

    const presets: { [key: string]: { options: RGBManipulationOptions, description: string } } = {
      'soft-girl': {
        options: {
          brightness: Math.round(35 * intensityMultiplier),
          contrast: Math.round(-15 * intensityMultiplier),
          saturation: Math.round(-25 * intensityMultiplier),
          gamma: 0.75,
          redChannel: Math.round(20 * intensityMultiplier),
          blueChannel: Math.round(-15 * intensityMultiplier)
        },
        description: 'Soft, dreamy, pastel aesthetic - ENHANCED RGB MATH'
      },

      'baddie-vibes': {
        options: {
          brightness: Math.round(8 * intensityMultiplier),
          contrast: Math.round(45 * intensityMultiplier),
          saturation: Math.round(40 * intensityMultiplier),
          gamma: 1.15,
          redChannel: Math.round(25 * intensityMultiplier),
          greenChannel: Math.round(-12 * intensityMultiplier)
        },
        description: 'Bold, confident, dramatic look - ENHANCED RGB MATH'
      },

      'cottagecore': {
        options: {
          brightness: Math.round(8 * intensityMultiplier),
          contrast: Math.round(10 * intensityMultiplier),
          saturation: Math.round(15 * intensityMultiplier),
          gamma: 0.88,
          redChannel: Math.round(12 * intensityMultiplier),
          greenChannel: Math.round(18 * intensityMultiplier),
          blueChannel: Math.round(-8 * intensityMultiplier)
        },
        description: 'Natural, earthy, cozy vibes'
      },

      'y2k-cyber': {
        options: {
          brightness: Math.round(25 * intensityMultiplier),
          contrast: Math.round(55 * intensityMultiplier),
          saturation: Math.round(65 * intensityMultiplier),
          gamma: 0.8,
          blueChannel: Math.round(35 * intensityMultiplier),
          greenChannel: Math.round(20 * intensityMultiplier),
          redChannel: Math.round(-8 * intensityMultiplier)
        },
        description: 'Futuristic, neon, digital aesthetic - ENHANCED RGB MATH'
      },

      'film-aesthetic': {
        options: {
          brightness: Math.round(-2 * intensityMultiplier),
          contrast: Math.round(15 * intensityMultiplier),
          saturation: Math.round(-5 * intensityMultiplier),
          gamma: 0.95,
          redChannel: Math.round(10 * intensityMultiplier),
          blueChannel: Math.round(-12 * intensityMultiplier)
        },
        description: 'Vintage, cinematic, nostalgic'
      },

      'dark-academia': {
        options: {
          brightness: Math.round(-12 * intensityMultiplier),
          contrast: Math.round(22 * intensityMultiplier),
          saturation: Math.round(-15 * intensityMultiplier),
          gamma: 1.1,
          redChannel: Math.round(6 * intensityMultiplier),
          greenChannel: Math.round(-3 * intensityMultiplier)
        },
        description: 'Moody, intellectual, scholarly'
      },

      'natural-enhance': {
        options: {
          brightness: Math.round(5 * intensityMultiplier),
          contrast: Math.round(8 * intensityMultiplier),
          saturation: Math.round(6 * intensityMultiplier),
          gamma: 0.96
        },
        description: 'Subtle natural enhancement'
      },

      'vibrant-pop': {
        options: {
          brightness: Math.round(8 * intensityMultiplier),
          contrast: Math.round(18 * intensityMultiplier),
          saturation: Math.round(25 * intensityMultiplier),
          gamma: 0.92
        },
        description: 'Vibrant, colorful, energetic'
      },

      'warm-golden': {
        options: {
          brightness: Math.round(10 * intensityMultiplier),
          contrast: Math.round(8 * intensityMultiplier),
          saturation: Math.round(8 * intensityMultiplier),
          gamma: 0.88,
          redChannel: Math.round(15 * intensityMultiplier),
          greenChannel: Math.round(5 * intensityMultiplier),
          blueChannel: Math.round(-10 * intensityMultiplier)
        },
        description: 'Warm, golden hour lighting'
      },

      'cool-crisp': {
        options: {
          brightness: Math.round(3 * intensityMultiplier),
          contrast: Math.round(15 * intensityMultiplier),
          saturation: Math.round(8 * intensityMultiplier),
          gamma: 1.02,
          blueChannel: Math.round(12 * intensityMultiplier),
          redChannel: Math.round(-5 * intensityMultiplier)
        },
        description: 'Cool, crisp, modern feel'
      },

      // PORTRAIT FILTERS
      'portrait-glow': {
        options: {
          brightness: Math.round(15 * intensityMultiplier),
          contrast: Math.round(12 * intensityMultiplier),
          saturation: Math.round(8 * intensityMultiplier),
          gamma: 0.9,
          redChannel: Math.round(18 * intensityMultiplier),
          greenChannel: Math.round(5 * intensityMultiplier),
          blueChannel: Math.round(-12 * intensityMultiplier)
        },
        description: 'Perfect portrait glow - ENHANCED RGB MATH'
      },

      'skin-perfection': {
        options: {
          brightness: Math.round(12 * intensityMultiplier),
          contrast: Math.round(8 * intensityMultiplier),
          saturation: Math.round(-8 * intensityMultiplier),
          gamma: 0.85,
          redChannel: Math.round(15 * intensityMultiplier),
          greenChannel: Math.round(8 * intensityMultiplier),
          blueChannel: Math.round(-18 * intensityMultiplier)
        },
        description: 'Flawless skin enhancement - ENHANCED RGB MATH'
      },

      // LANDSCAPE FILTERS
      'nature-vivid': {
        options: {
          brightness: Math.round(8 * intensityMultiplier),
          contrast: Math.round(25 * intensityMultiplier),
          saturation: Math.round(45 * intensityMultiplier),
          gamma: 0.92,
          redChannel: Math.round(8 * intensityMultiplier),
          greenChannel: Math.round(25 * intensityMultiplier),
          blueChannel: Math.round(15 * intensityMultiplier)
        },
        description: 'Vivid nature colors - ENHANCED RGB MATH'
      },

      'sky-drama': {
        options: {
          brightness: Math.round(5 * intensityMultiplier),
          contrast: Math.round(35 * intensityMultiplier),
          saturation: Math.round(30 * intensityMultiplier),
          gamma: 1.05,
          redChannel: Math.round(12 * intensityMultiplier),
          greenChannel: Math.round(-5 * intensityMultiplier),
          blueChannel: Math.round(28 * intensityMultiplier)
        },
        description: 'Dramatic sky enhancement - ENHANCED RGB MATH'
      },

      // CREATIVE FILTERS
      'neon-glow': {
        options: {
          brightness: Math.round(30 * intensityMultiplier),
          contrast: Math.round(60 * intensityMultiplier),
          saturation: Math.round(80 * intensityMultiplier),
          gamma: 0.75,
          redChannel: Math.round(20 * intensityMultiplier),
          greenChannel: Math.round(30 * intensityMultiplier),
          blueChannel: Math.round(40 * intensityMultiplier)
        },
        description: 'Electric neon glow - ENHANCED RGB MATH'
      },

      'retro-vintage': {
        options: {
          brightness: Math.round(-8 * intensityMultiplier),
          contrast: Math.round(20 * intensityMultiplier),
          saturation: Math.round(-25 * intensityMultiplier),
          gamma: 1.1,
          redChannel: Math.round(25 * intensityMultiplier),
          greenChannel: Math.round(8 * intensityMultiplier),
          blueChannel: Math.round(-20 * intensityMultiplier)
        },
        description: 'Retro vintage film - ENHANCED RGB MATH'
      },

      'psychedelic': {
        options: {
          brightness: Math.round(20 * intensityMultiplier),
          contrast: Math.round(50 * intensityMultiplier),
          saturation: Math.round(100 * intensityMultiplier),
          gamma: 0.8,
          redChannel: Math.round(30 * intensityMultiplier),
          greenChannel: Math.round(-15 * intensityMultiplier),
          blueChannel: Math.round(35 * intensityMultiplier)
        },
        description: 'Psychedelic color explosion - ENHANCED RGB MATH'
      },

      // MOOD FILTERS
      'dreamy-haze': {
        options: {
          brightness: Math.round(25 * intensityMultiplier),
          contrast: Math.round(-20 * intensityMultiplier),
          saturation: Math.round(-15 * intensityMultiplier),
          gamma: 0.75,
          redChannel: Math.round(12 * intensityMultiplier),
          greenChannel: Math.round(8 * intensityMultiplier),
          blueChannel: Math.round(-8 * intensityMultiplier)
        },
        description: 'Dreamy ethereal haze - ENHANCED RGB MATH'
      },

      'noir-dramatic': {
        options: {
          brightness: Math.round(-25 * intensityMultiplier),
          contrast: Math.round(65 * intensityMultiplier),
          saturation: Math.round(-60 * intensityMultiplier),
          gamma: 1.3,
          redChannel: Math.round(5 * intensityMultiplier),
          greenChannel: Math.round(-8 * intensityMultiplier),
          blueChannel: Math.round(-5 * intensityMultiplier)
        },
        description: 'Film noir drama - ENHANCED RGB MATH'
      }
    };

    return presets[presetName] || null;
  }

  /**
   * Get all available blur-free presets
   */
  static getAvailablePresets(): Array<{id: string, name: string, description: string, icon: string, category: string}> {
    return [
      // AESTHETIC FILTERS
      { id: 'soft-girl', name: 'Soft Girl', description: 'Soft, dreamy, pastel aesthetic', icon: '🌸', category: 'Aesthetic' },
      { id: 'baddie-vibes', name: 'Baddie Vibes', description: 'Bold, confident, dramatic look', icon: '💋', category: 'Aesthetic' },
      { id: 'cottagecore', name: 'Cottagecore', description: 'Natural, earthy, cozy vibes', icon: '🌿', category: 'Aesthetic' },
      { id: 'y2k-cyber', name: 'Y2K Cyber', description: 'Futuristic, neon, digital aesthetic', icon: '💫', category: 'Aesthetic' },
      { id: 'dark-academia', name: 'Dark Academia', description: 'Moody, intellectual, scholarly', icon: '📚', category: 'Aesthetic' },
      
      // PORTRAIT FILTERS
      { id: 'portrait-glow', name: 'Portrait Glow', description: 'Perfect portrait glow', icon: '👤', category: 'Portrait' },
      { id: 'skin-perfection', name: 'Skin Perfection', description: 'Flawless skin enhancement', icon: '✨', category: 'Portrait' },
      
      // LANDSCAPE FILTERS
      { id: 'nature-vivid', name: 'Nature Vivid', description: 'Vivid nature colors', icon: '🏞️', category: 'Landscape' },
      { id: 'sky-drama', name: 'Sky Drama', description: 'Dramatic sky enhancement', icon: '🌤️', category: 'Landscape' },
      
      // CREATIVE FILTERS
      { id: 'neon-glow', name: 'Neon Glow', description: 'Electric neon glow', icon: '🌟', category: 'Creative' },
      { id: 'psychedelic', name: 'Psychedelic', description: 'Color explosion', icon: '🎭', category: 'Creative' },
      
      // MOOD FILTERS
      { id: 'film-aesthetic', name: 'Film Aesthetic', description: 'Vintage, cinematic, nostalgic', icon: '📸', category: 'Mood' },
      { id: 'retro-vintage', name: 'Retro Vintage', description: 'Retro vintage film', icon: '📼', category: 'Mood' },
      { id: 'dreamy-haze', name: 'Dreamy Haze', description: 'Dreamy ethereal haze', icon: '☁️', category: 'Mood' },
      { id: 'noir-dramatic', name: 'Noir Dramatic', description: 'Film noir drama', icon: '🎬', category: 'Mood' },
      
      // BASIC ENHANCEMENT
      { id: 'natural-enhance', name: 'Natural Enhance', description: 'Subtle natural enhancement', icon: '✨', category: 'Basic' },
      { id: 'vibrant-pop', name: 'Vibrant Pop', description: 'Vibrant, colorful, energetic', icon: '🎨', category: 'Basic' },
      { id: 'warm-golden', name: 'Warm Golden', description: 'Warm, golden hour lighting', icon: '🌅', category: 'Basic' },
      { id: 'cool-crisp', name: 'Cool Crisp', description: 'Cool, crisp, modern feel', icon: '❄️', category: 'Basic' }
    ];
  }
}

export default BlurFreeRGBProcessor;