import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useSupabase } from '../hooks/useSupabase';
import { useCreateImageMutation } from '../hooks/queries/useImages';
import { ImageService } from '../services/imageService';
import { createGeminiService } from '../services/geminiService';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  
  const { user } = useAuth();
  const supabase = useSupabase();
  const createImageMutation = useCreateImageMutation();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const takePicture = async () => {
    if (!cameraRef.current || !user) return;

    try {
      setIsCapturing(true);
      
      // Capture image
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (!photo) {
        throw new Error('Failed to capture image');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Initialize services
      const imageService = new ImageService(supabase);
      const geminiService = createGeminiService();

      // Test connection first
      const connectionOk = await imageService.testConnection();
      if (!connectionOk) {
        throw new Error('Unable to connect to storage service');
      }

      // Upload image (use .jpeg extension for proper MIME type)
      const uploadResult = await imageService.uploadImage(
        photo.uri,
        user.id,
        `camera_${Date.now()}.jpeg`
      );

      // Create image record with initial status
      const imageRecord = await createImageMutation.mutateAsync({
        user_id: user.id,
        original_url: uploadResult.publicUrl,
        status: 'uploaded',
        analysis_data: null,
        processed_url: null,
      });

      Alert.alert(
        'Photo Captured!',
        'Your image is being processed. You can view the progress in the Gallery.',
        [
          {
            text: 'View Gallery',
            onPress: () => router.push('/gallery'),
          },
          {
            text: 'Take Another',
            style: 'cancel',
          },
        ]
      );

      // Start background processing
      processImageInBackground(photo.uri, imageRecord.id, imageService, geminiService);

    } catch (error) {
      console.error('Camera capture failed:', error);
      Alert.alert(
        'Capture Failed',
        'Unable to capture image. Please try again.',
        [{ text: 'OK' }]
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsCapturing(false);
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

      // TODO: Trigger editing pipeline here
      console.log('Image processed successfully:', imageId);

    } catch (error) {
      console.error('Background processing failed:', error);
      await imageService.updateImageStatus(imageId, 'failed');
    }
  };

  const goBack = () => {
    router.back();
  };

  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
      
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      />
      
      {/* Header - positioned absolutely over camera */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={goBack}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>AI Camera</Text>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={toggleFlash}
        >
          <Ionicons 
            name={flash === 'on' ? 'flash' : 'flash-off'} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      {/* Camera Controls - positioned absolutely over camera */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => router.push('/gallery')}
        >
          <Ionicons name="images" size={24} color="white" />
          <Text style={styles.controlText}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, isCapturing && styles.capturingButton]}
          onPress={takePicture}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator color="white" size="large" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleCameraFacing}
        >
          <Ionicons name="camera-reverse" size={24} color="white" />
          <Text style={styles.controlText}>Flip</Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  capturingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
});