import { Ionicons } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { EntradaTexto } from '@/components/ui/EntradaTexto';
import { Pantalla } from '@/components/ui/Pantalla';
import { Texto as Text } from '@/components/ui/Texto';
import { EncabezadoAutenticacion } from '@/components/auth/AutenticacionVisual';
import { supabase } from '@/lib/supabase';

const recoveryRedirect = `${makeRedirectUri({ path: 'auth/callback' })}?flow=password-recovery`;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSendLink = async () => {
    const address = email.trim();
    if (!address) {
      setErrorMessage('Ingresa el correo electrónico de tu cuenta.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setSent(false);
      const { error } = await supabase.auth.resetPasswordForEmail(address, {
        redirectTo: recoveryRedirect,
      });
      if (error) throw error;
      setSent(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo enviar el enlace. Inténtalo de nuevo.'
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
          <View className="flex-1 bg-[#F0F9FF]">
            <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Volver"
                className="h-11 w-11 items-center justify-center rounded-full border border-ruta-blue-line bg-white shadow-sm"
                onPress={() => router.replace('/(auth)/login')}
              >
                <Ionicons name="arrow-back" size={21} color="#192841" />
              </TouchableOpacity>
              <View className="items-center">
                <Text className="rounded-full bg-[#E0F2FE] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0369A1]">
                  Seguridad y acceso
                </Text>
                <Text className="mt-1 text-sm font-semibold text-ruta-navy">
                  Recuperar contraseña
                </Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-full border border-ruta-blue-line bg-white">
                <Ionicons name="lock-closed" size={18} color="#2563EB" />
              </View>
            </View>

            <EncabezadoAutenticacion />

            <View className="-mt-2 flex-1 rounded-t-[32px] border-t border-[#E0F2FE] bg-white px-6 pb-8 pt-5 shadow-lg shadow-ruta-navy/10">
              <View className="mb-4 h-16 w-16 items-center justify-center self-center rounded-2xl border border-[#BFDBFE] bg-ruta-blue-soft">
                <Ionicons name="lock-open" size={30} color="#1D4ED8" />
              </View>
              <View className="mb-5 items-center">
                <Text className="text-center text-[22px] font-extrabold tracking-tight text-ruta-navy">
                  Recuperar contraseña
                </Text>
                <Text className="mt-1.5 max-w-[310px] text-center text-sm leading-5 text-ruta-blue-muted">
                  Ingresa el correo asociado a tu cuenta de RutaFix y te enviaremos un enlace seguro
                  para cambiarla.
                </Text>
              </View>

              {errorMessage ? (
                <View className="mb-4 flex-row items-start gap-2 rounded-xl border border-ruta-clay/30 bg-ruta-clay-soft p-3.5">
                  <Ionicons name="alert-circle-outline" size={18} color="#984629" />
                  <Text className="flex-1 text-xs leading-5 text-ruta-clay-dark">
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              {sent ? (
                <View className="mb-4 flex-row items-start gap-2 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] p-3.5">
                  <Ionicons name="mail-open-outline" size={18} color="#0284C7" />
                  <Text className="flex-1 text-xs leading-5 text-[#0369A1]">
                    Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu
                    contraseña.
                  </Text>
                </View>
              ) : null}

              <EntradaTexto
                variante="oficial"
                etiqueta="Correo electrónico"
                placeholder="ejemplo@correo.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                icono="mail"
                editable={!loading}
              />

              <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-3 py-2.5">
                <Ionicons name="shield-checkmark-outline" size={17} color="#0284C7" />
                <Text className="flex-1 text-xs font-medium text-[#0369A1]">
                  Verificaremos tu identidad de manera segura.
                </Text>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                className={`min-h-[52px] flex-row items-center justify-center gap-2 rounded-xl bg-ruta-navy-deep px-4 ${
                  loading ? 'opacity-70' : ''
                }`}
                onPress={() => void handleSendLink()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text className="text-sm font-bold text-white">
                      Enviar enlace de recuperación
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="link"
                className="mt-5 min-h-11 flex-row items-center justify-center gap-2"
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text className="text-[13px] text-ruta-blue-muted">
                  ¿Recordaste tu contraseña?
                </Text>
                <Text className="text-[13px] font-bold text-ruta-blue underline">
                  Iniciar sesión
                </Text>
              </TouchableOpacity>

              <View className="mt-2 flex-row items-start gap-3 rounded-2xl border border-ruta-blue-line bg-[#F8FAFC] p-3.5">
                <View className="h-9 w-9 items-center justify-center rounded-xl border border-ruta-blue-line bg-ruta-blue-soft">
                  <Ionicons name="headset-outline" size={19} color="#1D4ED8" />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-bold text-ruta-navy">
                    ¿Problemas con tu cuenta?
                  </Text>
                  <Text className="mt-0.5 text-xs leading-4 text-ruta-blue-muted">
                    Si no recibes el enlace, revisa la carpeta de correo no deseado.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}
