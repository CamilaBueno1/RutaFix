import { FormularioVehiculo } from '@/components/vehiculos/FormularioVehiculo';
import { Pantalla } from '@/components/ui/Pantalla';
import { Ionicons } from '@expo/vector-icons';
import { type ErrorBoundaryProps, useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { Texto as Text } from '@/components/ui/Texto';

export default function NuevoVehiculoRoute() {
  const router = useRouter();

  return <FormularioVehiculo onClose={() => router.back()} />;
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <Pantalla className="justify-center bg-ruta-canvas px-6">
      <View className="items-center rounded-2xl border border-ruta-line bg-ruta-surface p-6 shadow-lg shadow-[#242725]/5">
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-xl bg-ruta-clay-soft">
          <Ionicons name="warning-outline" size={28} color="#984629" />
        </View>
        <Text className="text-center text-xl font-extrabold text-ruta-ink">
          No se pudo abrir el formulario
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-ruta-muted">
          La pantalla encontró un error. Intenta cargarla de nuevo.
        </Text>
        <Text selectable className="mt-3 w-full rounded-xl bg-ruta-inset p-3 text-xs text-ruta-muted">
          {error.message}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          className="mt-5 min-h-[52px] w-full items-center justify-center rounded-xl bg-ruta-sage py-3.5"
          onPress={() => {
            void retry();
          }}
        >
          <Text className="text-sm font-bold text-white">Reintentar</Text>
        </TouchableOpacity>
      </View>
    </Pantalla>
  );
}
