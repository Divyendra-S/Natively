import { ThemedText } from "@/components/ThemedText";
import { signUp } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface SignUpScreenProps {
  onSignIn: () => void;
  onBack: () => void;
}

export function SignUpScreen({ onSignIn, onBack }: SignUpScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // No longer need Jotai atoms

  // Animation values for smooth wave
  const wavePoints = Array.from(
    { length: 15 },
    (_, i) => useRef(new Animated.Value(Math.sin(i * 0.4) * 0.5 + 0.5)).current
  );

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

    const animations = wavePoints.map((point) => {
      point.setValue(0);
      return createSmoothWaveAnimation(point);
    });

    animations.forEach((animation, index) => {
      setTimeout(() => animation.start(), index * 50);
    });
  }, []);

  const handleSignUp = async () => {
    if (!confirmPassword) {
      Alert.alert("Error", "Please confirm your password");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const data = await signUp(email, password);
      Alert.alert("Success", "Account created successfully!");
      // With email confirmation disabled, user should be logged in automatically
    } catch (error) {
      Alert.alert(
        "Sign Up Error",
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

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
              colors={["#F97316", "#A855F7", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.mainCircle}
            >
              <Ionicons name="person-add" size={52} color="#ffffff" />
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
                              : [4, 12],
                          }),
                          opacity: point.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                          }),
                          transform: [
                            {
                              scaleY: point.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.3, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <ThemedText style={styles.title}>Join Syncra</ThemedText>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <ThemedText style={styles.description}>
              Create your account to get started{"\\n"}with voice-controlled
              productivity
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password-new"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="password-new"
              />
            </View>
          </View>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Primary Button - Sign Up */}
          <View style={styles.primaryButtonContainer}>
            <LinearGradient
              colors={["#A855F7", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButtonBorder}
            >
              <TouchableOpacity
                style={styles.primaryButtonInner}
                onPress={handleSignUp}
                disabled={loading}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.primaryButtonText}>
                  {loading ? "Creating Account..." : "Create Account"}
                </ThemedText>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Secondary Button - Sign In */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onSignIn}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.secondaryButtonText}>
              Already have an account? Sign In
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
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 120,
  },
  iconSection: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    position: "relative",
  },
  outerGlow1: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(168, 85, 247, 0.06)",
    opacity: 1,
  },
  outerGlow2: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    opacity: 1,
  },
  outerGlow3: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(168, 85, 247, 0.18)",
    opacity: 1,
  },
  mainCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  soundWaveContainer: {
    marginBottom: 8,
    marginTop: 10,
    alignItems: "center",
  },
  soundWave: {
    width: 140,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  waveLineContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: "100%",
    paddingHorizontal: 5,
  },
  waveBar: {
    width: 2,
    borderRadius: 1,
    backgroundColor: "#A855F7",
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  titleSection: {
    marginBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 42,
    fontWeight: "600",
    textAlign: "center",
    color: "#ffffff",
    lineHeight: 50,
  },
  descriptionSection: {
    marginBottom: 40,
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 24,
  },
  formContainer: {
    width: "100%",
    maxWidth: 320,
    gap: 16,
    marginBottom: 40,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#ffffff",
    fontFamily: "System",
  },
  buttonsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    gap: 16,
  },
  primaryButtonContainer: {
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  primaryButtonBorder: {
    borderRadius: 25,
    padding: 2,
    minWidth: 280,
  },
  primaryButtonInner: {
    backgroundColor: "#000000",
    borderRadius: 23,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.7)",
  },
});
