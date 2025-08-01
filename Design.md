# Design System & Style Guide

## Overview
This design system provides comprehensive guidelines for building a premium, modern React Native application with subtle aesthetics and elegant user interfaces. It follows current 2024-2025 design trends while maintaining timeless appeal.

## Design Philosophy

### Core Principles
- **Exaggerated Minimalism**: Bold elements within clean, minimalist layouts
- **Subtle Sophistication**: Premium feel through careful use of space, typography, and color
- **Functional Beauty**: Every design decision serves both aesthetic and functional purposes
- **Cross-Platform Consistency**: Unified experience across iOS and Android

## Color System

### Primary Palette
```javascript
// Brand Colors
const colors = {
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE', 
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',  // Primary brand color
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E'
  }
}
```

### Neutral Palette
```javascript
const neutrals = {
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  },
  black: '#000000'
}
```

### Semantic Colors
```javascript
const semanticColors = {
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
}
```

### Gradient System
```javascript
const gradients = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  sunset: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  ocean: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  forest: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
}
```

### Color Usage Guidelines
- **60-30-10 Rule**: 60% primary color, 30% secondary, 10% accent
- **Accessibility**: Minimum contrast ratio of 4.5:1 for normal text, 3:1 for large text
- **Brand Consistency**: Red reserved for errors only, never for brand elements
- **Cultural Sensitivity**: Consider global audience when selecting colors

## Typography System

### Font Stack
```javascript
const fontFamilies = {
  // iOS default
  ios: 'San Francisco',
  // Android default  
  android: 'Roboto',
  // Fallback system fonts
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
}
```

### Type Scale
```javascript
const typography = {
  // Headings
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    letterSpacing: -0.25
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: 0
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: 0
  },
  
  // Body text
  body1: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0
  },
  
  // UI text
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.4
  }
}
```

### Typography Guidelines
- **Minimum Size**: 16px for body text on mobile
- **Line Height**: 1.5x font size for optimal readability
- **Hierarchy**: Use size, weight, and color to establish clear information hierarchy
- **Accessibility**: Support dynamic type sizing for visually impaired users

## Spacing System

### Base Unit
```javascript
const spacing = {
  unit: 8, // Base unit in pixels
  
  // Spacing scale
  xs: 4,   // 0.5 unit
  sm: 8,   // 1 unit
  md: 16,  // 2 units
  lg: 24,  // 3 units
  xl: 32,  // 4 units
  xxl: 48, // 6 units
  xxxl: 64 // 8 units
}
```

### Layout Grid
```javascript
const layout = {
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24
  },
  section: {
    marginBottom: 32
  },
  card: {
    padding: 16,
    margin: 8
  }
}
```

## Visual Effects

### Shadows
```javascript
const shadows = {
  // iOS-style shadows
  ios: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      shadowOpacity: 0.2
    }
  },
  
  // Android-style elevation
  android: {
    small: { elevation: 2 },
    medium: { elevation: 4 },
    large: { elevation: 8 }
  }
}
```

### Border Radius
```javascript
const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999
}
```

### Glassmorphism Effects
```javascript
// For React Native with @react-native-community/blur
const glassmorphism = {
  background: 'rgba(255, 255, 255, 0.1)',
  blurType: 'light',
  blurAmount: 20,
  borderColor: 'rgba(255, 255, 255, 0.2)',
  borderWidth: 1
}
```

## Component Guidelines

### Buttons

#### Primary Button
```javascript
const primaryButton = {
  backgroundColor: colors.primary[500],
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: borderRadius.md,
  ...shadows.ios.small
}
```

#### Button States
- **Default**: Full opacity, normal shadow
- **Pressed**: 0.8 opacity, reduced shadow
- **Disabled**: 0.5 opacity, no shadow
- **Loading**: Show spinner, maintain dimensions

### Cards
```javascript
const cardStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.lg,
  padding: spacing.md,
  ...shadows.ios.medium,
  borderColor: neutrals.gray[200],
  borderWidth: 1
}
```

### Input Fields
```javascript
const inputStyle = {
  borderWidth: 1,
  borderColor: neutrals.gray[300],
  borderRadius: borderRadius.md,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  fontSize: typography.body1.fontSize,
  backgroundColor: colors.white
}
```

## Modern Design Patterns

### Glassmorphism Implementation
Use for overlays, modals, and floating elements:
- Background: Semi-transparent white/dark
- Backdrop filter: Blur effect
- Border: Subtle highlight
- Shadow: Soft depth

### Neubrutalism Elements
Apply selectively for emphasis:
- Bold, high-contrast borders
- Vibrant accent colors
- Sharp, blocky shapes
- Intentionally "unpolished" aesthetic

### Bento Grid Layouts
For dashboard and content organization:
- Asymmetrical grid system
- Varied card sizes
- Clean spacing between elements
- Visual hierarchy through size variation

## Icon System

### Design Principles
- **Minimal & Clean**: One clear focal point per icon
- **Consistent Style**: Uniform stroke width and style
- **Scalable**: Legible at 16px minimum
- **Brand Aligned**: Consistent with overall app aesthetic

### Icon Specifications
```javascript
const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48
}

const iconStyles = {
  strokeWidth: 2,
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
}
```

## Animation Guidelines

### Micro-interactions
```javascript
const animations = {
  // Subtle feedback animations
  press: {
    scale: 0.98,
    duration: 100
  },
  
  // Page transitions
  slideIn: {
    translateX: 300,
    duration: 250,
    easing: 'ease-out'
  },
  
  // Loading states
  fade: {
    opacity: [0.5, 1, 0.5],
    duration: 1500,
    loop: true
  }
}
```

### Animation Principles
- **Subtle & Purposeful**: Enhance UX without being distracting
- **Performance**: 60fps on all target devices
- **Accessibility**: Respect user's motion preferences
- **Duration**: 200-300ms for most micro-interactions

## React Native UI Libraries

### Recommended Libraries
1. **gluestack-ui**: Tailwind-based, performance-optimized
2. **React Native Paper**: Material Design implementation
3. **React Native Elements**: Comprehensive component library
4. **Tamagui**: High-performance UI system

### Implementation Example
```javascript
// Using gluestack-ui with custom theme
import { createConfig } from '@gluestack-ui/themed'

const config = createConfig({
  tokens: {
    colors: colors,
    space: spacing,
    fontSizes: typography,
    // ... other design tokens
  }
})
```

## Accessibility Standards

### Guidelines
- **Color Contrast**: WCAG AA compliance (4.5:1 ratio)
- **Touch Targets**: Minimum 44px tap area
- **Text Size**: Support dynamic type scaling
- **Screen Readers**: Proper semantic markup and labels
- **Focus Management**: Clear focus indicators

### Implementation
```javascript
// Accessible button example
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Add new item"
  accessibilityRole="button"
  accessibilityHint="Adds a new item to your list"
  style={buttonStyles}
>
  <Text style={buttonTextStyles}>Add Item</Text>
</TouchableOpacity>
```

## Performance Considerations

### Optimization Strategies
- **Stale Times**: Set appropriate cache durations
  - User profiles: 10 minutes
  - Dynamic content: 2 minutes
  - Static data: 1 hour
- **Image Optimization**: Use appropriate formats and sizes
- **Bundle Size**: Tree-shake unused code
- **Animations**: Use native driver when possible

## Development Workflow

### Design Tokens Structure
```
lib/
├── design/
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── shadows.ts
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   └── Input/
│   └── theme.ts
```

### Theme Provider Setup
```javascript
// theme.ts
export const theme = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius
}

// App.tsx
import { ThemeProvider } from './lib/design/ThemeProvider'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* Your app content */}
    </ThemeProvider>
  )
}
```

## Testing & Quality Assurance

### Design System Tests
- **Visual Regression**: Screenshot testing for components
- **Accessibility**: Automated a11y testing
- **Performance**: Monitor animation frame rates
- **Cross-Platform**: Test on both iOS and Android

### Tools
- **Storybook**: Component documentation and testing
- **Jest**: Unit tests for design utilities
- **Detox**: End-to-end testing
- **Flipper**: Performance debugging

## Conclusion

This design system provides a foundation for building premium, accessible, and performant React Native applications. Regular updates should be made to reflect evolving design trends while maintaining consistency and usability.

### Key Reminders
- Always consider accessibility in design decisions
- Test on multiple devices and screen sizes
- Maintain consistency across all touchpoints
- Document any deviations or additions to this system
- Regular design system reviews and updates

---

*Last updated: 2025*
*Version: 1.0*