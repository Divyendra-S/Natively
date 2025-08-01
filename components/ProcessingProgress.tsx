import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  description?: string;
}

interface ProcessingProgressProps {
  steps: ProcessingStep[];
  currentStep?: string;
  showDetails?: boolean;
}

export default function ProcessingProgress({
  steps,
  currentStep,
  showDetails = true,
}: ProcessingProgressProps) {
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const renderStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return (
          <View style={[styles.stepIcon, styles.stepIconCompleted]}>
            <Ionicons name="checkmark" size={16} color="white" />
          </View>
        );
      case 'active':
        return (
          <View style={[styles.stepIcon, styles.stepIconActive]}>
            <ActivityIndicator size="small" color="white" />
          </View>
        );
      case 'failed':
        return (
          <View style={[styles.stepIcon, styles.stepIconFailed]}>
            <Ionicons name="close" size={16} color="white" />
          </View>
        );
      default:
        return (
          <View style={[styles.stepIcon, styles.stepIconPending]}>
            <View style={styles.stepIconDot} />
          </View>
        );
    }
  };

  const renderStep = (step: ProcessingStep, index: number) => (
    <View key={step.id} style={styles.stepContainer}>
      <View style={styles.stepIconContainer}>
        {renderStepIcon(step)}
        {index < steps.length - 1 && (
          <View
            style={[
              styles.stepConnector,
              step.status === 'completed' && styles.stepConnectorCompleted,
            ]}
          />
        )}
      </View>
      
      <View style={styles.stepContent}>
        <Text
          style={[
            styles.stepLabel,
            step.status === 'completed' && styles.stepLabelCompleted,
            step.status === 'active' && styles.stepLabelActive,
            step.status === 'failed' && styles.stepLabelFailed,
          ]}
        >
          {step.label}
        </Text>
        
        {showDetails && step.description && (
          <Text style={styles.stepDescription}>
            {step.description}
          </Text>
        )}
        
        {step.status === 'active' && (
          <View style={styles.activeIndicator}>
            <View style={styles.pulsingDot} />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AI Processing</Text>
        <Text style={styles.progressText}>
          {completedSteps} of {steps.length} steps completed
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: `${progressPercentage}%` },
            ]}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressBarGradient}
            />
          </Animated.View>
        </View>
        <Text style={styles.progressPercentage}>
          {Math.round(progressPercentage)}%
        </Text>
      </View>

      {/* Processing Steps */}
      <View style={styles.stepsContainer}>
        {steps.map(renderStep)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarGradient: {
    flex: 1,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    minWidth: 40,
    textAlign: 'right',
  },
  stepsContainer: {
    gap: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconPending: {
    backgroundColor: '#F2F2F7',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  stepIconActive: {
    backgroundColor: '#007AFF',
  },
  stepIconCompleted: {
    backgroundColor: '#34C759',
  },
  stepIconFailed: {
    backgroundColor: '#FF3B30',
  },
  stepIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C7C7CC',
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E5EA',
    marginTop: 4,
  },
  stepConnectorCompleted: {
    backgroundColor: '#34C759',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  stepLabelActive: {
    color: '#007AFF',
  },
  stepLabelCompleted: {
    color: '#34C759',
  },
  stepLabelFailed: {
    color: '#FF3B30',
  },
  stepDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  processingText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});