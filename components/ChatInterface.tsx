import { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  code?: string;
  language?: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response (replace with actual AI integration later)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'll help you build that! Here's a React Native component to get started:",
        sender: 'ai',
        timestamp: new Date(),
        code: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MyComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});`,
        language: 'javascript',
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <LinearGradient
      colors={['#000000', '#0a0a0a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'left', 'right']}>
        {/* Header */}
        {/* <ThemedView style={{
          paddingHorizontal: 16,
          paddingTop: Platform.OS === 'ios' ? 8 : 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0,0,0,0.1)',
        }}>
          <ThemedText style={{
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            {title}
          </ThemedText>
        </ThemedView> */}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <WelcomeScreen onQuickStart={handleSend} />
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          
          {isLoading && (
            <MessageBubble 
              message={{
                id: 'loading',
                text: 'Generating code...',
                sender: 'ai',
                timestamp: new Date(),
              }}
              isLoading={true}
            />
          )}
        </ScrollView>

        {/* Input */}
        <ChatInput onSend={handleSend} isLoading={isLoading} />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}