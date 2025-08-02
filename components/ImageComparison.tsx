import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  clamp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ImageComparisonProps {
  originalUrl: string;
  processedUrl: string;
  containerStyle?: any;
}

export default function ImageComparison({
  originalUrl,
  processedUrl,
  containerStyle,
}: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const translateX = useSharedValue(0);
  const containerWidth = width - 32; // Account for margins

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startX: number }>({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      const newTranslateX = clamp(
        context.startX + event.translationX,
        -containerWidth / 2,
        containerWidth / 2
      );
      translateX.value = newTranslateX;
      
      // Convert to percentage for UI updates
      const percentage = ((newTranslateX + containerWidth / 2) / containerWidth) * 100;
      runOnJS(setSliderPosition)(Math.round(percentage));
    },
  });

  const sliderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const maskStyle = useAnimatedStyle(() => {
    return {
      width: (translateX.value + containerWidth / 2),
    };
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Labels */}
      <View style={styles.labelContainer}>
        <View style={styles.label}>
          <Text style={styles.labelText}>Original</Text>
        </View>
        <View style={styles.sliderPercentage}>
          <Text style={styles.percentageText}>{sliderPosition}%</Text>
        </View>
        <View style={styles.label}>
          <Text style={styles.labelText}>Enhanced</Text>
        </View>
      </View>

      {/* Image Comparison */}
      <View style={styles.imageContainer}>
        {/* Base Image (Processed) */}
        <Image
          source={{ uri: processedUrl }}
          style={styles.baseImage}
          contentFit="cover"
          transition={200}
        />

        {/* Overlay Image (Original) with Mask */}
        <Animated.View style={[styles.overlayContainer, maskStyle]}>
          <Image
            source={{ uri: originalUrl }}
            style={styles.overlayImage}
            contentFit="cover"
            transition={200}
          />
        </Animated.View>

        {/* Slider Line */}
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.sliderContainer, sliderStyle]}>
            <View style={styles.sliderLine} />
            <View style={styles.sliderHandle}>
              <Ionicons name="swap-horizontal" size={20} color="white" />
            </View>
            <View style={styles.sliderLine} />
          </Animated.View>
        </PanGestureHandler>

        {/* Side Labels */}
        <View style={styles.sideLabels}>
          <View style={styles.sideLabel}>
            <Text style={styles.sideLabelText}>BEFORE</Text>
          </View>
          <View style={styles.sideLabel}>
            <Text style={styles.sideLabelText}>AFTER</Text>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionContainer}>
        <Ionicons name="finger-print" size={16} color="#8E8E93" />
        <Text style={styles.instructionText}>
          Drag the slider to compare before and after
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  label: {
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  sliderPercentage: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  imageContainer: {
    position: 'relative',
    minHeight: 300,
    maxHeight: 500,
    backgroundColor: '#F2F2F7',
  },
  baseImage: {
    width: '100%',
    height: '100%',
    minHeight: 300,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    overflow: 'hidden',
  },
  overlayImage: {
    width: width - 32, // Full container width
    height: '100%',
    minHeight: 300,
  },
  sliderContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    marginLeft: -2, // Half of slider width
    width: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderHandle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sideLabels: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sideLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sideLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
});