import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useImageQuery, useUpdateImageStatusMutation } from '../hooks/queries/useImages';
import { useSupabase } from '../hooks/useSupabase';
import { ImageService } from '../services/imageService';
import { createGeminiService } from '../services/geminiService';
import { ImageEnhancementEngine } from '../services/enhancementService';
import { EditingEngine } from '../services/editingEngine';
import { createPersonalizationEngine } from '../services/personalizationEngine';
import { createQualityAssessment } from '../services/qualityAssessment';
import SmartFilterRecommender from '../services/smartFilterRecommender';
import TrueRGBProcessor from '../services/trueRGBProcessor';
import TestRGBProcessor from '../services/testRGBProcessor';
import { useImageEditingWorkflow } from '../hooks/queries/useImageEditing';
import ProcessingProgress from '../components/ProcessingProgress';
import type { ImageAnalysisResult } from '../services/geminiService';
import type { ImageEditingConfig } from '../services/enhancementService';
import type { DetailedAnalysis } from '../services/analysisEngine';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  description?: string;
}

export default function ProcessingScreen() {
  const { imageId } = useLocalSearchParams<{ imageId: string }>();
  const insets = useSafeAreaInsets();
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [editingConfig, setEditingConfig] = useState<ImageEditingConfig | null>(null);
  const [enhancementEngine, setEnhancementEngine] = useState<ImageEnhancementEngine | null>(null);
  const [rgbEditingEngine, setRgbEditingEngine] = useState<EditingEngine | null>(null);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  
  const supabase = useSupabase();
  const updateImageStatusMutation = useUpdateImageStatusMutation();
  
  const {
    data: image,
    isLoading,
    refetch,
  } = useImageQuery(imageId!, {
    enabled: !!imageId,
    refetchInterval: (data) => {
      // More frequent refetching during processing
      if (data?.status === 'processing') return 1000; // Every 1 second during processing
      if (data?.status === 'analyzing') return 1500; // Every 1.5 seconds during analysis
      return 3000; // Every 3 seconds otherwise
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  
  const editingWorkflow = useImageEditingWorkflow(imageId!, image?.user_id || '');

  // Initialize enhancement engines
  useEffect(() => {
    if (supabase && !enhancementEngine) {
      setEnhancementEngine(new ImageEnhancementEngine(supabase));
    }
    if (!rgbEditingEngine) {
      setRgbEditingEngine(new EditingEngine());
    }
  }, [supabase, enhancementEngine, rgbEditingEngine]);

  // Initialize processing steps based on image status
  useEffect(() => {
    if (!image) return;

    const initialSteps: ProcessingStep[] = [
      {
        id: 'upload',
        label: 'Image Upload',
        status: 'completed',
        description: 'Image uploaded to secure storage',
      },
      {
        id: 'analysis',
        label: 'AI Analysis',
        status: image.status === 'uploaded' ? 'active' : 
               image.status === 'analyzing' ? 'active' :
               ['analyzed', 'processing', 'processed'].includes(image.status || '') ? 'completed' : 'pending',
        description: 'Analyzing image content, quality, and composition',
      },
      {
        id: 'config_generation',
        label: 'Smart Configuration',
        status: image.status === 'analyzed' && !editingConfig ? 'active' :
               editingConfig ? 'completed' : 'pending',
        description: 'AI generating personalized enhancement settings',
      },
      {
        id: 'processing',
        label: 'RGB Mathematical Enhancement',
        status: image.status === 'processing' ? 'active' :
               image.status === 'processed' ? 'completed' :
               image.status === 'analyzed' && editingConfig ? 'active' : 'pending',
        description: 'Applying AI-generated mathematical RGB functions',
      },
      {
        id: 'completion',
        label: 'Finalization',
        status: image.status === 'processed' ? 'completed' : 'pending',
        description: 'Preparing your enhanced image',
      },
    ];

    // Handle failed status
    if (image.status === 'failed') {
      initialSteps.forEach((step, index) => {
        if (step.status === 'active') {
          initialSteps[index] = { ...step, status: 'failed' };
        }
      });
    }

    setSteps(initialSteps);

    // Parse analysis data if available
    if (image.analysis_data) {
      try {
        const parsed = typeof image.analysis_data === 'string' 
          ? JSON.parse(image.analysis_data)
          : image.analysis_data;
        
        // Validate parsed data has required fields
        if (parsed && parsed.imageType && parsed.technicalQuality) {
          setAnalysisResult(parsed);
          console.log('✅ Analysis data parsed successfully:', {
            imageType: parsed.imageType,
            mood: parsed.mood,
            quality: parsed.technicalQuality?.overall
          });
        } else {
          console.error('⚠️ Invalid analysis data structure:', parsed);
          // Set a fallback analysis result
          setAnalysisResult({
            imageType: 'unknown',
            mood: 'neutral',
            technicalQuality: { overall: 0.5, exposure: 0.5, sharpness: 0.5, composition: 0.5 },
            confidence: 0.5,
            editingIntensity: 'medium',
            detectedObjects: [],
            suggestedImprovements: ['enhance_contrast', 'improve_colors']
          });
        }
      } catch (error) {
        console.error('❌ Failed to parse analysis data:', error);
        // Set a fallback analysis result
        setAnalysisResult({
          imageType: 'unknown',
          mood: 'neutral', 
          technicalQuality: { overall: 0.5, exposure: 0.5, sharpness: 0.5, composition: 0.5 },
          confidence: 0.5,
          editingIntensity: 'medium',
          detectedObjects: [],
          suggestedImprovements: ['enhance_contrast', 'improve_colors']
        });
      }
    }
  }, [image]);

  // Auto-trigger next processing step
  useEffect(() => {
    if (!image || !imageId) return;

    const triggerNextStep = async () => {
      const imageService = new ImageService(supabase);
      
      try {
        console.log('🔄 PROCESSING STEP CHECK:', {
          status: image.status,
          hasEditingConfig: !!editingConfig,
          hasProcessedUrl: !!image.processed_url,
          hasAnalysisResult: !!analysisResult,
          hasEnhancementEngine: !!enhancementEngine,
          processedUrl: image.processed_url,
          timestamp: new Date().toISOString()
        });
        
        // Detailed condition logging
        if (image.status === 'uploaded') {
          console.log('📊 CONDITION: Status is uploaded - will start analysis');
        } else if (image.status === 'analyzed' && !editingConfig) {
          console.log('📊 CONDITION: Status is analyzed, no config - will generate config');
        } else if (image.status === 'analyzed' && editingConfig && !image.processed_url) {
          console.log('📊 CONDITION: Status is analyzed, has config, no processed URL - will start enhancement');
        } else if (image.status === 'processing') {
          console.log('📊 CONDITION: Status is processing - waiting for completion');
        } else if (image.status === 'processed') {
          console.log('📊 CONDITION: Status is processed - enhancement complete');
        } else {
          console.log('📊 CONDITION: No matching condition:', {
            status: image.status,
            hasEditingConfig: !!editingConfig,
            hasProcessedUrl: !!image.processed_url
          });
        }

        if (image.status === 'uploaded') {
          console.log('📊 Starting analysis...');
          await startAnalysis(imageService);
        } else if (image.status === 'analyzed' && !editingConfig) {
          console.log('⚙️ Generating editing configuration...');
          await generateEditingConfig();
          
          // Don't wait for timeout - the useEffect will re-run when editingConfig changes
          console.log('🔄 Config generation completed, useEffect will re-trigger automatically');
        } else if (image.status === 'analyzed' && editingConfig && !image.processed_url) {
          console.log('🎨 Starting enhancement with config:', editingConfig);
          await startEnhancement(imageService);
        } else {
          console.log('✅ No action needed for current state:', {
            status: image.status,
            hasEditingConfig: !!editingConfig,
            hasProcessedUrl: !!image.processed_url,
            reason: image.status === 'processed' ? 'Already processed' : 
                   image.status === 'processing' ? 'Currently processing' : 
                   image.status === 'failed' ? 'Failed status' : 'Unknown condition'
          });
        }
      } catch (error) {
        console.error('❌ Auto-processing failed:', error);
        try {
          await imageService.updateImageStatus(imageId, 'failed');
        } catch (updateError) {
          console.error('Failed to update status to failed:', updateError);
        }
      }
    };

    // Add a small delay to prevent rapid fire calls
    const timeout = setTimeout(triggerNextStep, 100); // Reduced delay for faster response
    return () => clearTimeout(timeout);
  }, [image?.status, imageId, supabase, editingConfig, analysisResult, image?.processed_url]);
  
  // Additional effect specifically for when editingConfig becomes available
  useEffect(() => {
    if (image?.status === 'analyzed' && editingConfig && !image?.processed_url) {
      console.log('🎯 EDITING CONFIG EFFECT: Config is ready, triggering enhancement...');
      const triggerEnhancement = async () => {
        const imageService = new ImageService(supabase);
        await startEnhancement(imageService);
      };
      
      // Small delay to ensure state is fully updated
      const timeout = setTimeout(triggerEnhancement, 50);
      return () => clearTimeout(timeout);
    }
  }, [editingConfig, image?.status, image?.processed_url]);

  const startAnalysis = async (imageService: ImageService) => {
    if (!image || !imageId) return;

    try {
      await updateImageStatusMutation.mutateAsync({
        imageId,
        status: 'analyzing',
      });

      const geminiService = createGeminiService();
      const base64 = await imageService.imageToBase64(image.original_url);
      const analysis = await geminiService.analyzeImage(base64);

      await updateImageStatusMutation.mutateAsync({
        imageId,
        status: 'analyzed',
        updates: {
          analysis_data: analysis as any,
        },
      });

      setAnalysisResult(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      await updateImageStatusMutation.mutateAsync({
        imageId,
        status: 'failed',
      });
    }
  };

  const generateEditingConfig = async () => {
    console.log('🚀 GENERATE CONFIG: Function called');
    
    if (!analysisResult) {
      console.log('⚠️ No analysis result available for config generation');
      return;
    }
    
    if (!image?.user_id) {
      console.log('⚠️ No user ID available for config generation');
      return;
    }

    console.log('✅ Prerequisites met for config generation:', { 
      hasAnalysis: !!analysisResult, 
      hasUserId: !!image?.user_id,
      imageType: analysisResult.imageType,
      mood: analysisResult.mood
    });

    try {
      console.log('🚀 Generating FAST configuration for image type:', analysisResult.imageType);
      
      // Create OPTIMIZED configuration for REAL visual effects
      const config: ImageEditingConfig = {
        algorithms: [
          {
            name: 'dramatic_enhancement',
            enabled: true,
            params: { 
              intensity: analysisResult.technicalQuality.overall < 0.6 ? 0.8 : 0.7,
              style: analysisResult.imageType === 'portrait' ? 'natural' : 'vibrant'
            },
            order: 1,
          },
          {
            name: 'clahe',
            enabled: analysisResult.technicalQuality.exposure < 0.7,
            params: { 
              clipLimit: analysisResult.technicalQuality.exposure < 0.5 ? 3.0 : 2.5,
              tileGridSize: [8, 8]
            },
            order: 2,
          },
          {
            name: 'color_balance',
            enabled: true,
            params: { 
              vibrancy: analysisResult.imageType === 'food' ? 1.4 : 1.3,
              temperature: analysisResult.mood === 'warm' ? 80 : 20,
              tint: 0
            },
            order: 3,
          },
          {
            name: 'unsharp_mask',
            enabled: analysisResult.technicalQuality.sharpness < 0.7,
            params: { 
              radius: 1.2,
              amount: analysisResult.technicalQuality.sharpness < 0.5 ? 0.8 : 0.6,
              threshold: 0
            },
            order: 4,
          }
        ],
        strength: analysisResult.technicalQuality.overall < 0.6 ? 0.9 : 0.7,
        priority: analysisResult.imageType === 'portrait' ? 'quality' : 'artistic',
        style: analysisResult.imageType === 'landscape' ? 'vibrant' : 'natural',
      };

      // Set config immediately - no async operations needed
      setEditingConfig(config);
      console.log('✅ FAST configuration generated successfully:', {
        algorithms: config.algorithms.length,
        strength: config.strength,
        style: config.style
      });
      
      console.log('🚀 Config state updated - this will trigger useEffect to start enhancement!');
      
      // Force immediate enhancement trigger if image is still analyzed
      if (image?.status === 'analyzed') {
        console.log('🎯 FORCING IMMEDIATE ENHANCEMENT TRIGGER...');
        // Small delay to ensure state is updated
        setTimeout(async () => {
          if (image?.status === 'analyzed' && !image?.processed_url) {
            console.log('🚀 MANUALLY TRIGGERING ENHANCEMENT...');
            const imageService = new ImageService(supabase);
            await startEnhancement(imageService);
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('⚠️ Configuration generation failed, using fallback:', error);
      
      // Bulletproof fallback with GUARANTEED real effects
      const fallbackConfig: ImageEditingConfig = {
        algorithms: [
          {
            name: 'dramatic_enhancement',
            enabled: true,
            params: { intensity: 0.8, style: 'vibrant' },
            order: 1,
          }
        ],
        strength: 0.8,
        priority: 'quality',
        style: 'vibrant',
      };
      setEditingConfig(fallbackConfig);
      console.log('✅ Fallback configuration set successfully');
      console.log('🚀 Fallback config state updated - this will trigger useEffect to start enhancement!');
      
      // Force immediate enhancement trigger for fallback too
      if (image?.status === 'analyzed') {
        console.log('🎯 FORCING IMMEDIATE FALLBACK ENHANCEMENT TRIGGER...');
        setTimeout(async () => {
          if (image?.status === 'analyzed' && !image?.processed_url) {
            console.log('🚀 MANUALLY TRIGGERING FALLBACK ENHANCEMENT...');
            const imageService = new ImageService(supabase);
            await startEnhancement(imageService);
          }
        }, 100);
      }
    }
  };

  const startEnhancement = async (imageService: ImageService) => {
    if (!image || !imageId || !analysisResult || (!enhancementEngine && !rgbEditingEngine) || !editingConfig) {
      console.log('❌ ENHANCEMENT BLOCKED - Missing requirements:', {
        hasImage: !!image,
        hasImageId: !!imageId,
        hasAnalysisResult: !!analysisResult,
        hasEnhancementEngine: !!enhancementEngine,
        hasRgbEditingEngine: !!rgbEditingEngine,
        hasEditingConfig: !!editingConfig
      });
      return;
    }

    console.log('🎨 STARTING RGB MATHEMATICAL ENHANCEMENT PROCESS with full prerequisites');
    console.log('📊 Image data:', {
      imageId,
      originalUrl: image.original_url,
      status: image.status,
      hasProcessedUrl: !!image.processed_url
    });
    console.log('⚙️ Enhancement config:', {
      algorithmsCount: editingConfig.algorithms.length,
      enabledAlgorithms: editingConfig.algorithms.filter(alg => alg.enabled).length,
      strength: editingConfig.strength,
      style: editingConfig.style
    });

    try {
      console.log('📋 Setting status to processing...');
      await updateImageStatusMutation.mutateAsync({
        imageId,
        status: 'processing',
      });
      console.log('✅ Status updated to processing');
      
      // Force refetch to ensure UI updates
      console.log('🔄 Forcing image data refetch after status update...');
      await refetch();

      // Start editing session with AI configuration
      const algorithmNames = editingConfig.algorithms.filter(alg => alg.enabled).map(alg => alg.name);
      console.log('🔧 Applying algorithms:', algorithmNames);
      console.log('📋 Algorithm details:', editingConfig.algorithms.map(alg => ({
        name: alg.name,
        enabled: alg.enabled,
        params: alg.params,
        order: alg.order
      })));
      
      console.log('🚀 Starting editing session...');
      const sessionStartTime = Date.now();
      const session = await editingWorkflow.startEditingSession(editingConfig, algorithmNames);
      console.log('✅ Editing session started:', {
        sessionId: session.id,
        timeTaken: Date.now() - sessionStartTime,
        algorithms: algorithmNames
      });

      // Convert analysisResult to DetailedAnalysis format for RGB processing
      const detailedAnalysis = {
        technicalQuality: {
          brightness: analysisResult.technicalQuality.exposure || 0.5,
          contrast: analysisResult.technicalQuality.overall || 0.5,
          sharpness: analysisResult.technicalQuality.sharpness || 0.5,
          exposure: analysisResult.technicalQuality.exposure || 0.5,
          composition: analysisResult.technicalQuality.composition || 0.5,
          overall: analysisResult.technicalQuality.overall || 0.5
        },
        contentAnalysis: {
          subjects: analysisResult.detectedObjects || [],
          mood: analysisResult.mood || 'neutral',
          style: analysisResult.imageType === 'portrait' ? 'portrait' : 'general',
          setting: analysisResult.mood === 'warm' ? 'sunset' : 'general'
        },
        colorAnalysis: {
          dominantColors: ['#808080'] // Fallback color
        },
        recommendations: {}
      };

      console.log('🎯 USING RGB MATHEMATICAL ENHANCEMENT with AI-generated functions');
      console.log('🧮 Analysis for RGB calculation:', {
        brightness: detailedAnalysis.technicalQuality.brightness,
        contrast: detailedAnalysis.technicalQuality.contrast,
        imageType: analysisResult.imageType,
        mood: analysisResult.mood,
        subjects: detailedAnalysis.contentAnalysis.subjects
      });
      
      const enhancementStartTime = Date.now();
      let result;
      
      if (rgbEditingEngine) {
        // Use new RGB mathematical enhancement with AI-generated functions
        console.log('🚀 Applying AI-driven RGB mathematical functions...');
        result = await rgbEditingEngine.autoEnhanceWithMath(image.original_url, detailedAnalysis);
        console.log('✅ RGB mathematical enhancement completed:', {
          uri: result.uri,
          width: result.width,
          height: result.height
        });
        
        // Convert to expected format
        result = {
          processedImageUri: result.uri,
          processingTime: Date.now() - enhancementStartTime
        };
      } else {
        // Fallback to original enhancement engine
        console.log('⚠️ Falling back to original enhancement engine...');
        const enhancementPromise = enhancementEngine!.processImage(
          image.original_url,
          analysisResult,
          { editingConfig }
        );
        
        // Add 30 second timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Enhancement timeout')), 30000)
        );
        
        result = await Promise.race([enhancementPromise, timeoutPromise]) as any;
      }
      const enhancementEndTime = Date.now();
      console.log('🎉 ENHANCEMENT COMPLETED!', {
        processedImageUri: result.processedImageUri,
        processingTime: result.processingTime,
        totalTime: enhancementEndTime - enhancementStartTime,
        originalUri: image.original_url,
        uriChanged: result.processedImageUri !== image.original_url
      });
      
      // Check file sizes to verify real changes
      try {
        if (result.processedImageUri.startsWith('file://')) {
          const fileInfo = await FileSystem.getInfoAsync(result.processedImageUri);
          console.log('📄 Processed file info:', {
            uri: result.processedImageUri,
            exists: fileInfo.exists,
            size: fileInfo.size,
            modificationTime: fileInfo.modificationTime
          });
        }
      } catch (fileError) {
        console.log('⚠️ Could not get file info:', fileError);
      }

      // Assess quality improvement (with timeout)
      try {
        const qualityAssessment = createQualityAssessment();
        const qualityComparison = await qualityAssessment.compareQuality(
          image.original_url,
          result.processedImageUri,
          editingConfig
        );
        console.log('📈 Quality improvement analysis:', {
          overallImprovement: qualityComparison.overallImprovement,
          originalQuality: qualityComparison.originalQuality,
          processedQuality: qualityComparison.processedQuality,
          improvements: qualityComparison.improvements
        });

        // Complete editing session with quality metrics
        console.log('✅ Completing editing session with quality metrics...');
        await editingWorkflow.completeEditingSession(
          session.id,
          result.processingTime,
          qualityComparison.overallImprovement
        );
        console.log('✅ Editing session completed successfully');
      } catch (qualityError) {
        console.warn('⚠️ Quality assessment failed, proceeding anyway:', qualityError);
        // Complete session without quality metrics
        console.log('🔧 Completing session without quality metrics...');
        await editingWorkflow.completeEditingSession(session.id, result.processingTime, 0.5);
        console.log('✅ Session completed without quality metrics');
      }

      // Update image with processed URL
      console.log('💾 UPDATING IMAGE STATUS TO PROCESSED:', {
        imageId,
        originalUrl: image.original_url,
        processedUrl: result.processedImageUri,
        urlsAreDifferent: result.processedImageUri !== image.original_url
      });
      
      const updateResult = await updateImageStatusMutation.mutateAsync({
        imageId,
        status: 'processed',
        updates: {
          processed_url: result.processedImageUri,
        },
      });
      
      console.log('✅ Status update mutation result:', updateResult);
      console.log('🔍 Mutation result details:', {
        id: updateResult?.id,
        status: updateResult?.status,
        processed_url: updateResult?.processed_url
      });
      
      console.log('🎉 ENHANCEMENT PROCESS COMPLETED SUCCESSFULLY!');
      console.log('🔍 FINAL RESULT CHECK:', {
        originalUrl: image.original_url,
        processedUrl: result.processedImageUri,
        realChangeOccurred: result.processedImageUri !== image.original_url
      });
      
      // Force refetch to ensure UI updates with processed image
      console.log('🔄 Forcing final image data refetch after completion...');
      await refetch();
      
      // Additional verification that status was updated
      setTimeout(async () => {
        const refreshedData = await refetch();
        console.log('🔍 POST-COMPLETION STATUS CHECK:', {
          finalStatus: refreshedData.data?.status,
          hasProcessedUrl: !!refreshedData.data?.processed_url,
          processedUrl: refreshedData.data?.processed_url
        });
      }, 1000);
    } catch (error) {
      console.error('💥 ENHANCEMENT FAILED WITH ERROR:', {
        error: error.message,
        stack: error.stack,
        imageId,
        originalUrl: image?.original_url,
        hasEditingConfig: !!editingConfig,
        hasAnalysisResult: !!analysisResult
      });
      
      console.log('📋 Setting status to failed...');
      await updateImageStatusMutation.mutateAsync({
        imageId,
        status: 'failed',
      });
      console.log('❌ Status updated to failed');
    }
  };

  const retryProcessing = async () => {
    if (!imageId) return;

    Alert.alert(
      'Retry Processing',
      'This will restart the AI analysis and enhancement process.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry',
          onPress: async () => {
            try {
              await updateImageStatusMutation.mutateAsync({
                imageId,
                status: 'uploaded',
                updates: {
                  analysis_data: null,
                  processed_url: null,
                },
              });
              setAnalysisResult(null);
            } catch (error) {
              console.error('Retry failed:', error);
            }
          },
        },
      ]
    );
  };

  const viewResults = () => {
    router.push({
      pathname: '/results',
      params: { imageId },
    });
  };

  const goBack = () => {
    router.back();
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'Aesthetic': '✨',
      'Portrait': '👤',
      'Landscape': '🏞️',
      'Creative': '🎭',
      'Mood': '🎬',
      'Basic': '⚡'
    };
    return icons[category] || '🎨';
  };

  const getFilterFormula = (filterId: string): string => {
    const formulas: { [key: string]: string } = {
      // Aesthetic
      'soft-girl': 'B+35, C-15, S-25, γ=0.75, R+20, B-15',
      'baddie-vibes': 'B+8, C+45, S+40, γ=1.15, R+25, G-12',
      'cottagecore': 'B+8, C+10, S+15, γ=0.88, R+12, G+18, B-8',
      'y2k-cyber': 'B+25, C+55, S+65, γ=0.8, R-8, G+20, B+35',
      'dark-academia': 'B-12, C+22, S-15, γ=1.1, R+6, G-3',
      
      // Portrait
      'portrait-glow': 'B+15, C+12, S+8, γ=0.9, R+18, G+5, B-12',
      'skin-perfection': 'B+12, C+8, S-8, γ=0.85, R+15, G+8, B-18',
      
      // Landscape
      'nature-vivid': 'B+8, C+25, S+45, γ=0.92, R+8, G+25, B+15',
      'sky-drama': 'B+5, C+35, S+30, γ=1.05, R+12, G-5, B+28',
      
      // Creative
      'neon-glow': 'B+30, C+60, S+80, γ=0.75, R+20, G+30, B+40',
      'psychedelic': 'B+20, C+50, S+100, γ=0.8, R+30, G-15, B+35',
      
      // Mood
      'film-aesthetic': 'B-2, C+15, S-5, γ=0.95, R+10, B-12',
      'retro-vintage': 'B-8, C+20, S-25, γ=1.1, R+25, G+8, B-20',
      'dreamy-haze': 'B+25, C-20, S-15, γ=0.75, R+12, G+8, B-8',
      'noir-dramatic': 'B-25, C+65, S-60, γ=1.3, R+5, G-8, B-5',
      
      // Basic
      'natural-enhance': 'B+5, C+8, S+6, γ=0.96',
      'vibrant-pop': 'B+8, C+18, S+25, γ=0.92',
      'warm-golden': 'B+10, C+8, S+8, γ=0.88, R+15, G+5, B-10',
      'cool-crisp': 'B+3, C+15, S+8, γ=1.02, R-5, B+12'
    };
    return formulas[filterId] || 'RGB Transform';
  };

  const testRGBChanges = async () => {
    if (!image) {
      Alert.alert('Error', 'No image available to test');
      return;
    }

    try {
      console.log('🧪 Starting RGB change test...');
      const testResult = await TestRGBProcessor.testRGBChanges(
        image.processed_url || image.original_url
      );

      Alert.alert(
        'RGB Test Results 🧪',
        `Test: ${testResult.success ? 'PASSED' : 'FAILED'}\n\nOriginal Size: ${testResult.originalSize.toLocaleString()} bytes\nProcessed Size: ${testResult.processedSize.toLocaleString()} bytes\nSize Difference: ${testResult.sizeDifference.toLocaleString()} bytes\nURI Changed: ${testResult.uriChanged ? 'YES' : 'NO'}`,
        [{ text: 'Got it!', style: 'default' }]
      );
    } catch (error) {
      console.error('Test failed:', error);
      Alert.alert('Test Failed', 'RGB test encountered an error');
    }
  };

  const applyFilter = async (filterId: string, intensity: 'light' | 'medium' | 'strong' = 'medium') => {
    if (!image || !imageId) {
      Alert.alert('Error', 'No image available to apply filter');
      return;
    }

    setIsApplyingFilter(true);
    setSelectedFilter(filterId);

    try {
      console.log(`🔬 Applying PIXEL RGB filter: ${filterId} with intensity: ${intensity}`);

      // Apply the TRUE RGB mathematical modifications
      const result = await TrueRGBProcessor.applyTrueRGBFilter(
        image.processed_url || image.original_url,
        filterId,
        intensity
      );

      console.log('✅ PIXEL RGB transformation applied:', {
        uri: result.uri,
        width: result.width,
        height: result.height,
        rgbTransformations: result.rgbTransformations,
        pixelsModified: result.pixelsModified,
        averageColorChange: result.averageColorChange,
        verified: result.verified
      });

      // Update the image with the new filtered version
      await updateImageStatusMutation.mutateAsync({
        imageId,
        status: 'processed',
        updates: {
          processed_url: result.uri,
        },
      });

      console.log('🎉 PIXEL RGB transformation completed!');
      Alert.alert(
        'Mathematical RGB Applied! 🧮',
        `${filterId.toUpperCase()} applied mathematical RGB formulas!\n\n🔬 RGB Transformations:\n${result.rgbTransformations.join('\n')}\n\n📊 Pixels Modified: ${result.pixelsModified.toLocaleString()}\n🧮 Avg Color Change: ${result.averageColorChange.toFixed(1)}\n✅ File Changed: ${result.verified ? 'YES' : 'NO'}`,
        [{ text: 'Success!', style: 'default' }]
      );

      // Refresh the image data
      await refetch();

    } catch (error) {
      console.error('❌ Filter application failed:', error);
      Alert.alert(
        'Filter Failed',
        `Failed to apply ${filterId} filter. Please try again.`,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsApplyingFilter(false);
      setSelectedFilter(null);
    }
  };

  if (isLoading || !image) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Processing</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Preview */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image.processed_url || image.original_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          {image.processed_url && (
            <View style={styles.enhancedBadge}>
              <Text style={styles.enhancedText}>ENHANCED</Text>
            </View>
          )}
          <View style={styles.imageOverlay}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {image.status?.toUpperCase() || 'UNKNOWN'}
              </Text>
            </View>
          </View>
        </View>

        {/* Processing Progress */}
        <ProcessingProgress
          steps={steps}
          currentStep={image.status || undefined}
          showDetails={true}
        />

        {/* Filter Options - Show immediately for testing RGB math */}
        {image && (
          <View style={styles.filterOptionsContainer}>
            <Text style={styles.sectionTitle}>🔬 Pixel RGB Filters</Text>
            <Text style={styles.filterSubtitle}>
              These filters modify individual RGB pixel values with mathematical precision!
            </Text>
            <Text style={styles.rgbMathExplainer}>
              🧮 Each filter processes every pixel and modifies RGB values directly
            </Text>

            {/* Test RGB Changes Button */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={testRGBChanges}
            >
              <Text style={styles.testButtonText}>
                🧪 Test RGB Changes
              </Text>
            </TouchableOpacity>
            
            {/* True RGB Mathematical Filters */}
            <View style={styles.filterGrid}>
              {TrueRGBProcessor.getTrueRGBFilters().map((filter) => (
                <View key={filter.id} style={styles.filterOptionCard}>
                  <View style={styles.filterOptionHeader}>
                    <Text style={styles.filterOptionIcon}>{filter.icon}</Text>
                    <Text style={styles.filterOptionName}>{filter.name}</Text>
                  </View>
                  
                  <Text style={styles.filterOptionDescription}>{filter.description}</Text>
                  
                  <View style={styles.rgbFormulaDisplay}>
                    <Text style={styles.rgbFormulaText}>
                      {filter.formula}
                    </Text>
                  </View>
                  
                  <View style={styles.intensityButtons}>
                    <TouchableOpacity
                      style={[
                        styles.intensityButton,
                        styles.lightIntensity,
                        isApplyingFilter && selectedFilter === filter.id && styles.disabledButton
                      ]}
                      onPress={() => applyFilter(filter.id, 'light')}
                      disabled={isApplyingFilter}
                    >
                      <Text style={[styles.intensityButtonText, styles.lightText]}>
                        {isApplyingFilter && selectedFilter === filter.id ? '⏳' : 'Light'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.intensityButton,
                        styles.mediumIntensity,
                        isApplyingFilter && selectedFilter === filter.id && styles.disabledButton
                      ]}
                      onPress={() => applyFilter(filter.id, 'medium')}
                      disabled={isApplyingFilter}
                    >
                      <Text style={[styles.intensityButtonText, styles.mediumText]}>
                        {isApplyingFilter && selectedFilter === filter.id ? '⏳' : 'Medium'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.intensityButton,
                        styles.strongIntensity,
                        isApplyingFilter && selectedFilter === filter.id && styles.disabledButton
                      ]}
                      onPress={() => applyFilter(filter.id, 'strong')}
                      disabled={isApplyingFilter}
                    >
                      <Text style={[styles.intensityButtonText, styles.strongText]}>
                        {isApplyingFilter && selectedFilter === filter.id ? '⏳' : 'Strong'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            
            <View style={styles.filterNote}>
              <Text style={styles.filterNoteText}>
                🔬 All filters process every single pixel and modify RGB values directly!
              </Text>
            </View>
          </View>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <View style={styles.analysisContainer}>
            <Text style={styles.sectionTitle}>Analysis Results</Text>
            
            <View style={styles.analysisGrid}>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Image Type</Text>
                <Text style={styles.analysisValue}>
                  {analysisResult.imageType} ({Math.round(analysisResult.confidence * 100)}%)
                </Text>
              </View>
              
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Overall Quality</Text>
                <Text style={styles.analysisValue}>
                  {Math.round(analysisResult.technicalQuality.overall * 100)}%
                </Text>
              </View>
              
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Mood</Text>
                <Text style={styles.analysisValue}>{analysisResult.mood}</Text>
              </View>
              
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Enhancement Level</Text>
                <Text style={styles.analysisValue}>{analysisResult.editingIntensity}</Text>
              </View>
            </View>

            {analysisResult.detectedObjects.length > 0 && (
              <View style={styles.objectsContainer}>
                <Text style={styles.analysisLabel}>Detected Objects</Text>
                <View style={styles.objectTags}>
                  {analysisResult.detectedObjects.map((object, index) => (
                    <View key={index} style={styles.objectTag}>
                      <Text style={styles.objectTagText}>{object}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* AI-Selected GenZ Aesthetic */}
            {rgbEditingEngine && analysisResult && (
              <View style={styles.objectsContainer}>
                <Text style={styles.analysisLabel}>AI-Selected GenZ Aesthetic 🔥</Text>
                <View style={styles.aestheticContainer}>
                  <View style={styles.aestheticInfo}>
                    <Text style={styles.aestheticName}>
                      {analysisResult.imageType === 'portrait' && analysisResult.mood === 'neutral' ? 'Soft Girl 🌸' :
                       analysisResult.imageType === 'portrait' && (analysisResult.mood === 'bold' || analysisResult.mood === 'confident') ? 'Baddie Vibes 💋' :
                       analysisResult.imageType === 'landscape' ? 'Cottagecore 🌿' :
                       analysisResult.mood === 'vintage' || analysisResult.mood === 'nostalgic' ? 'Film Aesthetic 📸' :
                       analysisResult.mood === 'dark' || analysisResult.mood === 'moody' ? 'Dark Academia 📚' :
                       'Indie Kid 🎨'}
                    </Text>
                    <Text style={styles.aestheticVibe}>
                      {analysisResult.imageType === 'portrait' && analysisResult.mood === 'neutral' ? 'dreamy, ethereal, pastel' :
                       analysisResult.imageType === 'portrait' && (analysisResult.mood === 'bold' || analysisResult.mood === 'confident') ? 'bold, confident, sharp' :
                       analysisResult.imageType === 'landscape' ? 'natural, warm, earthy' :
                       analysisResult.mood === 'vintage' || analysisResult.mood === 'nostalgic' ? 'vintage, cinematic, nostalgic' :
                       analysisResult.mood === 'dark' || analysisResult.mood === 'moody' ? 'moody, intellectual, vintage' :
                       'artistic, unique, colorful'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.analysisLabel}>Mathematical RGB Transformations</Text>
                <View style={styles.mathContainer}>
                  {/* Dynamic formula based on selected aesthetic */}
                  <View style={styles.mathFunction}>
                    <Text style={styles.mathLabel}>Aesthetic Formula:</Text>
                    <Text style={styles.mathFormula}>
                      {analysisResult.imageType === 'portrait' && analysisResult.mood === 'neutral' ? 
                        'Soft = Bright(RGB+64) × LowContrast(0.85) × Desaturate(0.8) × Warm(R+15,B-10)' :
                       analysisResult.imageType === 'portrait' && (analysisResult.mood === 'bold' || analysisResult.mood === 'confident') ? 
                        'Baddie = Drama(RGB+13) × MaxContrast(1.5) × Bold(1.4) × Red(R+30,G-10)' :
                       analysisResult.imageType === 'landscape' ? 
                        'Cottage = Natural(RGB+26) × Gentle(1.15) × Rich(1.25) × Earthy(R+20,G+30,B-15)' :
                       analysisResult.mood === 'vintage' || analysisResult.mood === 'nostalgic' ? 
                        'Film = Vintage(RGB-13) × FilmContrast(1.25) × Faded(0.9) × Warm(R+15,B-20)' :
                       analysisResult.mood === 'dark' || analysisResult.mood === 'moody' ? 
                        'Academia = Dark(RGB-51) × HighContrast(1.35) × Desaturate(0.7) × Sepia(R+10,G-5)' :
                        'Indie = Creative(RGB+51) × Artistic(1.3) × Colorful(1.35) × Rainbow(R+10,G+20,B+15)'}
                    </Text>
                  </View>

                  {/* Brightness Function */}
                  <View style={styles.mathFunction}>
                    <Text style={styles.mathLabel}>Brightness:</Text>
                    <Text style={styles.mathFormula}>
                      newRGB = clamp(RGB + {analysisResult.technicalQuality.exposure < 0.3 ? '+25' : 
                                           analysisResult.technicalQuality.exposure > 0.8 ? '-5' : '+10'})
                    </Text>
                  </View>

                  {/* Gamma Correction Function */}
                  <View style={styles.mathFunction}>
                    <Text style={styles.mathLabel}>Gamma (GenZ curve):</Text>
                    <Text style={styles.mathFormula}>
                      newRGB = 255 × (RGB/255)^(1/{analysisResult.technicalQuality.exposure < 0.3 ? '0.8' : 
                                                   analysisResult.technicalQuality.exposure > 0.8 ? '1.1' : '0.95'})
                    </Text>
                  </View>

                  {/* Aesthetic-specific adjustments */}
                  {analysisResult.imageType === 'portrait' && (
                    <View style={styles.mathFunction}>
                      <Text style={styles.mathLabel}>Portrait Enhancement:</Text>
                      <Text style={styles.mathFormula}>
                        {analysisResult.mood === 'neutral' ? 'R × 1.08, G × 1.0, B × 0.92 (Soft Girl warmth)' :
                         'R × 1.15, G × 0.95, B × 1.03 (Baddie drama)'}
                      </Text>
                    </View>
                  )}

                  {analysisResult.imageType === 'landscape' && (
                    <View style={styles.mathFunction}>
                      <Text style={styles.mathLabel}>Nature Enhancement:</Text>
                      <Text style={styles.mathFormula}>R × 1.2, G × 1.3, B × 0.85 (Cottagecore earthiness)</Text>
                    </View>
                  )}

                  {/* Saturation formula */}
                  <View style={styles.mathFunction}>
                    <Text style={styles.mathLabel}>Saturation (trendy levels):</Text>
                    <Text style={styles.mathFormula}>
                      {analysisResult.imageType === 'portrait' && analysisResult.mood === 'neutral' ? 'Desaturate by 20% (soft aesthetic)' :
                       analysisResult.imageType === 'portrait' && (analysisResult.mood === 'bold' || analysisResult.mood === 'confident') ? 'Enhance by 40% (bold aesthetic)' :
                       analysisResult.imageType === 'landscape' ? 'Enhance by 25% (rich natural colors)' :
                       'Enhance by 15% (balanced aesthetic)'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Smart Filter Recommendations */}
            {analysisResult && (
              <View style={styles.objectsContainer}>
                <Text style={styles.analysisLabel}>🎯 Smart Filter Recommendations</Text>
                <Text style={styles.filterSubtitle}>
                  Personalized filters based on your image analysis
                </Text>
                
                <View style={styles.smartFiltersContainer}>
                  {SmartFilterRecommender.recommendFilters(analysisResult).slice(0, 6).map((filter, index) => (
                    <View key={filter.id} style={styles.smartFilterCard}>
                      <View style={styles.filterHeader}>
                        <Text style={styles.filterIcon}>{filter.icon}</Text>
                        <View style={styles.filterInfo}>
                          <Text style={styles.filterName}>{filter.name}</Text>
                          <Text style={styles.filterCategory}>{filter.category.toUpperCase()}</Text>
                        </View>
                        <View style={styles.suitabilityBadge}>
                          <Text style={styles.suitabilityScore}>{filter.suitabilityScore}%</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.filterDescription}>{filter.description}</Text>
                      <Text style={styles.filterReason}>💡 {filter.reason}</Text>
                      
                      <View style={styles.filterPreview}>
                        <Text style={styles.previewLabel}>Preview:</Text>
                        <Text style={styles.previewText}>{filter.preview}</Text>
                      </View>

                      <View style={styles.rgbFormula}>
                        <Text style={styles.formulaLabel}>RGB Formula:</Text>
                        <Text style={styles.formulaText}>
                          {Object.entries(filter.rgbOptions).map(([key, value]) => 
                            value !== undefined ? `${key}: ${value > 0 ? '+' : ''}${value}` : null
                          ).filter(Boolean).join(', ')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.filterCategoriesContainer}>
                  <Text style={styles.analysisLabel}>📂 Filter Categories</Text>
                  <View style={styles.categoryTags}>
                    {['aesthetic', 'correction', 'creative', 'mood'].map((category) => {
                      const categoryFilters = SmartFilterRecommender.getFiltersByCategory(category, analysisResult);
                      const count = categoryFilters.length;
                      return (
                        <View key={category} style={[styles.categoryTag, styles[`category${category.charAt(0).toUpperCase() + category.slice(1)}`]]}>
                          <Text style={styles.categoryTagText}>
                            {category.toUpperCase()} ({count})
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Subject-based recommendations */}
                {analysisResult.detectedObjects && analysisResult.detectedObjects.length > 0 && (
                  <View style={styles.subjectFiltersContainer}>
                    <Text style={styles.analysisLabel}>🏷️ Perfect for Your Content</Text>
                    <View style={styles.subjectTags}>
                      {analysisResult.detectedObjects.slice(0, 4).map((subject, index) => {
                        const subjectFilters = SmartFilterRecommender.getFiltersForSubjects([subject], analysisResult);
                        return (
                          <View key={index} style={styles.subjectTag}>
                            <Text style={styles.subjectTagText}>
                              {subject}: {subjectFilters.length} filters
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Original AI Filter Suggestions */}
            {enhancementEngine && (
              <View style={styles.objectsContainer}>
                <Text style={styles.analysisLabel}>🎨 Additional Filter Options</Text>
                <View style={styles.objectTags}>
                  {enhancementEngine.realFilters.generateFilterSuggestions(
                    analysisResult.imageType,
                    analysisResult.mood,
                    analysisResult.technicalQuality
                  ).map((filterName, index) => (
                    <View key={index} style={[styles.objectTag, styles.filterTag]}>
                      <Text style={[styles.objectTagText, styles.filterTagText]}>{filterName}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {image.status === 'failed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.retryButton]}
              onPress={retryProcessing}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.actionButtonText}>Retry Processing</Text>
            </TouchableOpacity>
          )}
          
          {image.status === 'processed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.viewResultsButton]}
              onPress={viewResults}
            >
              <Ionicons name="eye" size={20} color="white" />
              <Text style={styles.actionButtonText}>View Results</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  imageContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 300,
  },
  enhancedBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  enhancedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  imageOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  statusBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  analysisContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  analysisItem: {
    flex: 1,
    minWidth: '45%',
  },
  analysisLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  objectsContainer: {
    marginTop: 20,
  },
  objectTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  objectTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  objectTagText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  filterTag: {
    backgroundColor: '#007AFF',
  },
  filterTagText: {
    color: '#FFFFFF',
  },
  mathContainer: {
    marginTop: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  mathFunction: {
    marginBottom: 12,
    lastChild: {
      marginBottom: 0,
    },
  },
  mathLabel: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  mathFormula: {
    fontSize: 12,
    color: '#1C1C1E',
    fontFamily: 'Courier New',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  aestheticContainer: {
    backgroundColor: '#6366F1', // Modern purple gradient color
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  aestheticInfo: {
    alignItems: 'center',
  },
  aestheticName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  aestheticVibe: {
    fontSize: 14,
    color: '#E8E8E8',
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  filterSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  rgbMathExplainer: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: '#F0F8FF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  rgbFormulaDisplay: {
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
    padding: 6,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  rgbFormulaText: {
    fontSize: 10,
    color: '#856404',
    fontFamily: 'monospace',
    textAlign: 'center',
    fontWeight: '600',
  },
  filterCategoryContainer: {
    marginBottom: 24,
  },
  filterCategoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'left',
    paddingLeft: 4,
  },
  testButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  smartFiltersContainer: {
    gap: 12,
    marginBottom: 20,
  },
  smartFilterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  filterInfo: {
    flex: 1,
  },
  filterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  filterCategory: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  suitabilityBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  suitabilityScore: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterDescription: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 6,
    lineHeight: 18,
  },
  filterReason: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  filterPreview: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginRight: 6,
  },
  previewText: {
    fontSize: 12,
    color: '#1C1C1E',
    flex: 1,
  },
  rgbFormula: {
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    padding: 8,
  },
  formulaLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  formulaText: {
    fontSize: 11,
    color: '#1C1C1E',
    fontFamily: 'Courier New',
  },
  filterCategoriesContainer: {
    marginBottom: 16,
  },
  categoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryAesthetic: {
    backgroundColor: '#FF9500',
  },
  categoryCorrection: {
    backgroundColor: '#34C759',
  },
  categoryCreative: {
    backgroundColor: '#AF52DE',
  },
  categoryMood: {
    backgroundColor: '#007AFF',
  },
  categoryTagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  subjectFiltersContainer: {
    marginTop: 16,
  },
  subjectTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  subjectTag: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  subjectTagText: {
    fontSize: 12,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  filterOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterGrid: {
    gap: 16,
    marginBottom: 16,
  },
  filterOptionCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  filterOptionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  filterOptionDescription: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 12,
    lineHeight: 18,
  },
  intensityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightIntensity: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  mediumIntensity: {
    backgroundColor: '#FF9500',
  },
  strongIntensity: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    opacity: 0.6,
  },
  intensityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lightText: {
    color: '#2196F3',
  },
  mediumText: {
    color: '#FFFFFF',
  },
  strongText: {
    color: '#FFFFFF',
  },
  filterNote: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  filterNoteText: {
    fontSize: 13,
    color: '#1C1C1E',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#FF9500',
  },
  viewResultsButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});