import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { FlatGrid } from 'react-native-super-grid';
import { Ionicons } from '@expo/vector-icons';
import type { Image as ImageType } from '../lib/database/queries/images';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 40) / 3; // 3 columns with padding

interface ImageGridProps {
  images: ImageType[];
  loading?: boolean;
  onImagePress: (image: ImageType) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  emptyMessage?: string;
}

export default function ImageGrid({
  images,
  loading = false,
  onImagePress,
  onRefresh,
  refreshing = false,
  emptyMessage = 'No images yet',
}: ImageGridProps) {
  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'analyzing':
        return <Ionicons name="analytics" size={16} color="#007AFF" />;
      case 'analyzed':
        return <Ionicons name="checkmark-circle" size={16} color="#34C759" />;
      case 'processing':
        return <Ionicons name="settings" size={16} color="#FF9500" />;
      case 'processed':
        return <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />;
      case 'failed':
        return <Ionicons name="close-circle" size={16} color="#FF3B30" />;
      default:
        return <Ionicons name="image" size={16} color="#8E8E93" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'analyzing':
        return '#007AFF';
      case 'analyzed':
        return '#34C759';
      case 'processing':
        return '#FF9500';
      case 'processed':
        return '#34C759';
      case 'failed':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const renderImageItem = ({ item }: { item: ImageType }) => (
    <TouchableOpacity
      style={styles.imageItem}
      onPress={() => onImagePress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.original_url }}
        style={styles.image}
        contentFit="cover"
        transition={200}
        placeholder={{
          blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
        }}
      />
      
      {/* Status overlay */}
      <View style={styles.statusOverlay}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          {getStatusIcon(item.status)}
        </View>
      </View>

      {/* Processing indicator */}
      {(item.status === 'analyzing' || item.status === 'processing') && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="small" color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="camera-outline" size={80} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>{emptyMessage}</Text>
      <Text style={styles.emptySubtitle}>
        Tap the camera button to capture your first AI-enhanced photo
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading images...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatGrid
        itemDimension={ITEM_SIZE}
        data={images}
        style={styles.grid}
        spacing={8}
        renderItem={renderImageItem}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  grid: {
    flex: 1,
    padding: 16,
  },
  imageItem: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  statusOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  processingOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});