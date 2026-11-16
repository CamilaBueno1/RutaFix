import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { EntradaTexto } from '@/components/ui/EntradaTexto';
import { BotonGoogle } from '@/components/ui/BotonGoogle';
import { Pantalla } from '@/components/ui/Pantalla';
import { Texto as Text } from '@/components/ui/Texto';
import { iniciarSesionConGoogle } from '@/services/googleAuth.service';
import { Ionicons } from '@expo/vector-icons';
import {
  EncabezadoAutenticacion,
  IlustracionAutenticacion,
  OlasAutenticacion,
} from '@/components/auth/AutenticacionVisual';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordarme, setRecordarme] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await signIn(email, password);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error al iniciar sesión. Verifica tus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await iniciarSesionConGoogle();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pantalla className="bg-[#DFEEFC]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 bg-[#F8FBFF]">
            <EncabezadoAutenticacion />
            <IlustracionAutenticacion />

            <View className="-mt-7 flex-1 rounded-t-[36px] bg-white px-7 pb-8 pt-3.5 shadow-lg shadow-ruta-navy/10">
              <View className="mb-4 h-1 w-11 self-center rounded-full bg-ruta-blue-line" />
              <View className="mb-5 items-center">
                <Text className="text-center text-[25px] font-extrabold tracking-tight text-ruta-navy">
                  ¡Bienvenido a RutaFix!
                </Text>
                <Text className="mt-1 text-center text-sm text-ruta-blue-muted">
                  Ingresa a tu cuenta para continuar
                </Text>
              </View>

              {errorMessage ? (
                <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-ruta-clay/30 bg-ruta-clay-soft p-3.5">
                  <Ionicons name="alert-circle-outline" size={19} color="#984629" />
                  <Text className="flex-1 text-xs font-medium text-ruta-clay-dark">{errorMessage}</Text>
                </View>
              ) : null}

              <BotonGoogle onPress={handleGoogleLogin} cargando={loading} variante="oficial" />

              <View className="my-4 flex-row items-center">
                <View className="h-px flex-1 bg-ruta-blue-line" />
                <Text className="mx-3 text-[13px] font-medium text-[#7E8F9E]">
                  O continúa con tu correo
                </Text>
                <View className="h-px flex-1 bg-ruta-blue-line" />
              </View>

              <EntradaTexto
                variante="oficial"
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                icono="mail"
              />

              <EntradaTexto
                variante="oficial"
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icono="lock-closed"
              />

              <View className="mb-4 mt-1 flex-row items-center justify-between">
                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: recordarme }}
                  className="flex-row items-center gap-2.5"
                  onPress={() => setRecordarme((checked) => !checked)}
                >
                  <View
                    className={`h-4 w-4 items-center justify-center rounded border ${
                      recordarme ? 'border-ruta-blue bg-ruta-blue' : 'border-[#BAC7D5] bg-white'
                    }`}
                  >
                    {recordarme ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
                  </View>
                  <Text className="text-[13.5px] font-medium text-ruta-navy">Recordarme</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="link"
                  onPress={() => router.push('/(auth)/forgot-password')}
                  hitSlop={8}
                >
                  <Text className="text-right text-[13px] font-semibold text-ruta-blue">
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                className={`min-h-[56px] flex-row items-center justify-center gap-2.5 rounded-full bg-ruta-navy px-5 shadow-lg shadow-ruta-navy/30 ${
                  loading ? 'opacity-70' : ''
                }`}
                onPress={() => void handleLogin()}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text className="text-base font-bold text-white">Iniciar sesión</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <View className="mb-1 mt-5 flex-row items-center justify-center">
                <Text className="text-sm text-[#34465E]">¿Aún no tienes una cuenta? </Text>
                <TouchableOpacity
                  accessibilityRole="link"
                  onPress={() => router.push('/(auth)/register')}
                >
                  <Text className="text-sm font-bold text-ruta-blue underline">Regístrate</Text>
                </TouchableOpacity>
              </View>
            </View>

            <OlasAutenticacion />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}
