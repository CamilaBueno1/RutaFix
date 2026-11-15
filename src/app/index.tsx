import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { ActivityIndicator, View } from 'react-native';

export default function RootIndex() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(app)" />;
}
