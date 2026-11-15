import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface ContextoAutenticacionTipo {
  sesion: Session | null;
  usuario: User | null;
  estaCargando: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  registrarse: (correo: string, contrasena: string) => Promise<{ requiereConfirmacion?: boolean }>;
  cerrarSesion: () => Promise<void>;
  // Propiedades habituales de Auth
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (correo: string, contrasena: string) => Promise<void>;
  signUp: (correo: string, contrasena: string) => Promise<{ requiereConfirmacion?: boolean }>;
  signOut: () => Promise<void>;
}

const ContextoAutenticacion = createContext<ContextoAutenticacionTipo | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [estaCargando, setEstaCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session);
      setUsuario(session?.user ?? null);
      setEstaCargando(false);
    }).catch(() => {
      setEstaCargando(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, session) => {
      setSesion(session);
      setUsuario(session?.user ?? null);
      setEstaCargando(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const iniciarSesion = async (correo: string, contrasena: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: contrasena,
    });
    if (error) throw error;
  };

  const registrarse = async (correo: string, contrasena: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: correo.trim(),
      password: contrasena,
    });
    if (error) throw error;

    return {
      requiereConfirmacion: !data.session,
    };
  };

  const cerrarSesion = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const valor = useMemo(
    () => ({
      sesion,
      usuario,
      estaCargando,
      iniciarSesion,
      registrarse,
      cerrarSesion,
      session: sesion,
      user: usuario,
      isLoading: estaCargando,
      signIn: iniciarSesion,
      signUp: registrarse,
      signOut: cerrarSesion,
    }),
    [sesion, usuario, estaCargando]
  );

  return <ContextoAutenticacion.Provider value={valor}>{children}</ContextoAutenticacion.Provider>;
}

export function useAuth() {
  const contexto = useContext(ContextoAutenticacion);
  if (!contexto) {
    throw new Error('useAuth debe ser utilizado dentro de AuthProvider');
  }
  return contexto;
}

export const ProveedorAutenticacion = AuthProvider;
export const useAutenticacion = useAuth;
