import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface WelcomeScreenProps {
  onQuickStart: (text: string) => void;
}

const examplePrompts = [
  {
    title: "Social Media App",
    description: "Create an Instagram-like photo sharing app",
    prompt: "Create an Instagram-like photo sharing app with user profiles, photo feed, likes, and comments",
    icon: "camera" as const,
    color: "#E1306C",
  },
  {
    title: "Todo App",
    description: "Build a task management application",
    prompt: "Build a modern todo app with categories, due dates, priority levels, and a clean design",
    icon: "checkmark-circle" as const,
    color: "#10B981",
  },
  {
    title: "Weather App",
    description: "Design a beautiful weather application",
    prompt: "Create a beautiful weather app with current conditions, hourly forecast, and location search",
    icon: "partly-sunny" as const,
    color: "#3B82F6",
  },
  {
    title: "Chat App",
    description: "Build a real-time messaging application",
    prompt: "Create a messaging app with chat rooms, real-time messaging, and user authentication",
    icon: "chatbubbles" as const,
    color: "#8B5CF6",
  },
  {
    title: "E-commerce App",
    description: "Create an online shopping experience",
    prompt: "Build an e-commerce app with product catalog, shopping cart, user accounts, and payment integration",
    icon: "storefront" as const,
    color: "#F59E0B",
  },
  {
    title: "Fitness Tracker",
    description: "Design a health and fitness application",
    prompt: "Create a fitness tracking app with workout logging, progress tracking, and health metrics",
    icon: "fitness" as const,
    color: "#EF4444",
  },
];

export function WelcomeScreen({ onQuickStart }: WelcomeScreenProps) {

  return (
    <ScrollView 
      contentContainerStyle={{ 
        paddingVertical: 40,
        paddingHorizontal: 8,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Header */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <LinearGradient
          colors={['#3b82f6', '#1e40af']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Ionicons name="code-slash" size={40} color="#FFFFFF" />
        </LinearGradient>
        
        <ThemedText style={{
          fontSize: 28,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 12,
          color: '#FFFFFF',
        }}>
          Welcome to Code Telepathy
        </ThemedText>
        
        <ThemedText style={{
          fontSize: 16,
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: 24,
          paddingHorizontal: 20,
        }}>
          Describe any app idea in plain English and watch AI generate working React Native code in real-time
        </ThemedText>
      </View>

      {/* Example Prompts */}
      <View style={{ marginBottom: 30 }}>
        <ThemedText style={{
          fontSize: 20,
          fontWeight: '600',
          marginBottom: 20,
          textAlign: 'center',
          color: '#FFFFFF',
        }}>
          Get started with these examples:
        </ThemedText>

        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 12,
        }}>
          {examplePrompts.map((example, index) => (
            <LinearGradient
              key={index}
              colors={['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.03)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: '45%',
                minWidth: 150,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 1,
                },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <TouchableOpacity
                onPress={() => onQuickStart(example.prompt)}
                style={{
                  padding: 16,
                  borderRadius: 16,
                }}
              >
              <View style={{
                width: 40,
                height: 40,
                backgroundColor: example.color,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <Ionicons name={example.icon} size={20} color="#FFFFFF" />
              </View>
              
              <ThemedText style={{
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 6,
                color: '#FFFFFF',
              }}>
                {example.title}
              </ThemedText>
              
              <ThemedText style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 20,
              }}>
                {example.description}
              </ThemedText>
              </TouchableOpacity>
            </LinearGradient>
          ))}
        </View>
      </View>

      {/* Instructions */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          padding: 20,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <ThemedText style={{
          fontSize: 18,
          fontWeight: '600',
          marginBottom: 16,
          textAlign: 'center',
          color: '#FFFFFF',
        }}>
          How it works:
        </ThemedText>

        <View style={{ gap: 12 }}>
          {[
            {
              step: "1",
              title: "Describe your app",
              description: "Tell me what kind of app you want to build in plain English",
              icon: "chatbox-ellipses" as const,
            },
            {
              step: "2",
              title: "Watch the magic",
              description: "AI generates working React Native code instantly",
              icon: "flash" as const,
            },
            {
              step: "3",
              title: "Iterate & refine",
              description: "Say 'make it more like Instagram' or 'add dark mode' to improve",
              icon: "refresh" as const,
            },
          ].map((step, index) => (
            <View key={index} style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
            }}>
              <View style={{
                width: 32,
                height: 32,
                backgroundColor: '#3B82F6',
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Ionicons name={step.icon} size={16} color="#FFFFFF" />
              </View>
              
              <View style={{ flex: 1 }}>
                <ThemedText style={{
                  fontSize: 14,
                  fontWeight: '600',
                  marginBottom: 2,
                  color: '#FFFFFF',
                }}>
                  {step.title}
                </ThemedText>
                <ThemedText style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 18,
                }}>
                  {step.description}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Footer */}
      <ThemedText style={{
        fontSize: 14,
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 30,
        fontStyle: 'italic',
      }}>
        Start by describing your dream app below ↓
      </ThemedText>
    </ScrollView>
  );
}