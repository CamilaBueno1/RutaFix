import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { EntradaTexto } from '@/components/ui/EntradaTexto';
import { Pantalla } from '@/components/ui/Pantalla';
import { Texto as Text } from '@/components/ui/Texto';
import {
  EncabezadoAutenticacion,
  IlustracionAutenticacion,
} from '@/components/auth/AutenticacionVisual';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdatePassword = async () => {
    if (!user) {
      setErrorMessage('El enlace de recuperación no es válido o ya expiró.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      Alert.alert('Contraseña actualizada', 'Ya puedes continuar en RutaFix.', [
        { text: 'Continuar', onPress: () => router.replace('/(app)') },
      ]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo actualizar la contraseña.'
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
            <View className="-mt-7 flex-1 rounded-t-[36px] bg-white px-7 pb-8 pt-5 shadow-lg shadow-ruta-navy/10">
              <View className="mb-4 h-16 w-16 items-center justify-center self-center rounded-2xl border border-[#BFDBFE] bg-ruta-blue-soft">
                <Ionicons name="lock-closed" size={28} color="#1D4ED8" />
              </View>
              <Text className="mb-1 text-center text-[22px] font-extrabold text-ruta-navy">
                Crea una nueva contraseña
              </Text>
              <Text className="mb-5 text-center text-sm leading-5 text-ruta-blue-muted">
                Elige una contraseña segura para volver a tu cuenta.
              </Text>

              {isLoading ? (
                <ActivityIndicator size="large" color="#2563EB" />
              ) : user ? (
                <>
                  {errorMessage ? (
                    <View className="mb-4 flex-row items-start gap-2 rounded-xl border border-ruta-clay/30 bg-ruta-clay-soft p-3.5">
                      <Ionicons name="alert-circle-outline" size={18} color="#984629" />
                      <Text className="flex-1 text-xs leading-5 text-ruta-clay-dark">
                        {errorMessage}
                      </Text>
                    </View>
                  ) : null}
                  <EntradaTexto
                    variante="oficial"
                    etiqueta="Nueva contraseña"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    icono="lock-closed"
                    editable={!loading}
                  />
                  <EntradaTexto
                    variante="oficial"
                    etiqueta="Confirmar contraseña"
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    icono="shield-checkmark"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    accessibilityRole="button"
                    className={`mt-1 min-h-[56px] flex-row items-center justify-center gap-2 rounded-full bg-ruta-navy px-5 ${
                      loading ? 'opacity-70' : ''
                    }`}
                    onPress={() => void handleUpdatePassword()}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text className="text-base font-bold text-white">Guardar contraseña</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View className="mb-4 flex-row items-start gap-2 rounded-xl border border-ruta-clay/30 bg-ruta-clay-soft p-3.5">
                    <Ionicons name="alert-circle-outline" size={18} color="#984629" />
                    <Text className="flex-1 text-xs leading-5 text-ruta-clay-dark">
                      El enlace de recuperación no es válido o ya expiró.
                    </Text>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="link"
                    className="min-h-12 items-center justify-center rounded-xl bg-ruta-navy-deep px-4"
                    onPress={() => router.replace('/(auth)/forgot-password')}
                  >
                    <Text className="text-sm font-bold text-white">Solicitar otro enlace</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}
