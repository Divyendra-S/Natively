# Status Bar and Navigation Bar Best Practices

This document outlines the best practices for handling status bar and navigation bar in our React Native application using proper SafeAreaView implementation.

## Overview

Our application implements a flexible, non-restrictive approach to status bar and navigation handling that:
- Allows each screen to control its own status bar appearance
- Prevents container backgrounds from interfering with system UI areas
- Maintains proper safe area handling for device notches and home indicators
- Provides maximum flexibility for different screen designs

## Architecture Pattern

### 1. Global Layout (`app/_layout.tsx`)

```typescript
// ❌ AVOID: Global status bar that restricts per-screen customization
<StatusBar style="dark" backgroundColor="#ffffff" />

// ✅ CORRECT: No global status bar - let screens control their own
<SafeAreaProvider>
  <GestureHandlerRootView style={{ flex: 1 }}>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Screen definitions */}
      </Stack>
      {/* No StatusBar component here */}
    </ThemeProvider>
  </GestureHandlerRootView>
</SafeAreaProvider>
```

### 2. Screen-Level Implementation

Each screen follows this standardized pattern:

```typescript
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function MyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      {/* Independent status bar control */}
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      
      {/* SafeAreaView only handles left/right edges */}
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        
        {/* Header with manual top safe area handling */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Screen Title</Text>
        </View>
        
        {/* Rest of screen content */}
        <View style={styles.content}>
          {/* Screen content */}
        </View>
        
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Only affects screen content, not system areas
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F2F2F7', // Different background for content area
  },
});
```

## Key Principles

### 1. Separation of Concerns

- **StatusBar**: Independently controlled per screen
- **SafeAreaView**: Only handles left/right safe areas
- **Container**: Only affects screen content, never system UI areas
- **Headers**: Manually positioned using safe area insets

### 2. Edge Management

```typescript
// ✅ CORRECT: Only handle horizontal edges
<SafeAreaView edges={['left', 'right']}>

// ❌ AVOID: This would restrict system UI control
<SafeAreaView edges={['top', 'bottom', 'left', 'right']}>
```

### 3. Status Bar per Screen Type

Different screen types use appropriate status bar configurations:

```typescript
// Light screens (white backgrounds)
<StatusBar style="dark" backgroundColor="#FFFFFF" />

// Dark screens (camera, dark themes)
<StatusBar style="light" backgroundColor="#000000" />

// Colored headers
<StatusBar style="dark" backgroundColor="#F2F2F7" />
```

## Implementation Examples

### Standard Screen with Header

```typescript
export default function StandardScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.title}>Screen Title</Text>
        </View>
        <View style={styles.content}>
          {/* Content */}
        </View>
      </SafeAreaView>
    </>
  );
}
```

### Camera Screen (Full Screen)

```typescript
export default function CameraScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" />
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <CameraView style={styles.camera} />
        
        {/* Absolutely positioned header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}
```

### Screen with ParallaxScrollView

```typescript
export default function ParallaxScreen() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#D0D0D0" />
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
        <ParallaxScrollView headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}>
          {/* Content */}
        </ParallaxScrollView>
      </SafeAreaView>
    </>
  );
}
```

## Benefits of This Approach

### ✅ Advantages

1. **Flexibility**: Each screen controls its own status bar appearance
2. **Non-Restrictive**: Container backgrounds don't interfere with system UI
3. **Platform Consistent**: Proper handling of iOS notches and Android navigation
4. **Design Freedom**: Different screens can have completely different status bar styles
5. **Future Proof**: Easy to adapt to new device form factors

### ❌ Problems This Solves

1. **Container Color Bleeding**: Prevents screen background colors from showing in status bar
2. **Inflexible Global Status Bar**: No more being locked into one status bar style
3. **Safe Area Conflicts**: Avoids SafeAreaView interfering with system navigation areas
4. **Bottom Navigation Issues**: System properly handles home indicators and navigation bars

## Status Bar Color Guidelines

| Screen Type | Style | Background Color | Use Case |
|-------------|-------|------------------|----------|
| Light Theme | `dark` | `#FFFFFF` | White headers, light backgrounds |
| Dark Theme | `light` | `#000000` | Dark headers, camera screens |
| Colored Headers | `dark` | `#F2F2F7` | Gray/colored header sections |
| Custom Colors | `dark`/`light` | Match header color | Brand-specific colors |

## Common Patterns

### Header with Safe Area

```typescript
const Header = ({ title }: { title: string }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
};
```

### Status Bar Hook (Optional)

```typescript
// hooks/useStatusBar.ts
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export const useStatusBar = (style: 'light' | 'dark', backgroundColor: string) => {
  useFocusEffect(
    useCallback(() => {
      // Status bar styling is handled by StatusBar component in each screen
      // This hook can be used for additional focus-based logic if needed
    }, [style, backgroundColor])
  );
};
```

## Troubleshooting

### Issue: Status bar color not changing
**Solution**: Ensure StatusBar component is outside SafeAreaView and has correct backgroundColor

### Issue: Content appearing behind status bar
**Solution**: Use `useSafeAreaInsets()` and add `paddingTop: insets.top + desiredPadding` to header

### Issue: Bottom navigation interference
**Solution**: Ensure SafeAreaView only uses `edges={['left', 'right']}`, not all edges

### Issue: Different behavior on iOS vs Android
**Solution**: Test backgroundColor prop - it's primarily for Android, iOS handles automatically

## Best Practices Checklist

- [ ] Each screen has its own StatusBar component
- [ ] SafeAreaView uses only `edges={['left', 'right']}`
- [ ] Headers use `useSafeAreaInsets()` for top positioning
- [ ] Container styles don't include background colors that should be system-controlled
- [ ] Status bar style matches the header/top section color scheme
- [ ] No global StatusBar in main layout
- [ ] Tested on devices with notches and without
- [ ] Bottom navigation/home indicator areas are not restricted

## Migration Guide

When migrating existing screens to this pattern:

1. Remove any existing StatusBar from global layout
2. Add StatusBar component to each screen with appropriate colors
3. Change SafeAreaView to use `edges={['left', 'right']}`
4. Add `useSafeAreaInsets()` hook to screen component
5. Update header styles to use safe area insets
6. Test on various device types

This approach ensures maximum flexibility while maintaining proper system UI integration across all device types and orientations.