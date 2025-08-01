import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#A855F7" />
      <ThemedText style={styles.text}>Loading...</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});