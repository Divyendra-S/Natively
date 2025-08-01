import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useEffect, useRef, useState } from 'react';


interface LandingScreenProps {
  onSignUp: () => void;
  onSignIn: () => void;
}


interface CarouselSlide {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const carouselData: CarouselSlide[] = [
  {
    id: 1,
    icon: 'mic',
    title: 'Effortless{\'\\n\'}control with{\'\\n\'}Syncra',
    description: 'At Syncra, we believe in the power of voice{\'\\n\'}to transform the way you work'
  },
  {
    id: 2,
    icon: 'mic',
    title: 'Smart{\'\\n\'}conversations{\'\\n\'}anywhere',
    description: 'Have natural conversations with AI{\'\\n\'}that understands your context'
  },
  {
    id: 3,
    icon: 'mic',
    title: 'Lightning{\'\\n\'}fast{\'\\n\'}responses',
    description: 'Get instant answers and solutions{\'\\n\'}to boost your productivity'
  },
  {
    id: 4,
    icon: 'mic',
    title: 'Secure &{\'\\n\'}private{\'\\n\'}by design',
    description: 'Your conversations stay private{\'\\n\'}with enterprise-grade security'
  }
];

export function LandingScreen({ onSignUp, onSignIn }: LandingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Animation values for text transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  // Animation values for smooth wave - more points for fluid motion
  const wavePoints = Array.from({ length: 15 }, (_, i) => 
    useRef(new Animated.Value(Math.sin(i * 0.4) * 0.5 + 0.5)).current
  );

  // Function to animate text transition
  const animateTextTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      translateY.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  useEffect(() => {
    const createSmoothWaveAnimation = (animValue: Animated.Value) => {
      return Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        })
      );
    };

    // Create smooth wave animations with phase shifts
    const animations = wavePoints.map((point) => {
      // Reset and start with phase offset
      point.setValue(0);
      return createSmoothWaveAnimation(point);
    });
    
    // Start all animations with slight delays for wave propagation
    animations.forEach((animation, index) => {
      setTimeout(() => animation.start(), index * 50);
    });

    // Auto-scroll carousel with animation
    const interval = setInterval(() => {
      animateTextTransition(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselData.length);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Handle swipe gestures
  const gestureX = useRef(new Animated.Value(0)).current;
  
  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: gestureX } }],
    { useNativeDriver: true }
  );

  const handleGestureStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // Determine swipe direction and threshold
      const swipeThreshold = 50;
      const velocityThreshold = 500;
      
      if (translationX > swipeThreshold || velocityX > velocityThreshold) {
        // Swipe right - go to previous slide
        animateTextTransition(() => {
          setCurrentIndex((prevIndex) => 
            prevIndex === 0 ? carouselData.length - 1 : prevIndex - 1
          );
        });
      } else if (translationX < -swipeThreshold || velocityX < -velocityThreshold) {
        // Swipe left - go to next slide
        animateTextTransition(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselData.length);
        });
      }
      
      // Reset translation
      gestureX.setValue(0);
    }
  };


  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Center Icon with Concentric Circles */}
          <View style={styles.iconSection}>
            {/* Outer glow circles */}
            <View style={styles.outerGlow1} />
            <View style={styles.outerGlow2} />
            <View style={styles.outerGlow3} />
            
            {/* Main gradient circle */}
            <LinearGradient
              colors={['#F97316', '#A855F7', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.mainCircle}
            >
              <Ionicons name="mic" size={52} color="#ffffff" />
            </LinearGradient>
          </View>

          {/* Animated Sound Wave */}
          <View style={styles.soundWaveContainer}>
            <View style={styles.soundWave}>
              <View style={styles.waveLineContainer}>
                {wavePoints.map((point, index) => {
                  const isCenter = index >= 6 && index <= 8;
                  const isMidRange = index >= 4 && index <= 10;
                  
                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.waveBar,
                        {
                          height: point.interpolate({
                            inputRange: [0, 1],
                            outputRange: isCenter 
                              ? [8, 40] 
                              : isMidRange 
                                ? [6, 24] 
                                : [4, 12]
                          }),
                          opacity: point.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1]
                          }),
                          transform: [{
                            scaleY: point.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.3, 1]
                            })
                          }]
                        }
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </View>

          {/* Swipeable Text Content */}
          <PanGestureHandler
            onGestureEvent={handleGestureEvent}
            onHandlerStateChange={handleGestureStateChange}
          >
            <Animated.View
              style={[
                styles.textContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY }],
                },
              ]}
            >
              {/* Title with Dynamic Content */}
              <View style={styles.titleSection}>
                <ThemedText style={styles.title}>
                  {carouselData[currentIndex].title}
                </ThemedText>
              </View>

              {/* Description with Dynamic Content */}
              <View style={styles.descriptionSection}>
                <ThemedText style={styles.description}>
                  {carouselData[currentIndex].description}
                </ThemedText>
              </View>
            </Animated.View>
          </PanGestureHandler>

          {/* Page Indicators */}
          <View style={styles.pageIndicators}>
            {carouselData.map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.indicator, 
                  index === currentIndex && styles.activeIndicator
                ]} 
              />
            ))}
          </View>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Primary Button - Gradient Border */}
          <View style={styles.primaryButtonContainer}>
            <LinearGradient
              colors={['#A855F7', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButtonBorder}
            >
              <TouchableOpacity
                style={styles.primaryButtonInner}
                onPress={onSignUp}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.primaryButtonText}>
                  Sign Up
                </ThemedText>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Secondary Button */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onSignIn}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.secondaryButtonText}>
              Sign in
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 70,
    position: 'relative',
  },
  outerGlow1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(168, 85, 247, 0.06)',
    opacity: 1,
  },
  outerGlow2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    opacity: 1,
  },
  outerGlow3: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    opacity: 1,
  },
  mainCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  soundWaveContainer: {
    marginBottom: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  soundWave: {
    width: 160,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  waveLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    paddingHorizontal: 5,
  },
  waveBar: {
    width: 2,
    borderRadius: 1,
    backgroundColor: '#A855F7',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  titleSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
    lineHeight: 56,
  },
  descriptionSection: {
    marginBottom: 50,
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 24,
  },
  pageIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 60,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  activeIndicator: {
    backgroundColor: '#ffffff',
    width: 24,
    height: 6,
    borderRadius: 3,
  },
  buttonsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    gap: 16,
  },
  primaryButtonContainer: {
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 16,
  },
  primaryButtonBorder: {
    borderRadius: 25,
    padding: 2,
    minWidth: 280,
  },
  primaryButtonInner: {
    backgroundColor: '#000000',
    borderRadius: 23,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 280,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
});