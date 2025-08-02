/**
 * Smart Filter Recommender
 * 
 * Analyzes image content, tags, and technical quality to recommend
 * the best filters and effects for each specific image
 */

import { ImageAnalysisResult } from './geminiService';

export interface FilterRecommendation {
  id: string;
  name: string;
  description: string;
  suitabilityScore: number; // 0-100
  reason: string;
  category: 'aesthetic' | 'correction' | 'creative' | 'mood';
  icon: string;
  preview: string;
  rgbOptions: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    gamma?: number;
    redChannel?: number;
    greenChannel?: number;
    blueChannel?: number;
  };
}

export class SmartFilterRecommender {

  /**
   * Analyzes image and recommends best filters based on content, mood, and technical quality
   */
  static recommendFilters(analysis: ImageAnalysisResult): FilterRecommendation[] {
    console.log('🤖 Analyzing image for smart filter recommendations...');
    console.log('📊 Image analysis:', {
      type: analysis.imageType,
      mood: analysis.mood,
      subjects: analysis.detectedObjects,
      quality: analysis.technicalQuality?.overall,
      confidence: analysis.confidence
    });

    const recommendations: FilterRecommendation[] = [];

    // Get all available filters
    const allFilters = this.getAllFilters();

    // Score each filter based on image analysis
    allFilters.forEach(filter => {
      const score = this.calculateFilterSuitability(filter, analysis);
      if (score >= 40) { // Only recommend filters with decent suitability
        recommendations.push({
          ...filter,
          suitabilityScore: score,
          reason: this.generateRecommendationReason(filter, analysis, score)
        });
      }
    });

    // Sort by suitability score (highest first)
    recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    // Limit to top 8 recommendations
    const topRecommendations = recommendations.slice(0, 8);

    console.log('✨ Generated smart filter recommendations:');
    topRecommendations.forEach(rec => {
      console.log(`🎯 ${rec.name}: ${rec.suitabilityScore}% - ${rec.reason}`);
    });

    return topRecommendations;
  }

  /**
   * Calculate how suitable a filter is for the analyzed image
   */
  private static calculateFilterSuitability(filter: FilterRecommendation, analysis: ImageAnalysisResult): number {
    let score = 50; // Base score

    const subjects = analysis.detectedObjects || [];
    const imageType = analysis.imageType || 'unknown';
    const mood = analysis.mood || 'neutral';
    const quality = analysis.technicalQuality?.overall || 0.5;

    // Scoring based on image type
    if (imageType === 'portrait' || subjects.includes('person') || subjects.includes('face')) {
      if (filter.id.includes('portrait') || filter.id.includes('skin') || filter.id.includes('warm')) {
        score += 25;
      }
      if (filter.id.includes('dramatic') || filter.id.includes('baddie')) {
        score += 15;
      }
    }

    if (imageType === 'landscape' || subjects.includes('nature') || subjects.includes('sky')) {
      if (filter.id.includes('landscape') || filter.id.includes('nature') || filter.id.includes('vibrant')) {
        score += 25;
      }
      if (filter.id.includes('cottagecore') || filter.id.includes('natural')) {
        score += 20;
      }
    }

    if (subjects.includes('food')) {
      if (filter.id.includes('food') || filter.id.includes('warm') || filter.id.includes('vibrant')) {
        score += 30;
      }
    }

    if (subjects.includes('architecture') || subjects.includes('building')) {
      if (filter.id.includes('urban') || filter.id.includes('dramatic') || filter.id.includes('cyber')) {
        score += 20;
      }
    }

    // Scoring based on mood
    if (mood === 'warm' || mood === 'cozy') {
      if (filter.id.includes('warm') || filter.id.includes('soft') || filter.id.includes('cottagecore')) {
        score += 20;
      }
    }

    if (mood === 'cool' || mood === 'modern') {
      if (filter.id.includes('cool') || filter.id.includes('cyber') || filter.id.includes('crisp')) {
        score += 20;
      }
    }

    if (mood === 'dramatic' || mood === 'bold') {
      if (filter.id.includes('dramatic') || filter.id.includes('baddie') || filter.id.includes('high-contrast')) {
        score += 25;
      }
    }

    if (mood === 'vintage' || mood === 'nostalgic') {
      if (filter.id.includes('film') || filter.id.includes('vintage') || filter.id.includes('retro')) {
        score += 25;
      }
    }

    if (mood === 'soft' || mood === 'dreamy') {
      if (filter.id.includes('soft') || filter.id.includes('dreamy') || filter.id.includes('pastel')) {
        score += 20;
      }
    }

    // Scoring based on technical quality
    if (quality < 0.4) {
      // Low quality images benefit from enhancement filters
      if (filter.category === 'correction' || filter.id.includes('enhance') || filter.id.includes('sharp')) {
        score += 20;
      }
    }

    if (quality > 0.8) {
      // High quality images can handle creative filters
      if (filter.category === 'creative' || filter.category === 'aesthetic') {
        score += 15;
      }
    }

    // Penalty for potentially unsuitable filters
    if (imageType === 'portrait' && filter.id.includes('landscape')) {
      score -= 15;
    }

    if (subjects.includes('person') && filter.id.includes('harsh')) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate human-readable reason for recommendation
   */
  private static generateRecommendationReason(
    filter: FilterRecommendation, 
    analysis: ImageAnalysisResult, 
    score: number
  ): string {
    const subjects = analysis.detectedObjects || [];
    const imageType = analysis.imageType || 'unknown';
    const mood = analysis.mood || 'neutral';

    if (score >= 90) {
      return `Perfect match for ${imageType} with ${mood} mood`;
    }

    if (score >= 80) {
      if (subjects.includes('person')) {
        return `Excellent for portrait enhancement`;
      }
      if (subjects.includes('nature')) {
        return `Great for landscape photography`;
      }
      return `Highly suitable for this image style`;
    }

    if (score >= 70) {
      return `Good fit for ${imageType} images`;
    }

    if (score >= 60) {
      return `Suitable for ${mood} mood enhancement`;
    }

    if (score >= 50) {
      return `Works well with detected elements`;
    }

    return `Decent option for this image`;
  }

  /**
   * Get all available filters with their configurations
   */
  private static getAllFilters(): FilterRecommendation[] {
    return [
      // Portrait-focused filters
      {
        id: 'portrait-warm-glow',
        name: 'Portrait Warm Glow',
        description: 'Warm, flattering light for portraits',
        suitabilityScore: 0,
        reason: '',
        category: 'aesthetic',
        icon: '🌅',
        preview: 'Warm skin tones, soft highlights',
        rgbOptions: {
          brightness: 12,
          contrast: 8,
          saturation: 5,
          redChannel: 12,
          blueChannel: -8,
          gamma: 0.92
        }
      },
      {
        id: 'soft-girl-aesthetic',
        name: 'Soft Girl',
        description: 'Dreamy, ethereal, pastel vibes',
        suitabilityScore: 0,
        reason: '',
        category: 'aesthetic',
        icon: '🌸',
        preview: 'Soft, dreamy, pastel tones',
        rgbOptions: {
          brightness: 20,
          contrast: -10,
          saturation: -15,
          redChannel: 10,
          blueChannel: -8,
          gamma: 0.85
        }
      },
      {
        id: 'baddie-vibes',
        name: 'Baddie Vibes',
        description: 'Bold, confident, dramatic look',
        suitabilityScore: 0,
        reason: '',
        category: 'aesthetic',
        icon: '💋',
        preview: 'High contrast, bold colors',
        rgbOptions: {
          brightness: 5,
          contrast: 35,
          saturation: 25,
          redChannel: 20,
          greenChannel: -8,
          gamma: 1.1
        }
      },

      // Landscape-focused filters
      {
        id: 'landscape-vibrant',
        name: 'Vibrant Landscape',
        description: 'Rich, colorful nature enhancement',
        suitabilityScore: 0,
        reason: '',
        category: 'aesthetic',
        icon: '🏞️',
        preview: 'Enhanced blues and greens',
        rgbOptions: {
          brightness: 8,
          contrast: 20,
          saturation: 30,
          blueChannel: 15,
          greenChannel: 12,
          gamma: 0.95
        }
      },
      {
        id: 'cottagecore-natural',
        name: 'Cottagecore',
        description: 'Natural, earthy, cozy vibes',
        suitabilityScore: 0,
        reason: '',
        category: 'aesthetic',
        icon: '🌿',
        preview: 'Warm, earthy tones',
        rgbOptions: {
          brightness: 10,
          contrast: 12,
          saturation: 20,
          redChannel: 15,
          greenChannel: 20,
          blueChannel: -10,
          gamma: 0.88
        }
      },

      // Mood-based filters
      {
        id: 'film-aesthetic',
        name: 'Film Aesthetic',
        description: 'Vintage cinematic look',
        suitabilityScore: 0,
        reason: '',
        category: 'mood',
        icon: '📸',
        preview: 'Vintage film grain feel',
        rgbOptions: {
          brightness: -3,
          contrast: 18,
          saturation: -8,
          redChannel: 12,
          blueChannel: -15,
          gamma: 0.98
        }
      },
      {
        id: 'dark-academia',
        name: 'Dark Academia',
        description: 'Moody, intellectual atmosphere',
        suitabilityScore: 0,
        reason: '',
        category: 'mood',
        icon: '📚',
        preview: 'Dark, scholarly mood',
        rgbOptions: {
          brightness: -15,
          contrast: 28,
          saturation: -20,
          redChannel: 8,
          greenChannel: -5,
          gamma: 1.15
        }
      },
      {
        id: 'y2k-cyber',
        name: 'Y2K Cyber',
        description: 'Futuristic digital aesthetic',
        suitabilityScore: 0,
        reason: '',
        category: 'creative',
        icon: '💫',
        preview: 'Neon, digital vibes',
        rgbOptions: {
          brightness: 15,
          contrast: 30,
          saturation: 40,
          blueChannel: 20,
          greenChannel: 10,
          redChannel: -5,
          gamma: 0.9
        }
      },

      // Technical correction filters
      {
        id: 'natural-enhance',
        name: 'Natural Enhance',
        description: 'Subtle quality improvement',
        suitabilityScore: 0,
        reason: '',
        category: 'correction',
        icon: '✨',
        preview: 'Natural enhancement',
        rgbOptions: {
          brightness: 8,
          contrast: 12,
          saturation: 10,
          gamma: 0.95
        }
      },
      {
        id: 'sharp-crisp',
        name: 'Sharp & Crisp',
        description: 'Enhanced clarity and definition',
        suitabilityScore: 0,
        reason: '',
        category: 'correction',
        icon: '🔪',
        preview: 'Clear, sharp details',
        rgbOptions: {
          brightness: 5,
          contrast: 25,
          saturation: 8,
          gamma: 1.05
        }
      },

      // Creative filters
      {
        id: 'indie-kid',
        name: 'Indie Kid',
        description: 'Artistic, unique, colorful',
        suitabilityScore: 0,
        reason: '',
        category: 'creative',
        icon: '🎨',
        preview: 'Artistic color grading',
        rgbOptions: {
          brightness: 15,
          contrast: 20,
          saturation: 28,
          redChannel: 8,
          greenChannel: 12,
          blueChannel: 10,
          gamma: 0.92
        }
      },
      {
        id: 'food-appetizing',
        name: 'Appetizing Food',
        description: 'Makes food look delicious',
        suitabilityScore: 0,
        reason: '',
        category: 'aesthetic',
        icon: '🍽️',
        preview: 'Rich, appetizing colors',
        rgbOptions: {
          brightness: 10,
          contrast: 15,
          saturation: 35,
          redChannel: 15,
          greenChannel: 8,
          gamma: 0.9
        }
      },

      // Special effect filters
      {
        id: 'golden-hour',
        name: 'Golden Hour',
        description: 'Warm sunset lighting effect',
        suitabilityScore: 0,
        reason: '',
        category: 'mood',
        icon: '🌅',
        preview: 'Warm golden lighting',
        rgbOptions: {
          brightness: 15,
          contrast: 10,
          saturation: 12,
          redChannel: 20,
          greenChannel: 8,
          blueChannel: -12,
          gamma: 0.88
        }
      },
      {
        id: 'cool-tone',
        name: 'Cool Tone',
        description: 'Modern cool temperature',
        suitabilityScore: 0,
        reason: '',
        category: 'mood',
        icon: '❄️',
        preview: 'Cool, modern feel',
        rgbOptions: {
          brightness: 5,
          contrast: 18,
          saturation: 10,
          blueChannel: 15,
          redChannel: -8,
          gamma: 1.02
        }
      },

      // Vintage filters
      {
        id: 'retro-warm',
        name: 'Retro Warm',
        description: 'Nostalgic warm vintage look',
        suitabilityScore: 0,
        reason: '',
        category: 'mood',
        icon: '📼',
        preview: 'Retro warm tones',
        rgbOptions: {
          brightness: 8,
          contrast: 15,
          saturation: -5,
          redChannel: 18,
          greenChannel: 5,
          blueChannel: -15,
          gamma: 0.9
        }
      }
    ];
  }

  /**
   * Get filters by category
   */
  static getFiltersByCategory(category: string, analysis: ImageAnalysisResult): FilterRecommendation[] {
    const allRecommendations = this.recommendFilters(analysis);
    return allRecommendations.filter(filter => filter.category === category);
  }

  /**
   * Get top filters for specific subjects
   */
  static getFiltersForSubjects(subjects: string[], analysis: ImageAnalysisResult): FilterRecommendation[] {
    const allRecommendations = this.recommendFilters(analysis);
    
    // Filter based on subjects
    return allRecommendations.filter(filter => {
      if (subjects.includes('person') && filter.id.includes('portrait')) return true;
      if (subjects.includes('food') && filter.id.includes('food')) return true;
      if (subjects.includes('nature') && filter.id.includes('landscape')) return true;
      if (subjects.includes('architecture') && filter.id.includes('urban')) return true;
      return filter.suitabilityScore >= 70; // High scoring filters
    });
  }
}

export default SmartFilterRecommender;