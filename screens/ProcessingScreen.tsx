import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useImageQuery, useUpdateImageStatusMutation } from '../hooks/queries/useImages';
import { useSupabase } from '../hooks/useSupabase';
import { ImageService } from '../services/imageService';
import { createGeminiService } from '../services/geminiService';
import ProcessingProgress from '../components/ProcessingProgress';
import type { ImageAnalysisResult } from '../services/geminiService';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  description?: string;
}

export default function ProcessingScreen() {
  const { imageId } = useLocalSearchParams<{ imageId: string }>();
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  
  const supabase = useSupabase();
  const updateImageStatusMutation = useUpdateImageStatusMutation();
  
  const {
    data: image,
    isLoading,
    refetch,
  } = useImageQuery(imageId!, {
    enabled: !!imageId,
    refetchInterval: 2000, // Refetch every 2 seconds during processing
  });

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
        id: 'processing',
        label: 'Enhancement',
        status: image.status === 'processing' ? 'active' :
               image.status === 'processed' ? 'completed' : 'pending',
        description: 'Applying AI-powered enhancements',
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
        setAnalysisResult(parsed);
      } catch (error) {
        console.error('Failed to parse analysis data:', error);
      }
    }
  }, [image]);

  // Auto-trigger next processing step
  useEffect(() => {
    if (!image || !imageId) return;

    const triggerNextStep = async () => {
      const imageService = new ImageService(supabase);
      
      try {
        if (image.status === 'uploaded') {
          // Start analysis
          await startAnalysis(imageService);
        } else if (image.status === 'analyzed' && !image.processed_url) {
          // Start enhancement (mock for now)
          await startEnhancement(imageService);
        }
      } catch (error) {
        console.error('Auto-processing failed:', error);
        await imageService.updateImageStatus(imageId, 'failed');
      }
    };

    triggerNextStep();
  }, [image?.status, imageId, supabase]);

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

  const startEnhancement = async (imageService: ImageService) => {
    if (!image || !imageId) return;

    try {
      await updateImageStatusMutation.mutateAsync({
        imageId,
        status: 'processing',
      });

      // Mock enhancement process (replace with actual editing engine)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // For now, use original URL as processed URL
      await updateImageStatusMutation.mutateAsync({
        imageId,
        status: 'processed',
        updates: {
          processed_url: image.original_url,
        },
      });
    } catch (error) {
      console.error('Enhancement failed:', error);
      await updateImageStatusMutation.mutateAsync({
        imageId,
        status: 'failed',
      });
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      {/* Header */}
      <View style={styles.header}>
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
            source={{ uri: image.original_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
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
    aspectRatio: 1,
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