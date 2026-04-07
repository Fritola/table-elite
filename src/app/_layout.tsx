import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      // Solicitar permissão de rastreamento no iOS
      await requestTrackingPermissionsAsync();
      
      // Inicializar o SDK de anúncios apenas se estiver disponível (Build Real)
      try {
        const mobileAds = require('react-native-google-mobile-ads').default;
        if (mobileAds) {
          await mobileAds().initialize();
          console.log('✅ Google Ads Initialized');
        }
      } catch (e: any) {
        // Silêncio no Expo Go
      }
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="player/[id]" options={{ presentation: 'modal' }} />
                <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
              </Stack>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
