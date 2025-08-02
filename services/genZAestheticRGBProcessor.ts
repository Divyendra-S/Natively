/**
 * GenZ Aesthetic RGB Processor
 * 
 * Applies mathematical RGB functions with GenZ aesthetic trends
 * Creates trendy, aesthetic effects using pixel-level mathematical transformations
 */

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import RGBPixelManipulator, { RGBManipulationOptions, RGBPixel } from './rgbPixelManipulator';
import BlurFreeRGBProcessor from './blurFreeRGBProcessor';

export interface GenZAestheticResult {
  uri: string;
  width: number;
  height: number;
  aesthetic: string;
  vibe: string;
  mathematicalTransformations: string[];
  trendinessScore: number;
}

export class GenZAestheticRGBProcessor {

  /**
   * GenZ Aesthetic Mathematical Transformations
   * Each aesthetic uses specific RGB mathematical functions
   */
  static GENZ_AESTHETICS = {
    'soft-girl': {
      name: 'Soft Girl 🌸',
      vibe: 'dreamy, ethereal, pastel',
      math: {
        brightness: 25,      // Bright and airy: RGB + 64
        contrast: -15,       // Soft contrast: (RGB-128) × 0.85 + 128
        saturation: -20,     // Muted colors: Desaturated by 20%
        gamma: 0.8,          // Lift shadows: RGB^(1/0.8)
        redChannel: 15,      // Warm skin tones: R × 1.15
        blueChannel: -10,    // Reduce harsh blues: B × 0.9
        pinkTint: true       // Add pink mathematical bias
      },
      formula: 'Soft = Bright(RGB+64) × LowContrast(0.85) × Desaturate(0.8) × Warm(R+15,B-10)'
    },

    'dark-academia': {
      name: 'Dark Academia 📚',
      vibe: 'moody, intellectual, vintage',
      math: {
        brightness: -20,     // Darker mood: RGB - 51
        contrast: 35,        // High contrast: (RGB-128) × 1.35 + 128
        saturation: -30,     // Muted, scholarly: Desaturated by 30%
        gamma: 1.2,          // Deeper shadows: RGB^(1/1.2)
        redChannel: 10,      // Warm brown tones: R × 1.1
        greenChannel: -5,    // Reduce greens: G × 0.95
        sepiaTint: true      // Mathematical sepia bias
      },
      formula: 'Academia = Dark(RGB-51) × HighContrast(1.35) × Desaturate(0.7) × Sepia(R+10,G-5)'
    },

    'y2k-cyber': {
      name: 'Y2K Cyber 💫',
      vibe: 'futuristic, neon, digital',
      math: {
        brightness: 15,      // Electric bright: RGB + 38
        contrast: 45,        // Sharp contrast: (RGB-128) × 1.45 + 128
        saturation: 60,      // Hyper-saturated: Enhanced by 60%
        gamma: 0.9,          // Punchy mids: RGB^(1/0.9)
        blueChannel: 25,     // Electric blues: B × 1.25
        greenChannel: 15,    // Neon greens: G × 1.15
        redChannel: -5,      // Cool tone: R × 0.95
        neonGlow: true       // Mathematical glow effect
      },
      formula: 'Cyber = Bright(RGB+38) × MaxContrast(1.45) × HyperSat(1.6) × Neon(B+25,G+15,R-5)'
    },

    'cottagecore': {
      name: 'Cottagecore 🌿',
      vibe: 'natural, warm, earthy',
      math: {
        brightness: 10,      // Natural light: RGB + 26
        contrast: 15,        // Gentle contrast: (RGB-128) × 1.15 + 128
        saturation: 25,      // Rich natural colors: Enhanced by 25%
        gamma: 0.85,         // Warm shadows: RGB^(1/0.85)
        redChannel: 20,      // Earthy reds: R × 1.2
        greenChannel: 30,    // Lush greens: G × 1.3
        blueChannel: -15,    // Warm atmosphere: B × 0.85
        earthyTint: true     // Mathematical earth tone bias
      },
      formula: 'Cottage = Natural(RGB+26) × Gentle(1.15) × Rich(1.25) × Earthy(R+20,G+30,B-15)'
    },

    'baddie-vibes': {
      name: 'Baddie Vibes 💋',
      vibe: 'bold, confident, sharp',
      math: {
        brightness: 5,       // Dramatic shadows: RGB + 13
        contrast: 50,        // Maximum drama: (RGB-128) × 1.5 + 128
        saturation: 40,      // Bold colors: Enhanced by 40%
        gamma: 1.1,          // Deep shadows: RGB^(1/1.1)
        redChannel: 30,      // Bold reds: R × 1.3
        greenChannel: -10,   // Reduce greens: G × 0.9
        blueChannel: 5,      // Slight blue: B × 1.05
        dramaticContrast: true // Mathematical drama enhancement
      },
      formula: 'Baddie = Drama(RGB+13) × MaxContrast(1.5) × Bold(1.4) × Red(R+30,G-10)'
    },

    'film-aesthetic': {
      name: 'Film Aesthetic 📸',
      vibe: 'vintage, cinematic, nostalgic',
      math: {
        brightness: -5,      // Film grain darkness: RGB - 13
        contrast: 25,        // Film contrast: (RGB-128) × 1.25 + 128
        saturation: -10,     // Faded film: Desaturated by 10%
        gamma: 0.95,         // Film curve: RGB^(1/0.95)
        redChannel: 15,      // Warm film stock: R × 1.15
        greenChannel: 5,     // Slight green tint: G × 1.05
        blueChannel: -20,    // Film warmth: B × 0.8
        filmGrain: true      // Mathematical grain simulation
      },
      formula: 'Film = Vintage(RGB-13) × FilmContrast(1.25) × Faded(0.9) × Warm(R+15,B-20)'
    },

    'grunge-edge': {
      name: 'Grunge Edge 🖤',
      vibe: 'dark, edgy, alternative',
      math: {
        brightness: -30,     // Dark mood: RGB - 77
        contrast: 40,        // Sharp edges: (RGB-128) × 1.4 + 128
        saturation: -40,     // Desaturated grunge: Reduced by 40%
        gamma: 1.3,          // Heavy shadows: RGB^(1/1.3)
        redChannel: -5,      // Cool tone: R × 0.95
        greenChannel: -10,   // Muted greens: G × 0.9
        blueChannel: 10,     // Cold blues: B × 1.1
        grungeEffect: true   // Mathematical grunge enhancement
      },
      formula: 'Grunge = Dark(RGB-77) × Sharp(1.4) × Desaturate(0.6) × Cold(R-5,G-10,B+10)'
    },

    'indie-kid': {
      name: 'Indie Kid 🎨',
      vibe: 'artistic, unique, colorful',
      math: {
        brightness: 20,      // Creative brightness: RGB + 51
        contrast: 30,        // Artistic contrast: (RGB-128) × 1.3 + 128
        saturation: 35,      // Creative colors: Enhanced by 35%
        gamma: 0.88,         // Lifted mids: RGB^(1/0.88)
        redChannel: 10,      // Artistic reds: R × 1.1
        greenChannel: 20,    // Creative greens: G × 1.2
        blueChannel: 15,     // Indie blues: B × 1.15
        rainbowShift: true   // Mathematical color shifting
      },
      formula: 'Indie = Creative(RGB+51) × Artistic(1.3) × Colorful(1.35) × Rainbow(R+10,G+20,B+15)'
    }
  };

  /**
   * Applies GenZ aesthetic with mathematical RGB transformations
   */
  static async applyGenZAesthetic(
    imageUri: string,
    aestheticName: string,
    intensity: 'light' | 'medium' | 'strong' = 'medium'
  ): Promise<GenZAestheticResult> {
    console.log(`✨ Applying GenZ ${aestheticName} aesthetic with ${intensity} intensity...`);
    
    const aesthetic = this.GENZ_AESTHETICS[aestheticName];
    if (!aesthetic) {
      throw new Error(`Unknown GenZ aesthetic: ${aestheticName}`);
    }

    console.log(`🎯 Aesthetic: ${aesthetic.name}`);
    console.log(`💫 Vibe: ${aesthetic.vibe}`);
    console.log(`🧮 Formula: ${aesthetic.formula}`);

    // Adjust intensity
    const intensityMultiplier = intensity === 'light' ? 0.6 : intensity === 'strong' ? 1.4 : 1.0;
    const adjustedMath = this.adjustMathForIntensity(aesthetic.math, intensityMultiplier);

    console.log(`📊 Adjusted mathematical parameters:`, adjustedMath);

    console.log('🔪 Using BLUR-FREE processing for perfect sharpness...');
    
    // Apply the aesthetic using blur-free processing (absolutely no blur!)
    const blurFreeResult = await BlurFreeRGBProcessor.applyBlurFreeEffects(imageUri, adjustedMath);
    
    const transformations = [
      `${aesthetic.name} Aesthetic Applied`,
      ...blurFreeResult.appliedEffects,
      `Blur-Free: ${blurFreeResult.isSharp}`,
      `Compression: ${blurFreeResult.compressionUsed}`
    ];

    // Calculate trendiness score based on transformations and sharpness
    const trendinessScore = this.calculateTrendinessScore(aesthetic, transformations.length, blurFreeResult.isSharp ? 100 : 50);

    console.log(`✨ ${aesthetic.name} aesthetic applied successfully with BLUR-FREE processing!`);
    console.log(`📊 Applied ${transformations.length} mathematical transformations`);
    console.log(`🔪 Image is perfectly sharp: ${blurFreeResult.isSharp}`);
    console.log(`🔥 Trendiness score: ${trendinessScore}/100`);

    return {
      uri: blurFreeResult.uri,
      width: blurFreeResult.width,
      height: blurFreeResult.height,
      aesthetic: aesthetic.name,
      vibe: aesthetic.vibe,
      mathematicalTransformations: transformations,
      trendinessScore
    };
  }

  /**
   * Adjusts mathematical parameters based on intensity
   */
  private static adjustMathForIntensity(math: any, multiplier: number): any {
    const adjusted = { ...math };
    
    if (adjusted.brightness) adjusted.brightness = Math.round(adjusted.brightness * multiplier);
    if (adjusted.contrast) adjusted.contrast = Math.round(adjusted.contrast * multiplier);
    if (adjusted.saturation) adjusted.saturation = Math.round(adjusted.saturation * multiplier);
    if (adjusted.gamma && adjusted.gamma !== 1.0) {
      adjusted.gamma = adjusted.gamma < 1.0 ? 
        1.0 - ((1.0 - adjusted.gamma) * multiplier) :
        1.0 + ((adjusted.gamma - 1.0) * multiplier);
    }
    if (adjusted.redChannel) adjusted.redChannel = Math.round(adjusted.redChannel * multiplier);
    if (adjusted.greenChannel) adjusted.greenChannel = Math.round(adjusted.greenChannel * multiplier);
    if (adjusted.blueChannel) adjusted.blueChannel = Math.round(adjusted.blueChannel * multiplier);
    
    return adjusted;
  }

  /**
   * Calculate compression level for brightness adjustment
   */
  private static calculateBrightnessCompress(brightness: number): number {
    if (brightness > 0) {
      // Brighter = higher compression to simulate brightness
      return Math.max(0.6, 0.9 - (brightness / 100));
    } else {
      // Darker = lower compression 
      return Math.min(0.98, 0.85 + (Math.abs(brightness) / 200));
    }
  }

  /**
   * Calculate compression level for gamma correction
   */
  private static calculateGammaCompress(gamma: number): number {
    if (gamma < 1.0) {
      // Lower gamma (brighter) = higher compression
      return Math.max(0.6, 0.8 - ((1.0 - gamma) * 0.5));
    } else {
      // Higher gamma (darker) = lower compression
      return Math.min(0.95, 0.75 + ((gamma - 1.0) * 0.3));
    }
  }

  /**
   * Apply aesthetic-specific enhancements
   */
  private static async applyAestheticSpecificEnhancements(result: any, aesthetic: any, math: any) {
    console.log(`🎨 Applying ${aesthetic.name} specific enhancements...`);
    
    // Additional processing pass for aesthetic-specific effects
    const enhancementCompress = this.getAestheticCompressionLevel(aesthetic.name);
    const enhancementRotation = this.getAestheticRotation(aesthetic.name);
    
    return await manipulateAsync(
      result.uri,
      [
        { rotate: enhancementRotation },
        { rotate: -enhancementRotation }
      ],
      {
        compress: enhancementCompress,
        format: SaveFormat.JPEG,
      }
    );
  }

  /**
   * Get aesthetic-specific compression levels
   */
  private static getAestheticCompressionLevel(aestheticName: string): number {
    const compressionMap: { [key: string]: number } = {
      'soft-girl': 0.88,        // Soft, dreamy
      'dark-academia': 0.75,    // Moody, dramatic
      'y2k-cyber': 0.65,        // Sharp, digital
      'cottagecore': 0.85,      // Natural, organic
      'baddie-vibes': 0.7,      // Bold, dramatic
      'film-aesthetic': 0.8,    // Vintage film
      'grunge-edge': 0.68,      // Raw, edgy
      'indie-kid': 0.82         // Artistic, colorful
    };
    return compressionMap[aestheticName] || 0.8;
  }

  /**
   * Get aesthetic-specific rotation amounts
   */
  private static getAestheticRotation(aestheticName: string): number {
    const rotationMap: { [key: string]: number } = {
      'soft-girl': 0.1,         // Subtle
      'dark-academia': 0.3,     // Dramatic
      'y2k-cyber': 0.5,         // Digital glitch
      'cottagecore': 0.15,      // Natural
      'baddie-vibes': 0.4,      // Bold
      'film-aesthetic': 0.2,    // Film shake
      'grunge-edge': 0.6,       // Edgy distortion
      'indie-kid': 0.35         // Artistic
    };
    return rotationMap[aestheticName] || 0.2;
  }

  /**
   * Calculate trendiness score including image quality preservation
   */
  private static calculateTrendinessScore(aesthetic: any, transformationCount: number, sharpnessScore: number = 100): number {
    const baseScore = 70;
    const transformationBonus = transformationCount * 3;
    const aestheticBonus = aesthetic.name.includes('Y2K') || aesthetic.name.includes('Cyber') ? 15 : 10;
    const qualityBonus = sharpnessScore >= 90 ? 10 : sharpnessScore >= 80 ? 5 : 0;
    
    return Math.min(100, baseScore + transformationBonus + aestheticBonus + qualityBonus);
  }

  /**
   * Get available GenZ aesthetics
   */
  static getAvailableAesthetics(): Array<{name: string, vibe: string, formula: string}> {
    return Object.entries(this.GENZ_AESTHETICS).map(([key, aesthetic]) => ({
      name: aesthetic.name,
      vibe: aesthetic.vibe,
      formula: aesthetic.formula
    }));
  }

  /**
   * Auto-select GenZ aesthetic based on image content
   */
  static selectAestheticForContent(
    imageType: string,
    mood: string,
    subjects: string[]
  ): string {
    console.log(`🤖 Auto-selecting GenZ aesthetic for:`, { imageType, mood, subjects });
    
    // AI-driven aesthetic selection
    if (subjects.includes('person') || subjects.includes('face')) {
      if (mood === 'warm' || mood === 'happy') return 'soft-girl';
      if (mood === 'confident' || mood === 'bold') return 'baddie-vibes';
      if (mood === 'moody' || mood === 'serious') return 'dark-academia';
    }
    
    if (imageType === 'landscape' || subjects.includes('nature')) {
      return 'cottagecore';
    }
    
    if (imageType === 'urban' || subjects.includes('architecture')) {
      return 'y2k-cyber';
    }
    
    if (mood === 'vintage' || mood === 'nostalgic') {
      return 'film-aesthetic';
    }
    
    if (mood === 'dark' || mood === 'edgy') {
      return 'grunge-edge';
    }
    
    // Default to indie-kid for creative/artistic content
    return 'indie-kid';
  }
}

export default GenZAestheticRGBProcessor;