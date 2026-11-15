import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import type { Database } from '@/types/database.types';

const urlSupabase = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const claveAnonSupabase =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  'placeholder_anon_key';

/**
 * Cliente único de Supabase (Patrón Singleton)
 * Almacena y refresca automáticamente la sesión del usuario con AsyncStorage en dispositivos móviles.
 */
export const supabase = createClient<Database>(
  urlSupabase,
  claveAnonSupabase,
  {
    auth: {
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
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
