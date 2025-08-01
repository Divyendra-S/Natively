import { createGeminiService, ImageAnalysisResult } from './geminiService';

export interface AnalysisMetrics {
  sharpness: number;
  brightness: number;
  contrast: number;
  saturation: number;
  noise: number;
  composition: number;
}

export interface EnhancementRecommendations {
  adjustBrightness: number; // -100 to 100
  adjustContrast: number; // -100 to 100
  adjustSaturation: number; // -100 to 100
  adjustSharpness: number; // -100 to 100
  reduceNoise: boolean;
  cropSuggestion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DetailedAnalysis extends ImageAnalysisResult {
  metrics: AnalysisMetrics;
  recommendations: EnhancementRecommendations;
  processingTime: number;
}

export class AnalysisEngine {
  private geminiService = createGeminiService();

  async analyzeImage(base64Image: string): Promise<DetailedAnalysis> {
    const startTime = Date.now();

    try {
      // Get base analysis from Gemini
      const baseAnalysis = await this.geminiService.analyzeImage(base64Image);

      // Calculate detailed metrics
      const metrics = this.calculateMetrics(baseAnalysis);

      // Generate enhancement recommendations
      const recommendations = this.generateRecommendations(baseAnalysis, metrics);

      const processingTime = Date.now() - startTime;

      return {
        ...baseAnalysis,
        metrics,
        recommendations,
        processingTime,
      };

    } catch (error) {
      console.error('Analysis engine failed:', error);
      throw new Error('Failed to analyze image');
    }
  }

  private calculateMetrics(analysis: ImageAnalysisResult): AnalysisMetrics {
    // Convert Gemini analysis to detailed metrics
    // This is a simplified implementation - in production, you'd use image processing libraries
    
    const overall = analysis.technicalQuality.overall;
    const brightness = analysis.technicalQuality.exposure;
    const sharpness = analysis.technicalQuality.sharpness;

    return {
      sharpness: sharpness * 100,
      brightness: brightness * 100,
      contrast: this.estimateContrast(analysis),
      saturation: this.estimateSaturation(analysis),
      noise: this.estimateNoise(analysis),
      composition: overall * 100,
    };
  }

  private estimateContrast(analysis: ImageAnalysisResult): number {
    // Estimate contrast based on mood and lighting
    if (analysis.mood === 'dramatic' || analysis.mood === 'moody') {
      return 80;
    } else if (analysis.mood === 'bright' || analysis.mood === 'cheerful') {
      return 60;
    }
    return 70;
  }

  private estimateSaturation(analysis: ImageAnalysisResult): number {
    // Estimate saturation based on image type and mood
    if (analysis.imageType === 'portrait') {
      return 65; // Lower saturation for skin tones
    } else if (analysis.imageType === 'landscape') {
      return 80; // Higher for nature scenes
    }
    return 70;
  }

  private estimateNoise(analysis: ImageAnalysisResult): number {
    // Estimate noise based on overall quality
    const quality = analysis.technicalQuality.overall;
    return Math.max(0, (1 - quality) * 100);
  }

  private generateRecommendations(
    analysis: ImageAnalysisResult,
    metrics: AnalysisMetrics
  ): EnhancementRecommendations {
    const recommendations: EnhancementRecommendations = {
      adjustBrightness: 0,
      adjustContrast: 0,
      adjustSaturation: 0,
      adjustSharpness: 0,
      reduceNoise: false,
    };

    // Brightness adjustments
    if (metrics.brightness < 40) {
      recommendations.adjustBrightness = Math.min(30, 50 - metrics.brightness);
    } else if (metrics.brightness > 80) {
      recommendations.adjustBrightness = Math.max(-30, 70 - metrics.brightness);
    }

    // Contrast adjustments
    if (metrics.contrast < 50) {
      recommendations.adjustContrast = Math.min(25, 60 - metrics.contrast);
    }

    // Saturation adjustments
    if (analysis.imageType === 'landscape' && metrics.saturation < 70) {
      recommendations.adjustSaturation = Math.min(20, 75 - metrics.saturation);
    } else if (analysis.imageType === 'portrait' && metrics.saturation > 70) {
      recommendations.adjustSaturation = Math.max(-15, 65 - metrics.saturation);
    }

    // Sharpness adjustments
    if (metrics.sharpness < 60) {
      recommendations.adjustSharpness = Math.min(20, 70 - metrics.sharpness);
    }

    // Noise reduction
    if (metrics.noise > 30) {
      recommendations.reduceNoise = true;
    }

    // Intensity-based adjustments
    if (analysis.editingIntensity === 'light') {
      this.reduceIntensity(recommendations, 0.5);
    } else if (analysis.editingIntensity === 'heavy') {
      this.increaseIntensity(recommendations, 1.3);
    }

    return recommendations;
  }

  private reduceIntensity(recommendations: EnhancementRecommendations, factor: number): void {
    recommendations.adjustBrightness *= factor;
    recommendations.adjustContrast *= factor;
    recommendations.adjustSaturation *= factor;
    recommendations.adjustSharpness *= factor;
  }

  private increaseIntensity(recommendations: EnhancementRecommendations, factor: number): void {
    recommendations.adjustBrightness = Math.sign(recommendations.adjustBrightness) * 
      Math.min(Math.abs(recommendations.adjustBrightness * factor), 50);
    recommendations.adjustContrast = Math.sign(recommendations.adjustContrast) * 
      Math.min(Math.abs(recommendations.adjustContrast * factor), 40);
    recommendations.adjustSaturation = Math.sign(recommendations.adjustSaturation) * 
      Math.min(Math.abs(recommendations.adjustSaturation * factor), 30);
    recommendations.adjustSharpness = Math.sign(recommendations.adjustSharpness) * 
      Math.min(Math.abs(recommendations.adjustSharpness * factor), 30);
  }

  async batchAnalyze(base64Images: string[]): Promise<DetailedAnalysis[]> {
    const analyses = await Promise.allSettled(
      base64Images.map(image => this.analyzeImage(image))
    );

    return analyses
      .filter((result): result is PromiseFulfilledResult<DetailedAnalysis> => 
        result.status === 'fulfilled')
      .map(result => result.value);
  }

  getAnalysisSummary(analysis: DetailedAnalysis): string {
    const { metrics, recommendations } = analysis;
    const improvements = [];

    if (Math.abs(recommendations.adjustBrightness) > 5) {
      improvements.push(recommendations.adjustBrightness > 0 ? 'brightened' : 'darkened');
    }
    if (Math.abs(recommendations.adjustContrast) > 5) {
      improvements.push('enhanced contrast');
    }
    if (Math.abs(recommendations.adjustSaturation) > 5) {
      improvements.push('adjusted colors');
    }
    if (Math.abs(recommendations.adjustSharpness) > 5) {
      improvements.push('sharpened details');
    }
    if (recommendations.reduceNoise) {
      improvements.push('reduced noise');
    }

    if (improvements.length === 0) {
      return 'Image is already well-optimized';
    }

    return `Enhanced: ${improvements.join(', ')}`;
  }
}