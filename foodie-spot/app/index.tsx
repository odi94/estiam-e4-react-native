import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/theme-context';

export default function Index() {
  const { isAuthenticated, isLoading, isOnboardingSeen } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  if (!isOnboardingSeen) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(auth)/login" />;
}
