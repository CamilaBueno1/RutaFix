import { Image as ExpoImage } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { withUniwind } from 'uniwind';
import { Texto as Text } from '@/components/ui/Texto';

const Image = withUniwind(ExpoImage);

export function EncabezadoAutenticacion() {
  return (
    <View className="relative px-6 pt-5">
      <View className="absolute right-7 top-3 gap-2 opacity-35">
        {[0, 1, 2, 3].map((row) => (
          <View key={row} className="flex-row gap-2">
            {[0, 1, 2, 3].map((dot) => (
              <View key={dot} className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
            ))}
          </View>
        ))}
      </View>
      <View className="items-center">
        <View className="flex-row items-center gap-2.5">
          <View className="relative h-11 w-11 items-center justify-center">
            <MaterialCommunityIcons name="map-marker" size={46} color="#192841" />
            <MaterialCommunityIcons
              name="car-side"
              size={17}
              color="#FFFFFF"
              style={{ position: 'absolute', top: 10 }}
            />
            <View className="absolute bottom-1.5 h-[2px] w-5 rounded-full bg-ruta-amber" />
          </View>
          <Text className="text-[38px] font-extrabold leading-none tracking-tight text-ruta-navy">
            Ruta<Text className="text-ruta-blue">Fix</Text>
          </Text>
        </View>
        <Text className="mt-2 text-center text-[14px] font-medium text-ruta-blue-muted">
          Tu vehículo, siempre en buenas manos
        </Text>
        <View className="mt-1 h-[2px] w-32 rounded-full bg-ruta-amber" />
      </View>
    </View>
  );
}

export function IlustracionAutenticacion() {
  return (
    <View className="h-[225px] w-full px-2">
      <Image
        source={require('../../../assets/images/hero.png')}
        contentFit="contain"
        transition={180}
        className="h-full w-full"
        accessibilityLabel="Mecánicos revisan un vehículo en el taller"
      />
    </View>
  );
}

export function OlasAutenticacion() {
  return (
    <View className="relative -mt-4 h-10 overflow-hidden bg-[#B2D2F4]/80">
      <View className="absolute -top-4 h-10 w-[115%] rounded-[50%] bg-[#C5DEF8]/80" />
      <View className="absolute -top-2 left-[-10%] h-10 w-[120%] rounded-[50%] border-t-2 border-ruta-amber" />
    </View>
  );
}
