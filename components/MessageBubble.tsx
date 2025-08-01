import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { CodeViewer } from './CodeViewer';
import { Message } from './ChatInterface';

interface MessageBubbleProps {
  message: Message;
  isLoading?: boolean;
}

export function MessageBubble({ message, isLoading = false }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  
  const userGradientColors = ['#3b82f6', '#1e40af'] as const;
  const aiGradientColors = ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)'] as const;
  const bubbleTextColor = '#FFFFFF';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginVertical: 4,
    }}>
      <View style={{
        maxWidth: '80%',
        minWidth: '20%',
      }}>
        {/* Message Bubble */}
        <LinearGradient
          colors={isUser ? userGradientColors : aiGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 18,
            marginBottom: 4,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
            ...(isUser ? {
              borderBottomRightRadius: 6,
            } : {
              borderBottomLeftRadius: 6,
            }),
          }}
        >
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}>
          {isLoading ? (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
            }}>
              <ActivityIndicator 
                size="small" 
                color={bubbleTextColor} 
                style={{ marginRight: 8 }}
              />
              <ThemedText style={{ 
                color: bubbleTextColor,
                fontSize: 14,
              }}>
                {message.text}
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={{ 
              color: bubbleTextColor,
              fontSize: 16,
              lineHeight: 22,
            }}>
              {message.text}
            </ThemedText>
          )}
          </View>
        </LinearGradient>

        {/* Code Block (if present) */}
        {message.code && !isLoading && (
          <View style={{ marginTop: 8 }}>
            <CodeViewer 
              code={message.code} 
              language={message.language || 'javascript'} 
            />
          </View>
        )}

        {/* Timestamp */}
        <ThemedText style={{
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: isUser ? 'right' : 'left',
          marginTop: 2,
          paddingHorizontal: 4,
        }}>
          {formatTime(message.timestamp)}
        </ThemedText>
      </View>
    </View>
  );
}