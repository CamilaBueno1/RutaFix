import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { useVehiculos } from '@/hooks/useVehiculos';
import { sincronizarNotificacionesMantenimiento } from '@/services/notificaciones.service';
import { TIPOS_VEHICULOS, type Vehiculo } from '@/services/vehiculos.service';
import type { TipoVehiculo } from '@/types/database.types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VehiclesListScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { vehiculos, cargando, error, recargar } = useVehiculos();

  const [selectedType, setSelectedType] = useState<TipoVehiculo | 'todos'>('todos');

  useFocusEffect(
    useCallback(() => {
      sincronizarNotificacionesMantenimiento().catch((error: unknown) => {
        console.warn('No se pudieron sincronizar los avisos de mantenimiento:', error);
      });
    }, [])
  );

  const filteredVehicles = useMemo(() => {
    if (selectedType === 'todos') return vehiculos;
    return vehiculos.filter((v) => v.type === selectedType);
  }, [vehiculos, selectedType]);

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const getVehicleIcon = (type: TipoVehiculo) => {
    switch (type) {
      case 'car':
        return 'car-sport';
      case 'motorcycle':
        return 'bicycle';
      case 'bicycle':
        return 'bicycle-outline';
      case 'scooter':
        return 'flash';
      default:
        return 'car';
    }
  };

  const renderVehicleCard = ({ item }: { item: Vehiculo }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 border border-slate-200/80 shadow-sm"
      activeOpacity={0.8}
      onPress={() => router.push(`/(app)/vehiculo/${item.id}`)}
    >
      <View className="flex-row items-center gap-3">
        <View className="w-11 h-11 rounded-full bg-blue-50 justify-center items-center">
          <Ionicons name={getVehicleIcon(item.type)} size={24} color="#2563EB" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-900">{item.name}</Text>
          <Text className="text-xs text-slate-500 mt-0.5">
            {[item.brand, item.model, item.year].filter(Boolean).join(' • ') || 'Sin detalles adicionales'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </View>

      <View className="h-px bg-slate-100 my-3" />

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="speedometer-outline" size={15} color="#475569" />
          <Text className="text-sm font-semibold text-slate-700">
            {item.current_km.toLocaleString()} km
          </Text>
        </View>

        {item.plate ? (
          <View className="bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
            <Text className="text-xs font-bold text-amber-900 tracking-wider">
              {item.plate.toUpperCase()}
            </Text>
          </View>
        ) : (
          <View className="bg-slate-100 px-2.5 py-1 rounded-md">
            <Text className="text-xs font-medium text-slate-600">
              {TIPOS_VEHICULOS.find((t) => t.valor === item.type)?.etiqueta || item.type}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row justify-between items-center px-5 pt-3 pb-4 bg-white border-b border-slate-200">
        <View>
          <Text className="text-xl font-extrabold text-slate-900">Cuida lo que te mueve</Text>
          <Text className="text-xs text-slate-500 mt-0.5 max-w-60" numberOfLines={1}>
            {user?.email || 'Mi garaje'}
          </Text>
        </View>
        <TouchableOpacity
          className="p-2 rounded-lg bg-red-50"
          onPress={handleSignOut}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Selector de filtros por tipo (RF-07) */}
      <View className="flex-row px-4 py-3 bg-white gap-2 flex-wrap border-b border-slate-100">
        <TouchableOpacity
          className={`px-3 py-1.5 rounded-full ${
            selectedType === 'todos' ? 'bg-blue-600' : 'bg-slate-100'
          }`}
          onPress={() => setSelectedType('todos')}
        >
          <Text
            className={`text-xs font-semibold ${
              selectedType === 'todos' ? 'text-white' : 'text-slate-600'
            }`}
          >
            Todos ({vehiculos.length})
          </Text>
        </TouchableOpacity>

        {TIPOS_VEHICULOS.map((tipo) => {
          const count = vehiculos.filter((v) => v.type === tipo.valor).length;
          const isActive = selectedType === tipo.valor;
          return (
            <TouchableOpacity
              key={tipo.valor}
              className={`px-3 py-1.5 rounded-full ${
                isActive ? 'bg-blue-600' : 'bg-slate-100'
              }`}
              onPress={() => setSelectedType(tipo.valor)}
            >
              <Text
                className={`text-xs font-semibold ${
                  isActive ? 'text-white' : 'text-slate-600'
                }`}
              >
                {tipo.etiqueta} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? (
        <View className="bg-red-50 border border-red-200 p-3 mx-4 mt-2 rounded-xl">
          <Text className="text-red-700 text-xs font-medium">{error}</Text>
        </View>
      ) : null}

      {cargando && vehiculos.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-slate-500 text-sm mt-3">Cargando tus vehículos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVehicles}
          keyExtractor={(item) => item.id}
          renderItem={renderVehicleCard}
          contentContainerClassName="p-4 pb-28"
          refreshControl={
            <RefreshControl refreshing={cargando} onRefresh={recargar} colors={['#2563EB']} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-6">
              <View className="w-20 h-20 rounded-full bg-slate-100 justify-center items-center mb-4">
                <Ionicons name="car-outline" size={44} color="#94A3B8" />
              </View>
              <Text className="text-lg font-bold text-slate-800 mb-1.5">No tienes vehículos aquí</Text>
              <Text className="text-slate-500 text-sm text-center mb-5 leading-5 max-w-70">
                {selectedType === 'todos'
                  ? 'Registra tu primer auto, moto, bicicleta o scooter con el botón de abajo.'
                  : `No tienes registros en la categoría "${TIPOS_VEHICULOS.find((t) => t.valor === selectedType)?.etiqueta}".`}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Agregar vehículo"
        className="absolute bottom-6 right-5 flex-row items-center gap-2 rounded-full bg-slate-950 px-5 py-3.5 shadow-lg"
        activeOpacity={0.85}
        onPress={() => router.push('/vehiculo/formulario')}
      >
        <Ionicons name="add" size={22} color="#FFFFFF" />
        <Text className="text-sm font-bold text-white">Agregar vehículo</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
