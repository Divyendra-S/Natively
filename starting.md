# Phase 1 Execution Plan - AI Image Editor
**Duration**: 6 weeks | **Goal**: MVP with basic AI analysis and automated editing

---
gemini api key = AIzaSyCMAxYuqKBPDqtEzpuIsQJ__cn0t3nyLr0
## 🎯 Phase 1 Objectives
- [ ] Image capture and gallery access with React Native
- [ ] Supabase Storage integration for secure image handling
- [ ] OpenAI GPT-4 Vision integration for image analysis
- [ ] Basic automated editing pipeline using image processing libraries
- [ ] Simple UI flow: Capture → Analyze → Edit → View Results

---

## 📅 Week-by-Week Execution Plan

### **Week 1: Foundation & Storage Setup**

#### **Day 1-2: Project Dependencies & Environment**
**Tasks:**
- Install camera/gallery packages: `expo-camera`, `expo-image-picker`, `expo-media-library`
- Install image processing: `expo-image-manipulator`, `react-native-super-grid`
- Install AI/API packages: `@google/genai` (NEW unified SDK), `expo-file-system`
- Set up environment variables for Google AI Studio API key in Expo
- Configure Expo development build if using camera (required for bare workflow)
- **Important**: Use `@google/genai` NOT `@google/generative-ai` (deprecated August 2025)

**Deliverable:** Fully configured development environment

#### **Day 3-4: Supabase Storage & Database Schema**
**Tasks:**
- Create `images` storage bucket in Supabase with public access
- Set up Row Level Security (RLS) policies for user-specific image access
- Create database tables:
  - `images` table (id, user_id, original_url, processed_url, analysis_data, status)
  - `processing_queue` table for async operations
  - `user_preferences` table for AI analysis preferences
- Create Supabase Edge Function for image processing (skeleton)

**Deliverable:** Complete database schema and storage setup

#### **Day 5-7: Image Service Layer**
**Tasks:**
- Create `imageService.js` with methods:
  - `uploadImage(uri, userId)` - upload to Supabase Storage
  - `saveImageRecord(imageData)` - save metadata to database
  - `getUserImages(userId)` - fetch user's images
  - `updateImageStatus(imageId, status)` - track processing status
- Implement error handling and retry logic
- Add image compression and optimization before upload
- Create `geminiService.js` with new SDK patterns:
  - Proper initialization with `@google/genai`
  - Rate limiting and quota management
  - Request queuing system
  - Error handling for 429 (quota exceeded) responses

**Deliverable:** Robust image service layer with modern Gemini integration

---

## ⚠️ Critical SDK Migration Notes

### **IMPORTANT: Use New SDK Only**
- ✅ **Use**: `@google/genai` (Active, supported, latest features)
- ❌ **DON'T Use**: `@google/generative-ai` (Deprecated August 31, 2025)

### **Key Differences in New SDK:**
1. **Import**: `import { GoogleGenAI } from '@google/genai'`
2. **Initialization**: `new GoogleGenAI({apiKey: 'your-key'})`
3. **Image Format**: Uses `inlineData` with base64 instead of file upload
4. **Response**: `response.text` instead of nested candidate structure
5. **Models**: Updated model names like `gemini-2.5-flash`

### **Rate Limiting Reality Check:**
- **Development**: Use Gemini 2.5 Flash (15 RPM) - sufficient for testing
- **Production**: Requires paid tier or very limited free usage
- **Strategy**: Build with caching and fallbacks from day one

---

### **Week 2: Camera & Gallery Implementation**

#### **Day 1-3: Camera Integration**
**Tasks:**
- Create `CameraScreen` component with:
  - Camera permissions handling
  - Photo capture functionality
  - Front/back camera toggle
  - Flash controls
- Implement image preview before upload
- Add loading states during upload process
- Handle camera errors gracefully

**Deliverable:** Fully functional camera interface

#### **Day 4-5: Gallery Integration**
**Tasks:**
- Create `GalleryScreen` with:
  - Image picker from device gallery
  - Multi-image selection capability
  - Image grid display with thumbnails
  - Pull-to-refresh functionality
- Implement image filtering and sorting options
- Add search functionality by date/type

**Deliverable:** Complete gallery interface with image management

#### **Day 6-7: Navigation & State Management**
**Tasks:**
- Set up React Navigation between Camera/Gallery/Processing screens
- Implement global state management (Context API or Zustand):
  - Current image state
  - Processing status
  - User preferences
- Create loading overlays and progress indicators
- Add offline state handling

**Deliverable:** Seamless navigation flow and state management

---

### **Week 3: AI Analysis Integration**

#### **Day 1-2: Google Gemini API Setup**
**Tasks:**
- Create `aiService.js` for Google Gemini integration using `@google/genai`
- Set up Google AI Studio API key and client configuration
- Implement image file handling (base64 conversion for React Native)
- Create rate limiting for free tier:
  - **Gemini 2.5 Flash**: 15 RPM, 1,500 RPD (recommended for development)
  - **Gemini 2.5 Pro**: 5 RPM, 25 RPD (very limited, use sparingly)
- Add intelligent request queuing to stay within limits
- Implement caching strategy to maximize free quota usage

**Deliverable:** Working Gemini Pro Vision API integration with proper rate limiting

#### **Day 3-4: Image Analysis Engine**
**Tasks:**
- Design comprehensive analysis prompt for Gemini Pro Vision:
  - Image type classification (portrait, landscape, food, etc.)
  - Technical quality assessment (exposure, sharpness, composition)
  - Content detection (objects, people, scenes)
  - Mood and aesthetic analysis
- Implement `analyzeImage(imageUri)` function using new SDK patterns:
  - Convert image to base64 using expo-file-system
  - Use `inlineData` format for image upload
  - Structure JSON response parsing
- Add confidence scoring and error handling for API failures
- Implement fallback analysis for quota exceeded scenarios

**Deliverable:** Intelligent image analysis system with robust error handling

#### **Day 5-7: Analysis Data Management**
**Tasks:**
- Create `ProcessingScreen` to show analysis in progress
- Store analysis results in Supabase database
- Display analysis results in user-friendly format:
  - Image type and confidence
  - Detected objects/subjects
  - Technical quality scores
  - Suggested improvements
- Implement analysis result caching
- Add manual re-analysis option

**Deliverable:** Complete analysis workflow with data persistence

---

### **Week 4: Basic Editing Pipeline**

#### **Day 1-3: Edit Decision Engine**
**Tasks:**
- Create `editingEngine.js` with rule-based editing logic:
  - Map image types to appropriate edits
  - Define editing intensity based on quality scores
  - Create edit operation priority system
- Implement edit plan generation:
  - Primary edits (exposure, contrast, sharpness)
  - Secondary edits (color grading, saturation)
  - Style-specific adjustments
- Add user preference integration for edit customization

**Deliverable:** Intelligent edit decision system

#### **Day 4-5: Image Processing Implementation**
**Tasks:**
- Implement core editing operations using Expo ImageManipulator:
  - Exposure correction
  - Contrast adjustment
  - Saturation/vibrance
  - Sharpening/blur
  - Crop and resize
- Create batch processing for multiple edits
- Add before/after comparison functionality
- Implement edit history and undo capability

**Deliverable:** Functional automated editing pipeline

#### **Day 6-7: Edit Execution & Quality Control**
**Tasks:**
- Create `ProcessingService` for coordinating analysis → editing workflow
- Implement edit quality validation:
  - Check for over-processing
  - Validate edit success
  - Generate quality scores
- Add fallback mechanisms for failed edits
- Optimize processing performance and memory usage

**Deliverable:** Reliable end-to-end processing system

---

### **Week 5: UI/UX & Processing Flow**

#### **Day 1-3: Processing Interface**
**Tasks:**
- Create `ProcessingScreen` with:
  - Real-time progress indicators
  - Step-by-step processing visualization
  - Analysis results display
  - Edit preview during processing
- Implement background processing with notifications
- Add processing cancellation option
- Create error handling and retry mechanisms

**Deliverable:** Polished processing experience

#### **Day 4-5: Results & Comparison**
**Tasks:**
- Create `ResultsScreen` with:
  - Before/after image comparison
  - Slide gesture for comparison
  - Edit details and reasoning display
  - Save/discard options
- Implement image zoom and pan functionality
- Add sharing capabilities (save to gallery, export)
- Create edit adjustment sliders for fine-tuning

**Deliverable:** Comprehensive results interface

#### **Day 6-7: Gallery Management**
**Tasks:**
- Enhance gallery with processed images
- Add filtering by processing status
- Implement batch operations (delete, reprocess)
- Create favorites and collections functionality
- Add image metadata display (analysis results, edit history)

**Deliverable:** Advanced gallery management system

---

### **Week 6: Testing, Optimization & Polish**

#### **Day 1-2: Performance Optimization**
**Tasks:**
- Optimize image loading and caching
- Implement lazy loading for gallery
- Reduce app bundle size and startup time
- Optimize API call frequency and batching
- Add image compression pipeline

**Deliverable:** Optimized app performance

#### **Day 3-4: Error Handling & Edge Cases**
**Tasks:**
- Comprehensive error handling for all user flows
- Handle network connectivity issues
- Manage storage quota and cleanup
- Add user feedback for failed operations
- Implement graceful degradation for API failures

**Deliverable:** Robust error handling system

#### **Day 5-7: Testing & User Experience**
**Tasks:**
- End-to-end testing of complete user flow
- Test with various image types and qualities
- Performance testing on different devices
- User interface polish and accessibility
- Create onboarding flow for new users

**Deliverable:** Production-ready MVP

---

## 🛠️ Technical Architecture Overview

### **File Structure**
```
src/
├── screens/
│   ├── CameraScreen.js
│   ├── GalleryScreen.js
│   ├── ProcessingScreen.js
│   └── ResultsScreen.js
├── services/
│   ├── imageService.js
│   ├── geminiService.js (NEW SDK integration)
│   ├── editingEngine.js
│   └── processingService.js
├── components/
│   ├── ImageGrid.js
│   ├── ProcessingProgress.js
│   └── ImageComparison.js
├── contexts/
│   ├── AuthContext.js
│   └── ImageContext.js
├── utils/
│   ├── imageUtils.js
│   ├── rateLimit.js (quota management)
│   └── constants.js
└── config/
    └── gemini.js (API configuration)
```

### **Key Integration Points**
1. **Supabase Integration**: Authentication, Storage, Database, Edge Functions
2. **Google Gemini API**: New `@google/genai` SDK for image analysis
3. **Expo Modules**: Camera, ImagePicker, ImageManipulator, FileSystem
4. **State Management**: React Context or Zustand for global state

### **Google Gen AI SDK Specific Implementation**
```javascript
// Correct SDK initialization (2025)
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Image analysis with new SDK pattern
const analyzeImage = async (imageBase64) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Use Flash for development (higher quota)
    contents: [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      },
      { text: 'Analyze this image and return structured JSON...' }
    ],
  });
  
  return response.text;
};
```

### **Free Tier Rate Limits (Current 2025)**
- **Gemini 2.5 Flash**: 15 RPM, 1,500 RPD (recommended for development)
- **Gemini 2.5 Pro**: 5 RPM, 25 RPD (very limited, production needs paid tier)
- **Image Processing**: Includes image tokens in rate calculation
- **Quota Reset**: Midnight Pacific Time daily
- **Error Code**: 429 when quota exceeded

### **Success Metrics for Phase 1**
- [ ] Successfully capture and upload images
- [ ] Gemini AI analysis working with 90%+ success rate within strict free tier limits
- [ ] Automated editing producing visually improved results
- [ ] Complete user flow from capture to processed result
- [ ] App performance under 5 seconds for full processing (accounting for API limits)
- [ ] Efficient API usage staying well within free tier quotas (max 10 analysis/day during development)

### **Free Tier Optimization Strategies (Updated 2025)**
- **Aggressive Caching**: Cache analysis results for identical/similar images
- **Smart Queuing**: Queue requests and process during off-peak times
- **Development Strategy**: Use Gemini 2.5 Flash (15 RPM) for development, test Pro sparingly
- **Image Preprocessing**: Resize to 1024x1024 max before sending to reduce token usage
- **Fallback Analysis**: Implement basic rule-based analysis when quota exceeded
- **Usage Monitoring**: Track daily quota consumption and warn users
- **Batch Processing**: Process multiple edits locally once analysis is complete

### **Production Scaling Plan**
- **Week 1-4**: Development with Flash model (free tier sufficient)
- **Week 5-6**: Limited testing with Pro model for quality comparison
- **Post-MVP**: Upgrade to paid tier (Tier 1: 1,000 RPD) for production use
- **Alternative**: Consider Vertex AI for production (requires GCP billing setup)

### **Next Phase Preparation**
- Document exact API usage patterns and quota consumption during development
- Gather user feedback on edit quality vs. analysis accuracy trade-offs
- Plan transition strategy to paid tier based on user volume projections
- Consider hybrid approach: free tier for basic analysis, paid for premium features
- Prepare caption generation feature using same Gemini models (text generation cheaper than vision)

This plan gives you a clear roadmap to build the core functionality step by step, with each week building on the previous one's deliverables.