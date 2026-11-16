import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Texto as Text } from '@/components/ui/Texto';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useLinkingURL();
  const handledUrl = useRef<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!url || handledUrl.current === url) return;
    handledUrl.current = url;

    let active = true;

    const completeAuthentication = async () => {
      try {
        const { params, errorCode } = QueryParams.getQueryParams(url);
        if (errorCode) throw new Error(errorCode);

        const isPasswordRecovery =
          params.flow === 'password-recovery' || params.type === 'recovery';

        if (params.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) throw error;
        } else {
          const { access_token, refresh_token } = params;
          if (!access_token || !refresh_token) {
            throw new Error('El enlace de autenticación no contiene una sesión válida.');
          }

          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        }

        if (active) {
          router.replace(isPasswordRecovery ? '/(auth)/reset-password' : '/(app)');
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : 'No se pudo completar la autenticación.'
          );
        }
      }
    };

    void completeAuthentication();

    return () => {
      active = false;
    };
  }, [router, url]);

  return (
    <View className="flex-1 items-center justify-center bg-[#F8FBFF] p-6">
      {errorMessage ? (
        <Text className="text-center text-ruta-clay-dark">{errorMessage}</Text>
      ) : (
        <>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-4 text-center text-ruta-blue-muted">Confirmando tu cuenta...</Text>
        </>
      )}
    </View>
  );
}
