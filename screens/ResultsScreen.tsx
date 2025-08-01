import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useImageQuery } from '../hooks/queries/useImages';
import ImageComparison from '../components/ImageComparison';
import type { ImageAnalysisResult } from '../services/geminiService';

export default function ResultsScreen() {
  const { imageId } = useLocalSearchParams<{ imageId: string }>();
  const [showComparison, setShowComparison] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    data: image,
    isLoading,
  } = useImageQuery(imageId!, {
    enabled: !!imageId,
  });

  const analysisResult: ImageAnalysisResult | null = React.useMemo(() => {
    if (!image?.analysis_data) return null;
    
    try {
      return typeof image.analysis_data === 'string' 
        ? JSON.parse(image.analysis_data)
        : image.analysis_data;
    } catch (error) {
      console.error('Failed to parse analysis data:', error);
      return null;
    }
  }, [image?.analysis_data]);

  const saveToGallery = async () => {
    if (!image?.processed_url) {
      Alert.alert('Error', 'No processed image available to save');
      return;
    }

    try {
      setSaving(true);

      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save to your photo library');
        return;
      }

      // Download the image
      const downloadResult = await FileSystem.downloadAsync(
        image.processed_url,
        FileSystem.documentDirectory + `processed_${Date.now()}.jpg`
      );

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);

      Alert.alert(
        'Success!',
        'Enhanced image saved to your photo library',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Save Failed', 'Unable to save image to gallery');
    } finally {
      setSaving(false);
    }
  };

  const shareImage = async () => {
    if (!image?.processed_url) {
      Alert.alert('Error', 'No processed image available to share');
      return;
    }

    try {
      const result = await Share.share({
        url: image.processed_url,
        message: 'Enhanced with AI Image Editor',
      });

      if (result.action === Share.sharedAction) {
        console.log('Image shared successfully');
      }
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert('Share Failed', 'Unable to share image');
    }
  };

  const goBack = () => {
    router.back();
  };

  const goToGallery = () => {
    router.push('/gallery');
  };

  if (isLoading || !image) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (image.status !== 'processed' || !image.processed_url) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#FF9500" />
          <Text style={styles.errorTitle}>Processing Not Complete</Text>
          <Text style={styles.errorMessage}>
            This image hasn't finished processing yet. Please check back later.
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={goBack}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enhanced Result</Text>
        <TouchableOpacity style={styles.headerButton} onPress={shareImage}>
          <Ionicons name="share" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Toggle View */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, showComparison && styles.toggleButtonActive]}
            onPress={() => setShowComparison(true)}
          >
            <Text style={[styles.toggleText, showComparison && styles.toggleTextActive]}>
              Before & After
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !showComparison && styles.toggleButtonActive]}
            onPress={() => setShowComparison(false)}
          >
            <Text style={[styles.toggleText, !showComparison && styles.toggleTextActive]}>
              Enhanced Only
            </Text>
          </TouchableOpacity>
        </View>

        {/* Image Display */}
        {showComparison ? (
          <ImageComparison
            originalUrl={image.original_url}
            processedUrl={image.processed_url}
          />
        ) : (
          <View style={styles.singleImageContainer}>
            <Image
              source={{ uri: image.processed_url }}
              style={styles.singleImage}
              contentFit="cover"
              transition={200}
            />
          </View>
        )}

        {/* Analysis Summary */}
        {analysisResult && (
          <View style={styles.analysisContainer}>
            <Text style={styles.sectionTitle}>Enhancement Summary</Text>
            
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Ionicons name="star" size={20} color="#FF9500" />
                <Text style={styles.summaryLabel}>Quality Score</Text>
                <Text style={styles.summaryValue}>
                  {Math.round(analysisResult.technicalQuality.overall * 100)}%
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Ionicons name="color-palette" size={20} color="#34C759" />
                <Text style={styles.summaryLabel}>Enhancement</Text>
                <Text style={styles.summaryValue}>{analysisResult.editingIntensity}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Ionicons name="happy" size={20} color="#007AFF" />
                <Text style={styles.summaryLabel}>Mood</Text>
                <Text style={styles.summaryValue}>{analysisResult.mood}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Ionicons name="camera" size={20} color="#8E8E93" />
                <Text style={styles.summaryLabel}>Type</Text>
                <Text style={styles.summaryValue}>{analysisResult.imageType}</Text>
              </View>
            </View>

            {analysisResult.detectedObjects.length > 0 && (
              <View style={styles.objectsSection}>
                <Text style={styles.objectsTitle}>Enhanced Elements</Text>
                <View style={styles.objectTags}>
                  {analysisResult.detectedObjects.slice(0, 6).map((object, index) => (
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
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={saveToGallery}
            disabled={saving}
          >
            <Ionicons name="download" size={20} color="white" />
            <Text style={styles.actionButtonText}>
              {saving ? 'Saving...' : 'Save to Gallery'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.galleryButton]}
            onPress={goToGallery}
          >
            <Ionicons name="images" size={20} color="white" />
            <Text style={styles.actionButtonText}>View All Images</Text>
          </TouchableOpacity>
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
  headerButton: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  singleImageContainer: {
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
  singleImage: {
    width: '100%',
    aspectRatio: 1,
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '700',
  },
  objectsSection: {
    marginTop: 20,
  },
  objectsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  objectTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    paddingBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  galleryButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});