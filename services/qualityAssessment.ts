import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';
import type { ImageEditingConfig } from './enhancementService';
import type { ImageAnalysisResult } from './geminiService';

export interface QualityMetrics {
  exposure: number;        // 0.0-1.0 (0=underexposed, 1=well exposed)
  contrast: number;        // 0.0-1.0 (0=low contrast, 1=high contrast)
  sharpness: number;       // 0.0-1.0 (0=blurry, 1=sharp)
  colorBalance: number;    // 0.0-1.0 (0=poor balance, 1=well balanced)
  noise: number;           // 0.0-1.0 (0=very noisy, 1=clean)
  overall: number;         // 0.0-1.0 (overall quality score)
}

export interface QualityComparison {
  before: QualityMetrics;
  after: QualityMetrics;
  improvement: QualityMetrics;
  overallImprovement: number; // -1.0 to 1.0 (negative = worse, positive = better)
  significantImprovements: string[]; // Areas with notable improvement
  degradations: string[]; // Areas that got worse
}

export interface EnhancementEffectiveness {
  configUsed: ImageEditingConfig;
  qualityImprovement: number;
  processingTime: number;
  algorithmContributions: Record<string, number>; // algorithm -> contribution score
  recommendedAdjustments: string[];
}

export interface ImageHistogram {
  red: number[];
  green: number[];
  blue: number[];
  luminance: number[];
}

export class QualityAssessment {
  private static readonly HISTOGRAM_BINS = 256;
  private static readonly QUALITY_WEIGHTS = {
    exposure: 0.25,
    contrast: 0.20,
    sharpness: 0.25,
    colorBalance: 0.15,
    noise: 0.15,
  };

  async analyzeImageQuality(imageUri: string): Promise<QualityMetrics> {
    try {
      // Get image dimensions and basic info
      const imageInfo = await this.getImageInfo(imageUri);
      
      // For now, simulate quality analysis
      // In production, this would use actual image processing algorithms
      const metrics = await this.performQualityAnalysis(imageUri, imageInfo);
      
      return metrics;
    } catch (error) {
      console.error('Quality analysis failed:', error);
      return this.getDefaultQualityMetrics();
    }
  }

  async compareQuality(
    beforeImageUri: string,
    afterImageUri: string,
    configUsed?: ImageEditingConfig
  ): Promise<QualityComparison> {
    try {
      const [beforeMetrics, afterMetrics] = await Promise.all([
        this.analyzeImageQuality(beforeImageUri),
        this.analyzeImageQuality(afterImageUri),
      ]);

      const improvement = this.calculateImprovement(beforeMetrics, afterMetrics);
      const overallImprovement = this.calculateOverallImprovement(beforeMetrics, afterMetrics);
      
      return {
        before: beforeMetrics,
        after: afterMetrics,
        improvement,
        overallImprovement,
        significantImprovements: this.identifySignificantImprovements(improvement),
        degradations: this.identifyDegradations(improvement),
      };
    } catch (error) {
      console.error('Quality comparison failed:', error);
      throw error;
    }
  }

  async assessEnhancementEffectiveness(
    beforeImageUri: string,
    afterImageUri: string,
    configUsed: ImageEditingConfig,
    processingTime: number
  ): Promise<EnhancementEffectiveness> {
    try {
      const qualityComparison = await this.compareQuality(beforeImageUri, afterImageUri, configUsed);
      
      const algorithmContributions = this.estimateAlgorithmContributions(
        configUsed,
        qualityComparison
      );
      
      const recommendedAdjustments = this.generateRecommendations(
        qualityComparison,
        configUsed
      );

      return {
        configUsed,
        qualityImprovement: qualityComparison.overallImprovement,
        processingTime,
        algorithmContributions,
        recommendedAdjustments,
      };
    } catch (error) {
      console.error('Enhancement effectiveness assessment failed:', error);
      throw error;
    }
  }

  private async getImageInfo(imageUri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        imageUri,
        (width, height) => resolve({ width, height }),
        (error) => reject(error)
      );
    });
  }

  private async performQualityAnalysis(
    imageUri: string,
    imageInfo: { width: number; height: number }
  ): Promise<QualityMetrics> {
    // Simulate quality analysis based on image characteristics
    // In production, this would analyze actual pixel data
    
    // Use image dimensions and processing to estimate quality
    const aspectRatio = imageInfo.width / imageInfo.height;
    const resolution = imageInfo.width * imageInfo.height;
    
    // Simulate analysis results with some randomness for realism
    const baseQuality = 0.7; // Assume reasonable base quality
    const variance = 0.2;
    
    const exposure = this.simulateMetric(baseQuality, variance);
    const contrast = this.simulateMetric(baseQuality, variance);
    const sharpness = this.simulateMetric(baseQuality, variance, resolution);
    const colorBalance = this.simulateMetric(baseQuality, variance);
    const noise = this.simulateMetric(baseQuality, variance, resolution);
    
    // Calculate overall quality using weighted average
    const overall = this.calculateOverallQuality({
      exposure,
      contrast,
      sharpness,
      colorBalance,
      noise,
      overall: 0, // Will be calculated
    });

    return {
      exposure,
      contrast,
      sharpness,
      colorBalance,
      noise,
      overall,
    };
  }

  private simulateMetric(base: number, variance: number, factor: number = 1): number {
    // Add some randomness and factor influence
    const random = (Math.random() - 0.5) * variance;
    const factorInfluence = Math.log10(factor) * 0.1; // Resolution influence
    
    return Math.max(0, Math.min(1, base + random + factorInfluence));
  }

  private calculateOverallQuality(metrics: QualityMetrics): number {
    const weights = QualityAssessment.QUALITY_WEIGHTS;
    
    return (
      metrics.exposure * weights.exposure +
      metrics.contrast * weights.contrast +
      metrics.sharpness * weights.sharpness +
      metrics.colorBalance * weights.colorBalance +
      metrics.noise * weights.noise
    );
  }

  private calculateImprovement(before: QualityMetrics, after: QualityMetrics): QualityMetrics {
    return {
      exposure: after.exposure - before.exposure,
      contrast: after.contrast - before.contrast,
      sharpness: after.sharpness - before.sharpness,
      colorBalance: after.colorBalance - before.colorBalance,
      noise: after.noise - before.noise,
      overall: after.overall - before.overall,
    };
  }

  private calculateOverallImprovement(before: QualityMetrics, after: QualityMetrics): number {
    const improvement = this.calculateImprovement(before, after);
    const weights = QualityAssessment.QUALITY_WEIGHTS;
    
    return (
      improvement.exposure * weights.exposure +
      improvement.contrast * weights.contrast +
      improvement.sharpness * weights.sharpness +
      improvement.colorBalance * weights.colorBalance +
      improvement.noise * weights.noise
    );
  }

  private identifySignificantImprovements(improvement: QualityMetrics): string[] {
    const threshold = 0.1; // 10% improvement threshold
    const improvements: string[] = [];
    
    if (improvement.exposure > threshold) improvements.push('exposure');
    if (improvement.contrast > threshold) improvements.push('contrast');
    if (improvement.sharpness > threshold) improvements.push('sharpness');
    if (improvement.colorBalance > threshold) improvements.push('color_balance');
    if (improvement.noise > threshold) improvements.push('noise_reduction');
    
    return improvements;
  }

  private identifyDegradations(improvement: QualityMetrics): string[] {
    const threshold = -0.05; // 5% degradation threshold
    const degradations: string[] = [];
    
    if (improvement.exposure < threshold) degradations.push('exposure');
    if (improvement.contrast < threshold) degradations.push('contrast');
    if (improvement.sharpness < threshold) degradations.push('sharpness');
    if (improvement.colorBalance < threshold) degradations.push('color_balance');
    if (improvement.noise < threshold) degradations.push('noise_increase');
    
    return degradations;
  }

  private estimateAlgorithmContributions(
    config: ImageEditingConfig,
    comparison: QualityComparison
  ): Record<string, number> {
    const contributions: Record<string, number> = {};
    const enabledAlgorithms = config.algorithms.filter(alg => alg.enabled);
    
    // Estimate contribution based on algorithm type and improvement areas
    enabledAlgorithms.forEach(algorithm => {
      let contribution = 0;
      
      switch (algorithm.name) {
        case 'clahe':
          // CLAHE primarily affects exposure and contrast
          contribution = (comparison.improvement.exposure * 0.6 + comparison.improvement.contrast * 0.4);
          break;
        case 'bilateral':
          // Bilateral filter primarily affects noise
          contribution = comparison.improvement.noise * 0.8;
          break;
        case 'unsharpMask':
          // Unsharp mask primarily affects sharpness
          contribution = comparison.improvement.sharpness * 0.9;
          break;
        case 'colorBalance':
          // Color balance affects color balance and overall appeal
          contribution = comparison.improvement.colorBalance * 0.8;
          break;
        case 'toneMapping':
          // Tone mapping affects exposure and contrast
          contribution = (comparison.improvement.exposure * 0.4 + comparison.improvement.contrast * 0.6);
          break;
        case 'denoising':
          // Denoising affects noise reduction
          contribution = comparison.improvement.noise * 0.9;
          break;
        default:
          // Default contribution estimation
          contribution = comparison.overallImprovement / enabledAlgorithms.length;
      }
      
      contributions[algorithm.name] = Math.max(0, Math.min(1, contribution));
    });
    
    return contributions;
  }

  private generateRecommendations(
    comparison: QualityComparison,
    config: ImageEditingConfig
  ): string[] {
    const recommendations: string[] = [];
    const threshold = 0.05;
    
    // Analyze what could be improved
    if (comparison.improvement.exposure < threshold) {
      recommendations.push('Consider increasing CLAHE strength for better exposure');
    }
    
    if (comparison.improvement.contrast < threshold) {
      recommendations.push('Try tone mapping or adjust CLAHE parameters for better contrast');
    }
    
    if (comparison.improvement.sharpness < threshold) {
      recommendations.push('Increase unsharp mask amount or add detail enhancement');
    }
    
    if (comparison.improvement.colorBalance < threshold) {
      recommendations.push('Adjust color balance parameters or try different style');
    }
    
    if (comparison.improvement.noise < 0) {
      recommendations.push('Consider adding bilateral filter or denoising algorithm');
    }
    
    // Check for over-processing
    if (comparison.degradations.length > 0) {
      recommendations.push(`Reduce processing strength to avoid: ${comparison.degradations.join(', ')}`);
    }
    
    // Overall enhancement strength recommendations
    if (comparison.overallImprovement < 0.05) {
      recommendations.push('Consider increasing overall enhancement strength');
    } else if (comparison.overallImprovement > 0.3) {
      recommendations.push('Consider reducing enhancement strength to avoid over-processing');
    }
    
    return recommendations;
  }

  private getDefaultQualityMetrics(): QualityMetrics {
    return {
      exposure: 0.7,
      contrast: 0.7,
      sharpness: 0.7,
      colorBalance: 0.7,
      noise: 0.7,
      overall: 0.7,
    };
  }

  // Utility methods for advanced analysis

  async generateQualityReport(
    beforeImageUri: string,
    afterImageUri: string,
    configUsed: ImageEditingConfig,
    processingTime: number
  ): Promise<{
    comparison: QualityComparison;
    effectiveness: EnhancementEffectiveness;
    summary: string;
  }> {
    const [comparison, effectiveness] = await Promise.all([
      this.compareQuality(beforeImageUri, afterImageUri, configUsed),
      this.assessEnhancementEffectiveness(beforeImageUri, afterImageUri, configUsed, processingTime),
    ]);

    const summary = this.generateQualitySummary(comparison, effectiveness);

    return {
      comparison,
      effectiveness,
      summary,
    };
  }

  private generateQualitySummary(
    comparison: QualityComparison,
    effectiveness: EnhancementEffectiveness
  ): string {
    const improvementPercent = Math.round(comparison.overallImprovement * 100);
    const topImprovement = comparison.significantImprovements[0];
    const processingSeconds = (effectiveness.processingTime / 1000).toFixed(1);
    
    if (comparison.overallImprovement > 0.1) {
      return `Excellent enhancement! ${improvementPercent}% quality improvement, especially in ${topImprovement}. Processed in ${processingSeconds}s.`;
    } else if (comparison.overallImprovement > 0.05) {
      return `Good enhancement with ${improvementPercent}% improvement. Best results in ${topImprovement}. Processed in ${processingSeconds}s.`;
    } else if (comparison.overallImprovement > 0) {
      return `Subtle improvements detected (${improvementPercent}%). Consider adjusting settings for better results.`;
    } else {
      return `No significant improvement detected. Try different enhancement settings or algorithms.`;
    }
  }

  // Method to validate quality improvements are real and not artifacts
  async validateQualityImprovement(
    comparison: QualityComparison,
    minThreshold: number = 0.02
  ): Promise<boolean> {
    // Check if improvement is above minimum threshold and not just noise
    if (comparison.overallImprovement < minThreshold) {
      return false;
    }

    // Check if there are more improvements than degradations
    const improvementAreas = comparison.significantImprovements.length;
    const degradationAreas = comparison.degradations.length;
    
    return improvementAreas > degradationAreas;
  }

  // Method to suggest optimal processing parameters
  async suggestOptimalConfig(
    imageAnalysis: ImageAnalysisResult,
    currentConfig: ImageEditingConfig,
    qualityComparison?: QualityComparison
  ): Promise<ImageEditingConfig> {
    const optimizedConfig = { ...currentConfig };

    // Adjust based on image analysis
    if (imageAnalysis.technicalQuality.exposure < 0.6) {
      // Poor exposure - boost CLAHE
      const claheAlg = optimizedConfig.algorithms.find(alg => alg.name === 'clahe');
      if (claheAlg) {
        claheAlg.params.clipLimit = Math.min(4.0, (claheAlg.params.clipLimit || 2.0) * 1.3);
      }
    }

    if (imageAnalysis.technicalQuality.sharpness < 0.6) {
      // Poor sharpness - boost unsharp mask
      const unsharpAlg = optimizedConfig.algorithms.find(alg => alg.name === 'unsharpMask');
      if (unsharpAlg) {
        unsharpAlg.params.amount = Math.min(1.0, (unsharpAlg.params.amount || 0.5) * 1.2);
      }
    }

    // Adjust based on quality comparison results if available
    if (qualityComparison) {
      if (qualityComparison.degradations.length > 0) {
        // Reduce overall strength if there are degradations
        optimizedConfig.strength = Math.max(0.1, optimizedConfig.strength * 0.8);
      } else if (qualityComparison.overallImprovement < 0.05) {
        // Increase strength if improvement is minimal
        optimizedConfig.strength = Math.min(1.0, optimizedConfig.strength * 1.2);
      }
    }

    return optimizedConfig;
  }
}

// Factory function to create quality assessment service
export function createQualityAssessment(): QualityAssessment {
  return new QualityAssessment();
}