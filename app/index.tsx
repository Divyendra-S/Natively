import { AuthenticationFlow } from '@/components/AuthenticationFlow';
import GalleryScreen from '../screens/GalleryScreen';

export default function HomeScreen() {
  return (
    <AuthenticationFlow>
      <GalleryScreen />
    </AuthenticationFlow>
  );
}