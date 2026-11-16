import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/context/AuthProvider';
import { Texto as Text } from '@/components/ui/Texto';

export function BotonCerrarSesion() {
  const { signOut } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const confirmarCierre = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await signOut();
      if (mounted.current) setVisible(false);
    } catch (error: unknown) {
      if (mounted.current) {
        setErrorMessage(
          error instanceof Error ? error.message : 'No se pudo cerrar la sesión. Intenta de nuevo.'
        );
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
        className="h-10 w-10 items-center justify-center rounded-full border border-ruta-blue-line bg-white shadow-sm"
        onPress={() => {
          setErrorMessage(null);
          setVisible(true);
        }}
        hitSlop={10}
      >
        <Ionicons name="log-out-outline" size={20} color="#475569" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!loading) setVisible(false);
        }}
      >
        <View className="flex-1 justify-center bg-[#0F172A]/55 px-6">
          <View className="w-full max-w-sm self-center rounded-[28px] border border-ruta-blue-line bg-white p-6 shadow-2xl shadow-ruta-navy/20">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl border border-ruta-blue-line bg-ruta-blue-soft">
              <Ionicons name="log-out-outline" size={25} color="#2563EB" />
              <View className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-white bg-ruta-amber" />
            </View>
            <Text className="text-[22px] font-extrabold text-ruta-navy">¿Cerrar sesión?</Text>
            <Text className="mt-2 text-sm leading-5 text-ruta-blue-muted">
              Tu garaje estará aquí cuando regreses.
            </Text>
            {errorMessage ? (
              <View className="mt-4 rounded-xl border border-ruta-clay/30 bg-ruta-clay-soft p-3">
                <Text className="text-xs font-medium text-ruta-clay-dark">{errorMessage}</Text>
              </View>
            ) : null}
            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                accessibilityRole="button"
                className="min-h-[52px] flex-1 items-center justify-center rounded-xl border border-ruta-blue-line bg-[#F1F5F9] py-3.5"
                onPress={() => setVisible(false)}
                disabled={loading}
              >
                <Text className="text-sm font-semibold text-ruta-navy">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                className={`min-h-[52px] flex-1 items-center justify-center rounded-xl bg-ruta-navy-deep py-3.5 ${
                  loading ? 'opacity-70' : ''
                }`}
                onPress={() => void confirmarCierre()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-sm font-semibold text-white">Cerrar sesión</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
