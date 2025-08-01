import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";

interface CodeViewerProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export function CodeViewer({
  code,
  language = "javascript",
  showLineNumbers = true,
}: CodeViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const textColor = "#F9FAFB";

  const lines = code.split("\n");
  const maxDisplayLines = 10;
  const shouldTruncate = lines.length > maxDisplayLines;
  const displayLines = isExpanded ? lines : lines.slice(0, maxDisplayLines);

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(code);
      Alert.alert("Copied!", "Code copied to clipboard");
    } catch {
      Alert.alert("Error", "Failed to copy code");
    }
  };

  const getLanguageColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case "javascript":
      case "js":
        return "#F7DF1E";
      case "typescript":
      case "ts":
        return "#3178C6";
      case "react":
        return "#61DAFB";
      case "python":
        return "#3776AB";
      case "java":
        return "#ED8B00";
      default:
        return "#6B7280";
    }
  };

  const formatLineNumber = (num: number) => {
    return num.toString().padStart(2, " ");
  };

  return (
    <LinearGradient
      colors={["#000000", "#0a0a0a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.06)",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      {/* Header */}
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.03)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255, 255, 255, 0.06)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: getLanguageColor(language),
              marginRight: 8,
            }}
          />
          <ThemedText
            style={{
              color: textColor,
              fontSize: 14,
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            {language}
          </ThemedText>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {shouldTruncate && (
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 6,
              }}
            >
              <TouchableOpacity
                onPress={() => setIsExpanded(!isExpanded)}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <ThemedText
                  style={{
                    color: textColor,
                    fontSize: 12,
                    fontWeight: "500",
                  }}
                >
                  {isExpanded
                    ? "Collapse"
                    : `+${lines.length - maxDisplayLines} lines`}
                </ThemedText>
              </TouchableOpacity>
            </LinearGradient>
          )}

          <LinearGradient
            colors={["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.04)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 6,
              borderRadius: 6,
            }}
          >
            <TouchableOpacity onPress={copyToClipboard}>
              <Ionicons name="copy-outline" size={16} color={textColor} />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* Code Content */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ minWidth: "100%" }}
      >
        <View style={{ padding: 16 }}>
          {displayLines.map((line, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                marginBottom: index === displayLines.length - 1 ? 0 : 2,
              }}
            >
              {showLineNumbers && (
                <ThemedText
                  style={{
                    color: "rgba(249, 250, 251, 0.4)",
                    fontSize: 14,
                    fontFamily: "SpaceMono",
                    marginRight: 16,
                    minWidth: 24,
                    textAlign: "right",
                  }}
                >
                  {formatLineNumber(index + 1)}
                </ThemedText>
              )}
              <ThemedText
                style={{
                  color: textColor,
                  fontSize: 14,
                  fontFamily: "SpaceMono",
                  lineHeight: 20,
                  flex: 1,
                }}
              >
                {line || " "} {/* Ensure empty lines are visible */}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Expand/Collapse Button */}
      {shouldTruncate && !isExpanded && (
        <TouchableOpacity
          onPress={() => setIsExpanded(true)}
          style={{
            paddingVertical: 12,
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.03)",
            borderTopWidth: 1,
            borderTopColor: "rgba(255, 255, 255, 0.06)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ThemedText
              style={{
                color: textColor,
                fontSize: 14,
                marginRight: 4,
              }}
            >
              Show {lines.length - maxDisplayLines} more lines
            </ThemedText>
            <Ionicons name="chevron-down" size={16} color={textColor} />
          </View>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}
