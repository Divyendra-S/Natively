import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database/types';
import type { ImageAnalysisResult } from './geminiService';
import type { ImageEditingConfig, UserEditingProfile, EditingStyle, EditingPriority } from './enhancementService';

export interface UserFeedback {
  editingSessionId: string;
  userId: string;
  feedbackType: 'like' | 'dislike' | 'adjustment_request';
  rating?: number; // 1-5 stars
  specificFeedback?: {
    tooStrong?: boolean;
    tooWeak?: boolean;
    wrongStyle?: boolean;
    improvedAspects?: string[];
    issueAspects?: string[];
  };
}

export interface LearningData {
  userId: string;
  imageType: string;
  originalConfig: ImageEditingConfig;
  userRating: number;
  processingTime: number;
  qualityImprovement: number;
  feedback?: UserFeedback;
}

export interface PersonalizationInsights {
  preferredAlgorithms: Record<string, number>; // algorithm -> preference score
  stylePreferences: Record<EditingStyle, number>;
  strengthPreferences: Record<string, number>; // imageType -> preferred strength
  priorityPreferences: Record<EditingPriority, number>;
  algorithmEffectiveness: Record<string, number>; // algorithm -> effectiveness score
}

export class PersonalizationEngine {
  private supabase: SupabaseClient<Database>;
  private userProfiles = new Map<string, UserEditingProfile>();
  private learningData = new Map<string, LearningData[]>();

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async analyzeUserHistory(userId: string): Promise<UserEditingProfile> {
    try {
      // Check cache first
      if (this.userProfiles.has(userId)) {
        return this.userProfiles.get(userId)!;
      }

      // Fetch user's editing history from database
      const { data: editingSessions, error } = await this.supabase
        .from('image_editing_sessions')
        .select(`
          *,
          editing_feedback (
            feedback_type,
            specific_feedback
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50); // Last 50 sessions for analysis

      if (error) throw error;

      const profile = this.generateUserProfile(editingSessions || []);
      
      // Cache the profile
      this.userProfiles.set(userId, profile);
      
      return profile;
    } catch (error) {
      console.error('Failed to analyze user history:', error);
      return this.getDefaultUserProfile();
    }
  }

  private generateUserProfile(sessions: any[]): UserEditingProfile {
    if (sessions.length === 0) {
      return this.getDefaultUserProfile();
    }

    const algorithmUsage = new Map<string, number>();
    const styleUsage = new Map<EditingStyle, number>();
    const strengthSum = { total: 0, count: 0 };
    const imageTypePreferences = new Map<string, any>();
    const favoriteLooks: string[] = [];

    // Analyze patterns from sessions
    sessions.forEach(session => {
      const config = session.config_used;
      const rating = session.user_rating || 3;
      
      // Weight by user satisfaction (higher rating = more influence)
      const weight = rating / 5;

      // Track algorithm preferences
      if (config.algorithms) {
        config.algorithms.forEach((alg: any) => {
          if (alg.enabled) {
            const current = algorithmUsage.get(alg.name) || 0;
            algorithmUsage.set(alg.name, current + weight);
          }
        });
      }

      // Track style preferences
      if (config.style) {
        const current = styleUsage.get(config.style) || 0;
        styleUsage.set(config.style, current + weight);
      }

      // Track strength preferences
      if (config.strength) {
        strengthSum.total += config.strength * weight;
        strengthSum.count += weight;
      }

      // Track looks that got high ratings
      if (rating >= 4) {
        const lookSignature = this.generateLookSignature(config);
        if (!favoriteLooks.includes(lookSignature)) {
          favoriteLooks.push(lookSignature);
        }
      }
    });

    // Convert to arrays and normalize
    const preferredAlgorithms = Array.from(algorithmUsage.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);

    const stylePreferences: Record<string, number> = {};
    styleUsage.forEach((count, style) => {
      stylePreferences[style] = count / sessions.length;
    });

    const averageEnhancementStrength = strengthSum.count > 0 
      ? strengthSum.total / strengthSum.count 
      : 0.5;

    return {
      preferredAlgorithms,
      stylePreferences,
      averageEnhancementStrength,
      favoriteLooks: favoriteLooks.slice(0, 10), // Top 10 favorite looks
      imageTypePreferences: Object.fromEntries(imageTypePreferences),
    };
  }

  private generateLookSignature(config: ImageEditingConfig): string {
    // Create a signature for this particular look/style
    const algorithms = config.algorithms
      .filter(alg => alg.enabled)
      .map(alg => alg.name)
      .sort()
      .join(',');
    
    return `${config.style}_${algorithms}_${Math.round(config.strength * 10)}`;
  }

  private getDefaultUserProfile(): UserEditingProfile {
    return {
      preferredAlgorithms: ['clahe', 'colorBalance', 'unsharpMask'],
      stylePreferences: {
        natural: 0.4,
        vibrant: 0.3,
        warm: 0.2,
        cool: 0.1,
        muted: 0.0,
      },
      averageEnhancementStrength: 0.5,
      favoriteLooks: [],
      imageTypePreferences: {},
    };
  }

  async generatePersonalizedConfig(
    analysis: ImageAnalysisResult,
    userProfile: UserEditingProfile,
    baseConfig?: ImageEditingConfig
  ): Promise<ImageEditingConfig> {
    // Start with base config or create default
    const config = baseConfig || this.getDefaultConfigForImageType(analysis.imageType);

    // Apply personalization
    const personalizedConfig = { ...config };

    // Adjust strength based on user preference
    personalizedConfig.strength = this.blendValues(
      config.strength,
      userProfile.averageEnhancementStrength,
      0.6 // 60% user preference, 40% base config
    );

    // Adjust style based on preferences
    personalizedConfig.style = this.selectPreferredStyle(
      userProfile.stylePreferences,
      config.style
    );

    // Modify algorithm selection based on user preferences
    personalizedConfig.algorithms = this.personalizeAlgorithms(
      config.algorithms,
      userProfile.preferredAlgorithms,
      analysis
    );

    return personalizedConfig;
  }

  private blendValues(base: number, preference: number, weight: number): number {
    return base * (1 - weight) + preference * weight;
  }

  private selectPreferredStyle(
    stylePreferences: Record<string, number>,
    defaultStyle: EditingStyle
  ): EditingStyle {
    // Find the most preferred style with reasonable usage
    const sortedPreferences = Object.entries(stylePreferences)
      .filter(([, score]) => score > 0.1) // Minimum usage threshold
      .sort(([, a], [, b]) => b - a);

    if (sortedPreferences.length > 0) {
      return sortedPreferences[0][0] as EditingStyle;
    }

    return defaultStyle;
  }

  private personalizeAlgorithms(
    baseAlgorithms: any[],
    preferredAlgorithms: string[],
    analysis: ImageAnalysisResult
  ): any[] {
    // Start with base algorithms
    const personalizedAlgorithms = [...baseAlgorithms];

    // Boost parameters for preferred algorithms
    personalizedAlgorithms.forEach(alg => {
      if (preferredAlgorithms.includes(alg.name)) {
        // Slightly increase effectiveness for preferred algorithms
        alg.params = this.boostAlgorithmParams(alg.name, alg.params, 1.1);
      }
    });

    // Add preferred algorithms that aren't in base config
    preferredAlgorithms.forEach(algName => {
      const exists = personalizedAlgorithms.some(alg => alg.name === algName);
      if (!exists && this.isAlgorithmSuitableForImage(algName, analysis)) {
        personalizedAlgorithms.push({
          name: algName,
          enabled: true,
          params: this.getDefaultParamsForAlgorithm(algName),
          order: personalizedAlgorithms.length + 1,
        });
      }
    });

    return personalizedAlgorithms;
  }

  private boostAlgorithmParams(algorithmName: string, params: any, factor: number): any {
    const boostedParams = { ...params };
    
    // Apply algorithm-specific parameter boosts
    switch (algorithmName) {
      case 'clahe':
        if (boostedParams.clipLimit) {
          boostedParams.clipLimit = Math.min(4.0, boostedParams.clipLimit * factor);
        }
        break;
      case 'unsharpMask':
        if (boostedParams.amount) {
          boostedParams.amount = Math.min(1.0, boostedParams.amount * factor);
        }
        break;
      case 'colorBalance':
        if (boostedParams.vibrancy) {
          boostedParams.vibrancy = Math.min(1.5, boostedParams.vibrancy * factor);
        }
        break;
    }

    return boostedParams;
  }

  private isAlgorithmSuitableForImage(algorithmName: string, analysis: ImageAnalysisResult): boolean {
    // Check if algorithm makes sense for this image type/quality
    switch (algorithmName) {
      case 'bilateral':
        return analysis.technicalQuality.sharpness < 0.7; // Good for noisy images
      case 'clahe':
        return analysis.technicalQuality.exposure < 0.8; // Good for exposure issues
      case 'colorBalance':
        return ['food', 'landscape', 'nature'].includes(analysis.imageType);
      case 'denoising':
        return analysis.technicalQuality.overall < 0.6; // Good for poor quality images
      default:
        return true;
    }
  }

  private getDefaultParamsForAlgorithm(algorithmName: string): any {
    const defaultParams: Record<string, any> = {
      clahe: { clipLimit: 2.0, tileGridSize: [8, 8] },
      bilateral: { d: 9, sigmaColor: 75, sigmaSpace: 75 },
      unsharpMask: { radius: 1.0, amount: 0.5, threshold: 0 },
      toneMapping: { gamma: 0.8, exposure: 0.2 },
      colorBalance: { temperature: 0, vibrancy: 1.2 },
      denoising: { strength: 0.5 },
    };

    return defaultParams[algorithmName] || {};
  }

  private getDefaultConfigForImageType(imageType: string): ImageEditingConfig {
    // Default configurations for each image type
    const configs: Record<string, ImageEditingConfig> = {
      portrait: {
        algorithms: [
          { name: 'clahe', enabled: true, params: { clipLimit: 2.0 }, order: 1 },
          { name: 'bilateral', enabled: true, params: { d: 9 }, order: 2 },
        ],
        strength: 0.6,
        priority: 'quality',
        style: 'natural',
      },
      landscape: {
        algorithms: [
          { name: 'clahe', enabled: true, params: { clipLimit: 3.0 }, order: 1 },
          { name: 'colorBalance', enabled: true, params: { vibrancy: 1.2 }, order: 2 },
        ],
        strength: 0.7,
        priority: 'artistic',
        style: 'vibrant',
      },
      food: {
        algorithms: [
          { name: 'colorBalance', enabled: true, params: { temperature: 100, vibrancy: 1.4 }, order: 1 },
          { name: 'unsharpMask', enabled: true, params: { amount: 0.6 }, order: 2 },
        ],
        strength: 0.8,
        priority: 'artistic',
        style: 'warm',
      },
    };

    return configs[imageType] || configs.portrait;
  }

  async recordUserFeedback(feedback: UserFeedback): Promise<void> {
    try {
      // Store feedback in database
      const { error } = await this.supabase
        .from('editing_feedback')
        .insert({
          editing_session_id: feedback.editingSessionId,
          user_id: feedback.userId,
          feedback_type: feedback.feedbackType,
          specific_feedback: feedback.specificFeedback || {},
        });

      if (error) throw error;

      // Invalidate cached user profile to force refresh
      this.userProfiles.delete(feedback.userId);

      console.log('User feedback recorded successfully');
    } catch (error) {
      console.error('Failed to record user feedback:', error);
    }
  }

  async adaptConfigFromFeedback(
    config: ImageEditingConfig,
    feedback: UserFeedback
  ): Promise<ImageEditingConfig> {
    const adaptedConfig = { ...config };

    // Apply immediate adaptations based on feedback
    if (feedback.specificFeedback) {
      const specific = feedback.specificFeedback;

      // Adjust strength
      if (specific.tooStrong) {
        adaptedConfig.strength = Math.max(0.1, adaptedConfig.strength * 0.8);
      } else if (specific.tooWeak) {
        adaptedConfig.strength = Math.min(1.0, adaptedConfig.strength * 1.2);
      }

      // Disable algorithms that caused issues
      if (specific.issueAspects) {
        adaptedConfig.algorithms.forEach(alg => {
          if (specific.issueAspects!.some(issue => alg.name.includes(issue))) {
            alg.enabled = false;
          }
        });
      }

      // Boost algorithms that improved things
      if (specific.improvedAspects) {
        adaptedConfig.algorithms.forEach(alg => {
          if (specific.improvedAspects!.some(improvement => alg.name.includes(improvement))) {
            alg.params = this.boostAlgorithmParams(alg.name, alg.params, 1.15);
          }
        });
      }
    }

    return adaptedConfig;
  }

  getPersonalizationInsights(userId: string): PersonalizationInsights | null {
    const learningData = this.learningData.get(userId);
    if (!learningData || learningData.length < 5) {
      return null; // Need minimum data for insights
    }

    const insights: PersonalizationInsights = {
      preferredAlgorithms: {},
      stylePreferences: {} as Record<EditingStyle, number>,
      strengthPreferences: {},
      priorityPreferences: {} as Record<EditingPriority, number>,
      algorithmEffectiveness: {},
    };

    // Analyze patterns in learning data
    learningData.forEach(data => {
      const weight = data.userRating / 5; // Weight by satisfaction

      // Algorithm preferences
      data.originalConfig.algorithms.forEach(alg => {
        if (alg.enabled) {
          insights.preferredAlgorithms[alg.name] = 
            (insights.preferredAlgorithms[alg.name] || 0) + weight;
        }
      });

      // Style preferences
      insights.stylePreferences[data.originalConfig.style] = 
        (insights.stylePreferences[data.originalConfig.style] || 0) + weight;

      // Strength preferences by image type
      insights.strengthPreferences[data.imageType] = 
        (insights.strengthPreferences[data.imageType] || 0) + 
        (data.originalConfig.strength * weight);

      // Priority preferences
      insights.priorityPreferences[data.originalConfig.priority] = 
        (insights.priorityPreferences[data.originalConfig.priority] || 0) + weight;

      // Algorithm effectiveness (quality improvement * user satisfaction)
      data.originalConfig.algorithms.forEach(alg => {
        if (alg.enabled) {
          const effectiveness = data.qualityImprovement * weight;
          insights.algorithmEffectiveness[alg.name] = 
            (insights.algorithmEffectiveness[alg.name] || 0) + effectiveness;
        }
      });
    });

    return insights;
  }

  clearUserCache(userId: string): void {
    this.userProfiles.delete(userId);
    this.learningData.delete(userId);
  }

  async preloadUserProfile(userId: string): Promise<void> {
    // Preload user profile for faster response times
    await this.analyzeUserHistory(userId);
  }
}

// Factory function to create service with Supabase client
export function createPersonalizationEngine(supabase: SupabaseClient<Database>): PersonalizationEngine {
  return new PersonalizationEngine(supabase);
}