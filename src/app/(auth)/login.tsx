import React, { useState } from 'react';
import {
  View,
  Text,
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
import { iniciarSesionConGoogle } from '@/services/googleAuth.service';
import { Ionicons } from '@expo/vector-icons';

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-100"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-blue-50 border border-blue-200 justify-center items-center mb-4">
            <Ionicons name="speedometer-outline" size={44} color="#2563EB" />
          </View>
          <Text className="text-2xl font-extrabold text-slate-900 text-center">
            Cuida lo que te mueve
          </Text>
          <Text className="text-sm text-slate-500 text-center mt-1.5 max-w-[280px]">
            Control inteligente de mantenimiento para tus vehículos
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
          <Text className="text-xl font-bold text-slate-800 mb-5">
            Iniciar Sesión
          </Text>

          {errorMessage ? (
            <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 p-3 rounded-xl mb-4">
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text className="text-red-700 text-xs flex-1 font-medium">{errorMessage}</Text>
            </View>
          ) : null}

          <EntradaTexto
            etiqueta="Correo electrónico"
            placeholder="ejemplo@correo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <EntradaTexto
            etiqueta="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Boton
            titulo="Ingresar a la app"
            onPress={handleLogin}
            cargando={loading}
            clasePersonalizada="mt-2"
          />

          <View className="my-5 flex-row items-center">
            <View className="h-px flex-1 bg-slate-200" />
            <Text className="mx-3 text-xs font-medium text-slate-400">O CONTINÚA CON</Text>
            <View className="h-px flex-1 bg-slate-200" />
          </View>
          <BotonGoogle onPress={handleGoogleLogin} cargando={loading} />

          <View className="flex-row justify-center items-center mt-5">
            <Text className="text-slate-500 text-sm">¿Aún no tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-blue-600 font-bold text-sm">Regístrate gratis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
