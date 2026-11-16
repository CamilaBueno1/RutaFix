import React, { useState } from 'react';
import {
  ActivityIndicator,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
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

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Por favor completa todos los campos.');
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
      const res = await signUp(email, password, name);

      if (res?.requiereConfirmacion) {
        Alert.alert(
          'Registro casi listo',
          'Hemos enviado un correo de verificación. Por favor confirma tu cuenta o desactiva la confirmación en Supabase si estás en modo pruebas.',
          [{ text: 'Entendido', onPress: () => router.replace('/(auth)/login') }]
        );
      } else {
        Alert.alert(
          '¡Cuenta creada!',
          'Tu cuenta fue creada exitosamente. Ahora puedes ingresar.',
          [{ text: 'Ingresar', onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error al crear la cuenta. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await iniciarSesionConGoogle();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo continuar con Google.');
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
                  ¡Crea tu cuenta en RutaFix!
                </Text>
                <Text className="mt-1 text-center text-sm text-ruta-blue-muted">
                  Empieza a gestionar el mantenimiento de tu vehículo
                </Text>
              </View>

              {errorMessage ? (
                <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-ruta-clay/30 bg-ruta-clay-soft p-3.5">
                  <Ionicons name="alert-circle-outline" size={19} color="#984629" />
                  <Text className="flex-1 text-xs font-medium text-ruta-clay-dark">
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              <BotonGoogle onPress={handleGoogleRegister} cargando={loading} variante="oficial" />

              <View className="my-4 flex-row items-center">
                <View className="h-px flex-1 bg-ruta-blue-line" />
                <Text className="mx-3 text-[13px] font-medium text-[#7E8F9E]">
                  O regístrate con tu correo
                </Text>
                <View className="h-px flex-1 bg-ruta-blue-line" />
              </View>

              <EntradaTexto
                variante="oficial"
                etiqueta="Nombre completo"
                placeholder="Ej. Camila Rivera"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                icono="person"
              />

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
              />

              <EntradaTexto
                variante="oficial"
                etiqueta="Contraseña"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icono="lock-closed"
              />

              <EntradaTexto
                variante="oficial"
                etiqueta="Confirmar contraseña"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                icono="shield-checkmark"
              />

              <TouchableOpacity
                accessibilityRole="button"
                className={`mt-1 min-h-[56px] flex-row items-center justify-center gap-2.5 rounded-full bg-ruta-navy px-5 shadow-lg shadow-ruta-navy/30 ${
                  loading ? 'opacity-70' : ''
                }`}
                onPress={() => void handleRegister()}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text className="text-base font-bold text-white">Crear mi cuenta</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <View className="mb-1 mt-5 flex-row items-center justify-center">
                <Text className="text-sm text-[#34465E]">¿Ya tienes una cuenta? </Text>
                <TouchableOpacity
                  accessibilityRole="link"
                  onPress={() => router.replace('/(auth)/login')}
                >
                  <Text className="text-sm font-bold text-ruta-blue underline">Inicia sesión</Text>
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
