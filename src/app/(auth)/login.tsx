import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { EntradaTexto } from '@/components/ui/EntradaTexto';
import { Boton } from '@/components/ui/Boton';
import { BotonGoogle } from '@/components/ui/BotonGoogle';
import { Pantalla } from '@/components/ui/Pantalla';
import { Texto as Text } from '@/components/ui/Texto';
import { iniciarSesionConGoogle } from '@/services/googleAuth.service';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <Pantalla className="bg-ruta-sage-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
      <ScrollView
        contentContainerClassName="flex-grow"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-ruta-sage-dark px-5 pb-12 pt-5">
          <View className="mb-9 flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <MaterialCommunityIcons name="map-marker-path" size={27} color="#FFFFFF" />
            </View>
            <View className="flex-row items-baseline">
              <Text className="text-[27px] font-extrabold tracking-tight text-white">RutaFix</Text>
            </View>
          </View>
          <Text className="text-[27px] font-bold leading-9 text-white">
            Tu vehículo, siempre en buenas manos.
          </Text>
          <Text className="mt-2 text-sm leading-6 text-white/75">
            Gestiona el mantenimiento de tu vehículo y mantén cada viaje en el camino.
          </Text>
        </View>

        <View className="-mt-7 flex-1 rounded-t-[30px] bg-ruta-surface px-5 pb-8 pt-7">
          <Text className="text-[22px] font-bold text-ruta-ink">Bienvenido a RutaFix</Text>
          <Text className="mb-5 mt-1 text-xs leading-5 text-ruta-muted">
            Inicia sesión para continuar
          </Text>

          {errorMessage ? (
            <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-ruta-clay/30 bg-ruta-clay-soft p-3.5">
              <Ionicons name="alert-circle-outline" size={19} color="#984629" />
              <Text className="flex-1 text-xs font-medium text-ruta-clay-dark">{errorMessage}</Text>
            </View>
          ) : null}

          <BotonGoogle onPress={handleGoogleLogin} cargando={loading} />

          <View className="my-5 flex-row items-center">
            <View className="h-px flex-1 bg-ruta-line" />
            <Text className="mx-3 text-xs font-medium text-ruta-muted">
              O continúa con tu correo
            </Text>
            <View className="h-px flex-1 bg-ruta-line" />
          </View>

          <EntradaTexto
            etiqueta="Correo electrónico"
            placeholder="ejemplo@correo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icono="mail-outline"
          />

          <EntradaTexto
            etiqueta="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icono="lock-closed-outline"
          />

          <Boton
            titulo="Iniciar sesión"
            onPress={handleLogin}
            cargando={loading}
            icono="arrow-forward"
            clasePersonalizada="mt-1"
          />
          <View className="mt-6 flex-row items-center justify-center">
            <Text className="text-sm text-ruta-muted">¿No tienes una cuenta? </Text>
            <TouchableOpacity
              accessibilityRole="link"
              onPress={() => router.push('/(auth)/register')}
            >
              <Text className="text-sm font-bold text-ruta-sage-dark">Regístrate</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}
