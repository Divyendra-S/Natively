import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ImageEditingConfig, AlgorithmConfig, EditingPriority, EditingStyle } from './enhancementService';

export interface ImageAnalysisResult {
  imageType: string;
  confidence: number;
  technicalQuality: {
    exposure: number;
    sharpness: number;
    composition: number;
    overall: number;
  };
  detectedObjects: string[];
  mood: string;
  suggestedImprovements: string[];
  editingIntensity: 'light' | 'medium' | 'heavy';
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerDay: number;
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro';
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private rateLimitConfig: RateLimitConfig;
  private requestHistory: number[] = [];
  private dailyRequestCount: number = 0;
  private lastResetDate: string = '';

  constructor(apiKey: string, config: RateLimitConfig = {
    requestsPerMinute: 15,
    requestsPerDay: 1500,
    model: 'gemini-1.5-flash'
  }) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.model });
    this.rateLimitConfig = config;
    this.initializeDailyCounter();
  }

  private initializeDailyCounter(): void {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.dailyRequestCount = 0;
      this.lastResetDate = today;
    }
  }

  private async checkRateLimit(): Promise<void> {
    this.initializeDailyCounter();

    // Check daily limit
    if (this.dailyRequestCount >= this.rateLimitConfig.requestsPerDay) {
      throw new Error('Daily API quota exceeded. Please try again tomorrow.');
    }

    // Check per-minute limit
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    
    // Clean old requests
    this.requestHistory = this.requestHistory.filter(time => time > oneMinuteAgo);
    
    if (this.requestHistory.length >= this.rateLimitConfig.requestsPerMinute) {
      const oldestRequest = Math.min(...this.requestHistory);
      const waitTime = oldestRequest + 60 * 1000 - now;
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
  }

  private recordRequest(): void {
    this.requestHistory.push(Date.now());
    this.dailyRequestCount++;
  }

  private createAnalysisPrompt(): string {
    return `Analyze this image and provide a detailed assessment in JSON format. Return ONLY valid JSON with the following structure:

{
  "imageType": "portrait|landscape|food|nature|architecture|abstract|other",
  "confidence": 0.0-1.0,
  "technicalQuality": {
    "exposure": 0.0-1.0,
    "sharpness": 0.0-1.0,
    "composition": 0.0-1.0,
    "overall": 0.0-1.0
  },
  "detectedObjects": ["object1", "object2", "..."],
  "mood": "vibrant|calm|dramatic|soft|energetic|moody|neutral",
  "suggestedImprovements": ["improvement1", "improvement2", "..."],
  "editingIntensity": "light|medium|heavy"
}

Guidelines:
- imageType: Classify the main subject/category
- confidence: How certain you are about the classification
- technicalQuality: Rate each aspect from 0.0 (poor) to 1.0 (excellent)
- detectedObjects: List main objects/subjects in the image
- mood: Overall emotional tone of the image
- suggestedImprovements: Specific areas that could be enhanced
- editingIntensity: Recommended processing level based on current quality

Focus on actionable insights for automated image enhancement.`;
  }

  private createConfigGenerationPrompt(analysis: ImageAnalysisResult): string {
    return `Based on the image analysis provided, generate an optimal image editing configuration. Return ONLY valid JSON with this structure:

{
  "algorithms": [
    {
      "name": "clahe|bilateral|unsharp_mask|tone_mapping|color_balance|denoising",
      "enabled": true|false,
      "params": {
        "param1": value,
        "param2": value
      },
      "order": 1,
      "conditional": {
        "when": "condition_expression"
      }
    }
  ],
  "strength": 0.0-1.0,
  "priority": "quality|speed|artistic",
  "style": "natural|vibrant|muted|warm|cool",
  "reasoning": "Brief explanation of choices"
}

Image Analysis:
- Type: ${analysis.imageType}
- Quality: Exposure ${analysis.technicalQuality.exposure}, Sharpness ${analysis.technicalQuality.sharpness}, Overall ${analysis.technicalQuality.overall}
- Objects: ${analysis.detectedObjects.join(', ')}
- Mood: ${analysis.mood}
- Suggested Improvements: ${analysis.suggestedImprovements.join(', ')}
- Editing Intensity: ${analysis.editingIntensity}

Algorithm Guidelines:
- clahe: For exposure/contrast issues (clipLimit: 1.0-4.0, tileGridSize: [4,4] to [16,16])
- bilateral: For noise reduction (d: 5-15, sigmaColor: 20-150, sigmaSpace: 20-150)
- unsharp_mask: For sharpness (radius: 0.5-2.0, amount: 0.3-1.0, threshold: 0-10)
- tone_mapping: For HDR effects (gamma: 0.4-1.2, exposure: -0.5 to 0.5)
- color_balance: For color correction (temperature: -200 to 200, vibrancy: 0.8-1.5)
- denoising: For high noise images (strength: 0.3-0.9)

Priority Guidelines:
- quality: Focus on technical improvements
- speed: Use fewer, faster algorithms
- artistic: Emphasize mood and style

Style Guidelines:
- natural: Subtle enhancements
- vibrant: Boost colors and contrast
- muted: Soften colors and contrast
- warm: Increase warmth/orange tones
- cool: Increase cool/blue tones

Consider the image type and quality issues when selecting algorithms and parameters.`;
  }

  async analyzeImage(imageBase64: string): Promise<ImageAnalysisResult> {
    try {
      await this.checkRateLimit();

      const prompt = this.createAnalysisPrompt();
      
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg',
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      this.recordRequest();

      const response = await result.response;
      const text = response.text();

      // Clean and parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini API');
      }

      const analysisResult = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize the response
      return this.validateAnalysisResult(analysisResult);
      
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      
      // Return fallback analysis if API fails
      if (error instanceof Error && error.message.includes('quota')) {
        throw error; // Re-throw quota errors
      }
      
      return this.getFallbackAnalysis();
    }
  }

  private validateAnalysisResult(result: any): ImageAnalysisResult {
    // Provide defaults for missing or invalid fields
    return {
      imageType: result.imageType || 'other',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      technicalQuality: {
        exposure: Math.max(0, Math.min(1, result.technicalQuality?.exposure || 0.7)),
        sharpness: Math.max(0, Math.min(1, result.technicalQuality?.sharpness || 0.7)),
        composition: Math.max(0, Math.min(1, result.technicalQuality?.composition || 0.7)),
        overall: Math.max(0, Math.min(1, result.technicalQuality?.overall || 0.7)),
      },
      detectedObjects: Array.isArray(result.detectedObjects) ? result.detectedObjects : [],
      mood: result.mood || 'neutral',
      suggestedImprovements: Array.isArray(result.suggestedImprovements) ? result.suggestedImprovements : [],
      editingIntensity: ['light', 'medium', 'heavy'].includes(result.editingIntensity) ? result.editingIntensity : 'medium',
    };
  }

  private getFallbackAnalysis(): ImageAnalysisResult {
    return {
      imageType: 'other',
      confidence: 0.5,
      technicalQuality: {
        exposure: 0.7,
        sharpness: 0.7,
        composition: 0.7,
        overall: 0.7,
      },
      detectedObjects: [],
      mood: 'neutral',
      suggestedImprovements: ['Enhance brightness', 'Improve contrast', 'Adjust colors'],
      editingIntensity: 'medium',
    };
  }

  async generateEditingConfig(
    analysis: ImageAnalysisResult,
    userPreferences?: {
      preferredStyle?: EditingStyle;
      enhancementStrength?: number;
      priorityMode?: EditingPriority;
    }
  ): Promise<ImageEditingConfig> {
    try {
      await this.checkRateLimit();

      const prompt = this.createConfigGenerationPrompt(analysis);
      
      // Add user preferences context if provided
      let enhancedPrompt = prompt;
      if (userPreferences) {
        enhancedPrompt += `\n\nUser Preferences:
- Preferred Style: ${userPreferences.preferredStyle || 'natural'}
- Enhancement Strength: ${userPreferences.enhancementStrength || 0.5}
- Priority Mode: ${userPreferences.priorityMode || 'quality'}

Adjust the configuration to match these preferences while maintaining image quality.`;
      }

      const result = await this.model.generateContent([enhancedPrompt]);
      this.recordRequest();

      const response = await result.response;
      const text = response.text();

      // Clean and parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini API');
      }

      const configResult = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize the response
      return this.validateEditingConfig(configResult, analysis);
      
    } catch (error) {
      console.error('Gemini config generation failed:', error);
      
      // Return fallback configuration if API fails
      if (error instanceof Error && error.message.includes('quota')) {
        throw error; // Re-throw quota errors
      }
      
      return this.getFallbackEditingConfig(analysis, userPreferences);
    }
  }

  async analyzeImageWithCache(
    imageBase64: string,
    cacheKey?: string
  ): Promise<ImageAnalysisResult> {
    // Simple in-memory cache for development
    if (cacheKey && this.analysisCache.has(cacheKey)) {
      console.log('Using cached analysis result');
      return this.analysisCache.get(cacheKey)!;
    }

    const result = await this.analyzeImage(imageBase64);
    
    if (cacheKey) {
      this.analysisCache.set(cacheKey, result);
    }

    return result;
  }

  private analysisCache = new Map<string, ImageAnalysisResult>();
  private configCache = new Map<string, ImageEditingConfig>();

  private validateEditingConfig(result: any, analysis: ImageAnalysisResult): ImageEditingConfig {
    const validAlgorithms = ['clahe', 'bilateral', 'unsharp_mask', 'tone_mapping', 'color_balance', 'denoising'];
    const validPriorities: EditingPriority[] = ['quality', 'speed', 'artistic'];
    const validStyles: EditingStyle[] = ['natural', 'vibrant', 'muted', 'warm', 'cool'];

    // Validate algorithms array
    const algorithms: AlgorithmConfig[] = Array.isArray(result.algorithms) 
      ? result.algorithms
          .filter((alg: any) => validAlgorithms.includes(alg.name))
          .map((alg: any, index: number) => ({
            name: alg.name,
            enabled: Boolean(alg.enabled),
            params: alg.params || {},
            order: typeof alg.order === 'number' ? alg.order : index + 1,
            conditional: alg.conditional || undefined,
          }))
      : this.getDefaultAlgorithmsForImageType(analysis.imageType);

    return {
      algorithms,
      strength: Math.max(0, Math.min(1, result.strength || 0.5)),
      priority: validPriorities.includes(result.priority) ? result.priority : 'quality',
      style: validStyles.includes(result.style) ? result.style : 'natural',
      customParams: result.customParams || {},
    };
  }

  private getFallbackEditingConfig(
    analysis: ImageAnalysisResult,
    userPreferences?: {
      preferredStyle?: EditingStyle;
      enhancementStrength?: number;
      priorityMode?: EditingPriority;
    }
  ): ImageEditingConfig {
    const algorithms = this.getDefaultAlgorithmsForImageType(analysis.imageType);
    
    return {
      algorithms,
      strength: userPreferences?.enhancementStrength || 0.5,
      priority: userPreferences?.priorityMode || 'quality',
      style: userPreferences?.preferredStyle || 'natural',
      customParams: {
        fallback: true,
        reason: 'API_unavailable',
      },
    };
  }

  private getDefaultAlgorithmsForImageType(imageType: string): AlgorithmConfig[] {
    const algorithmConfigs: Record<string, AlgorithmConfig[]> = {
      portrait: [
        {
          name: 'clahe',
          enabled: true,
          params: { clipLimit: 2.0, tileGridSize: [8, 8] },
          order: 1,
        },
        {
          name: 'bilateral',
          enabled: true,
          params: { d: 9, sigmaColor: 75, sigmaSpace: 75 },
          order: 2,
        },
        {
          name: 'unsharp_mask',
          enabled: true,
          params: { radius: 1.0, amount: 0.5, threshold: 0 },
          order: 3,
        },
      ],
      landscape: [
        {
          name: 'clahe',
          enabled: true,
          params: { clipLimit: 3.0, tileGridSize: [16, 16] },
          order: 1,
        },
        {
          name: 'tone_mapping',
          enabled: true,
          params: { gamma: 0.8, exposure: 0.2 },
          order: 2,
        },
        {
          name: 'color_balance',
          enabled: true,
          params: { temperature: 0, tint: 0, vibrancy: 1.2 },
          order: 3,
        },
      ],
      food: [
        {
          name: 'color_balance',
          enabled: true,
          params: { temperature: 100, vibrancy: 1.4, saturation: 1.2 },
          order: 1,
        },
        {
          name: 'unsharp_mask',
          enabled: true,
          params: { radius: 0.8, amount: 0.6, threshold: 2 },
          order: 2,
        },
      ],
      nature: [
        {
          name: 'clahe',
          enabled: true,
          params: { clipLimit: 2.5, tileGridSize: [12, 12] },
          order: 1,
        },
        {
          name: 'color_balance',
          enabled: true,
          params: { vibrancy: 1.3, greens: 1.2, blues: 1.1 },
          order: 2,
        },
      ],
    };

    return algorithmConfigs[imageType] || algorithmConfigs.portrait;
  }

  async generateEditingConfigWithCache(
    analysis: ImageAnalysisResult,
    userPreferences?: {
      preferredStyle?: EditingStyle;
      enhancementStrength?: number;
      priorityMode?: EditingPriority;
    },
    cacheKey?: string
  ): Promise<ImageEditingConfig> {
    // Simple in-memory cache for development
    if (cacheKey && this.configCache.has(cacheKey)) {
      console.log('Using cached editing config');
      return this.configCache.get(cacheKey)!;
    }

    const result = await this.generateEditingConfig(analysis, userPreferences);
    
    if (cacheKey) {
      this.configCache.set(cacheKey, result);
    }

    return result;
  }

  getRemainingQuota(): { minute: number; day: number } {
    this.initializeDailyCounter();
    
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const recentRequests = this.requestHistory.filter(time => time > oneMinuteAgo);
    
    return {
      minute: Math.max(0, this.rateLimitConfig.requestsPerMinute - recentRequests.length),
      day: Math.max(0, this.rateLimitConfig.requestsPerDay - this.dailyRequestCount),
    };
  }

  getNextAvailableTime(): Date | null {
    const quota = this.getRemainingQuota();
    
    if (quota.day === 0) {
      // Next day at midnight Pacific Time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }
    
    if (quota.minute === 0 && this.requestHistory.length > 0) {
      const oldestRequest = Math.min(...this.requestHistory);
      return new Date(oldestRequest + 60 * 1000);
    }
    
    return null;
  }

  // Test method to verify API connection
  async testConnection(): Promise<boolean> {
    try {
      const testPrompt = "Respond with only the word 'SUCCESS' if you can see this message.";
      const result = await this.model.generateContent([testPrompt]);
      const response = await result.response;
      const text = response.text();
      
      return text.toLowerCase().includes('success');
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}

// Factory function to create service with environment config
export function createGeminiService(): GeminiService {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not configured');
  }

  // Use development-friendly settings
  const config: RateLimitConfig = {
    requestsPerMinute: 15,
    requestsPerDay: 1500,
    model: 'gemini-1.5-flash', // Higher quota for development
  };

  return new GeminiService(apiKey, config);
}