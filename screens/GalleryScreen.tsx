import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useSupabase } from '../hooks/useSupabase';
import { useUserImagesQuery, useCreateImageMutation } from '../hooks/queries/useImages';
import { ImageService } from '../services/imageService';
import { createGeminiService } from '../services/geminiService';
import ImageGrid from '../components/ImageGrid';
import type { Image } from '../lib/database/queries/images';

type FilterType = 'all' | 'uploaded' | 'analyzed' | 'processed' | 'failed';

export default function GalleryScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [uploading, setUploading] = useState(false);
  
  const { user } = useAuth();
  const supabase = useSupabase();
  const createImageMutation = useCreateImageMutation();
  
  const {
    data: images = [],
    isLoading,
    refetch,
    isRefetching,
  } = useUserImagesQuery(user?.id || '', {
    enabled: !!user?.id,
  });

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const filteredImages = images.filter(image => {
    if (filter === 'all') return true;
    return image.status === filter;
  });

  const filterOptions = [
    { key: 'all', label: 'All', count: images.length },
    { key: 'uploaded', label: 'New', count: images.filter(img => img.status === 'uploaded').length },
    { key: 'analyzed', label: 'Analyzed', count: images.filter(img => img.status === 'analyzed').length },
    { key: 'processed', label: 'Processed', count: images.filter(img => img.status === 'processed').length },
    { key: 'failed', label: 'Failed', count: images.filter(img => img.status === 'failed').length },
  ];

  const openCamera = () => {
    router.push('/camera');
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0] && user) {
        setUploading(true);
        await processPickedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker failed:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setUploading(false);
    }
  };

  const processPickedImage = async (imageUri: string) => {
    if (!user) return;

    try {
      const imageService = new ImageService(supabase);
      const geminiService = createGeminiService();

      // Test connection first
      const connectionOk = await imageService.testConnection();
      if (!connectionOk) {
        throw new Error('Unable to connect to storage service');
      }

      // Upload image (use .jpeg extension for proper MIME type)
      const uploadResult = await imageService.uploadImage(
        imageUri,
        user.id,
        `gallery_${Date.now()}.jpeg`
      );

      // Create image record
      const imageRecord = await createImageMutation.mutateAsync({
        user_id: user.id,
        original_url: uploadResult.publicUrl,
        status: 'uploaded',
        analysis_data: null,
        processed_url: null,
      });

      Alert.alert(
        'Image Uploaded!',
        'Your image is being processed. You can view the progress below.',
        [{ text: 'OK' }]
      );

      // Start background processing
      processImageInBackground(imageUri, imageRecord.id, imageService, geminiService);

    } catch (error) {
      console.error('Image upload failed:', error);
      Alert.alert('Upload Failed', 'Unable to upload image. Please try again.');
    }
  };

  const processImageInBackground = async (
    imageUri: string,
    imageId: string,
    imageService: ImageService,
    geminiService: any
  ) => {
    try {
      // Update status to analyzing
      await imageService.updateImageStatus(imageId, 'analyzing');

      // Convert to base64 for analysis
      const base64 = await imageService.imageToBase64(imageUri);
      
      // Analyze with Gemini
      const analysis = await geminiService.analyzeImage(base64);

      // Update with analysis results
      await imageService.updateImageStatus(imageId, 'analyzed', {
        analysis_data: analysis,
      });

      console.log('Image processed successfully:', imageId);

    } catch (error) {
      console.error('Background processing failed:', error);
      await imageService.updateImageStatus(imageId, 'failed');
    }
  };

  const handleImagePress = (image: Image) => {
    router.push({
      pathname: '/processing',
      params: { imageId: image.id },
    });
  };

  const renderFilterButton = (option: any) => (
    <TouchableOpacity
      key={option.key}
      style={[
        styles.filterButton,
        filter === option.key && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(option.key)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === option.key && styles.filterButtonTextActive,
        ]}
      >
        {option.label}
        {option.count > 0 && (
          <Text style={styles.filterCount}> ({option.count})</Text>
        )}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Gallery</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Ionicons name="image" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={openCamera}
          >
            <Ionicons name="camera" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <View style={styles.filterScrollView}>
          {filterOptions.map(renderFilterButton)}
        </View>
      </View>

      {/* Image Grid */}
      <ImageGrid
        images={filteredImages}
        loading={isLoading}
        onImagePress={handleImagePress}
        onRefresh={refetch}
        refreshing={isRefetching}
        emptyMessage={
          filter === 'all' 
            ? 'No images yet' 
            : `No ${filter} images`
        }
      />

      {/* Upload indicator */}
      {uploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingContainer}>
            <Text style={styles.uploadingText}>Uploading image...</Text>
          </View>
        </View>
      )}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterScrollView: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterCount: {
    fontSize: 12,
    fontWeight: '400',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  uploadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});