import { MainApp } from '@/components/MainApp';
import { AuthenticationFlow } from '@/components/AuthenticationFlow';

export default function HomeScreen() {
  return (
    <AuthenticationFlow>
      <MainApp />
    </AuthenticationFlow>
  );
} 