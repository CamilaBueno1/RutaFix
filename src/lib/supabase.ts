import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import type { Database } from '@/types/database.types';

const urlSupabase = process.env.EXPO_PUBLIC_SUPABASE_URL;
const clavePublicableSupabase = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!urlSupabase || !clavePublicableSupabase) {
  throw new Error(
    'Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.'
  );
}

/**
 * Cliente único de Supabase (Patrón Singleton)
 * Almacena y refresca automáticamente la sesión del usuario con AsyncStorage en dispositivos móviles.
 */
export const supabase = createClient<Database>(
  urlSupabase,
  clavePublicableSupabase,
  {
    auth: {
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
