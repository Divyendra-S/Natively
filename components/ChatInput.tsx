import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const quickSuggestions = [
  "Make it like Instagram",
  "Add dark mode",
  "Create a login screen",
  "Add animations",
  "Make it responsive",
];

export function ChatInput({ 
  onSend, 
  isLoading = false, 
  placeholder = "Describe your app idea..." 
}: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleSend = () => {
    if (inputText.trim() && !isLoading) {
      onSend(inputText.trim());
      setInputText('');
      setShowSuggestions(false);
      Keyboard.dismiss();
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
    setShowSuggestions(false);
  };

  const canSend = inputText.trim().length > 0 && !isLoading;

  return (
    <View style={{
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.06)',
    }}>
      {/* Quick Suggestions */}
      {showSuggestions && inputText.length === 0 && (
        <View style={{ marginBottom: 12 }}>
          <ThemedText style={{
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 8,
            color: 'rgba(255, 255, 255, 0.7)',
          }}>
            Quick suggestions:
          </ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {quickSuggestions.map((suggestion, index) => (
              <LinearGradient
                key={index}
                colors={['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.03)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                }}
              >
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <ThemedText style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: 14,
                    fontWeight: '500',
                  }}>
                    {suggestion}
                  </ThemedText>
                </TouchableOpacity>
              </LinearGradient>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input Row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
      }}>
        {/* Text Input */}
        <View style={{
          flex: 1,
          minHeight: 44,
          maxHeight: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          borderRadius: 22,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          paddingHorizontal: 16,
          paddingVertical: 12,
          justifyContent: 'center',
        }}>
          <TextInput
            style={{
              fontSize: 16,
              color: '#FFFFFF',
              maxHeight: 80,
              ...Platform.select({
                web: { outline: 'none' },
              }),
            }}
            value={inputText}
            onChangeText={(text) => {
              setInputText(text);
              if (text.length > 0) {
                setShowSuggestions(false);
              } else {
                setShowSuggestions(true);
              }
            }}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            multiline
            textAlignVertical="center"
            scrollEnabled
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
        </View>

        {/* Send Button */}
        <LinearGradient
          colors={canSend ? ['#3b82f6', '#1e40af'] : ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
          }}
        >
          <TouchableOpacity
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 22,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleSend}
            disabled={!canSend}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color="#FFFFFF" 
              style={{ marginLeft: 2 }} // Slight offset for visual balance
            />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Character Count (optional) */}
      {inputText.length > 0 && (
        <ThemedText style={{
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'right',
          marginTop: 4,
        }}>
          {inputText.length} characters
        </ThemedText>
      )}
    </View>
  );
}