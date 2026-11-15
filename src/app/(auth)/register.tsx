import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { EntradaTexto } from '@/components/ui/EntradaTexto';
import { Boton } from '@/components/ui/Boton';
import { BotonGoogle } from '@/components/ui/BotonGoogle';
import { iniciarSesionConGoogle } from '@/services/googleAuth.service';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) {
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
      const res = await signUp(email, password);

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
      setErrorMessage(
        err instanceof Error ? err.message : 'No se pudo continuar con Google.'
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
        <TouchableOpacity
          className="flex-row items-center gap-2 mb-5"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="text-base text-slate-800 font-semibold">Volver al login</Text>
        </TouchableOpacity>

        <View className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
          <Text className="text-2xl font-extrabold text-slate-900">Crear nueva cuenta</Text>
          <Text className="text-sm text-slate-500 mt-1.5 mb-5 leading-5">
            Empieza a gestionar el mantenimiento de tus autos, motos, bicicletas o scooters
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
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <EntradaTexto
            etiqueta="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Boton
            titulo="Crear mi cuenta"
            onPress={handleRegister}
            cargando={loading}
            clasePersonalizada="mt-2"
          />

          <View className="my-5 flex-row items-center">
            <View className="h-px flex-1 bg-slate-200" />
            <Text className="mx-3 text-xs font-medium text-slate-400">O CONTINÚA CON</Text>
            <View className="h-px flex-1 bg-slate-200" />
          </View>
          <BotonGoogle onPress={handleGoogleRegister} cargando={loading} />

          <View className="flex-row justify-center items-center mt-5">
            <Text className="text-slate-500 text-sm">¿Ya tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text className="text-blue-600 font-bold text-sm">Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
