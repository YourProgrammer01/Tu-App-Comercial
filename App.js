import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import CatalogoScreen from './src/screens/CatalogoScreen';
import VentaScreen from './src/screens/VentaScreen';
import ResumenScreen from './src/screens/ResumenScreen';
import ReporteScreen from './src/screens/ReporteScreen';
import ActivacionScreen from './src/screens/ActivacionScreen';
import { requestPermissions, scheduleReporteDiario } from './src/notifications/scheduler';
import { isActivada } from './src/storage/licencia';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Inicio', component: HomeScreen, icon: 'home' },
  { name: 'Catalogo', component: CatalogoScreen, icon: 'cube-outline', label: 'Catálogo' },
  { name: 'Venta', component: VentaScreen, icon: 'cart-outline' },
  { name: 'Resumen', component: ResumenScreen, icon: 'bar-chart-outline' },
  { name: 'Reporte', component: ReporteScreen, icon: 'clipboard-outline' },
];

export default function App() {
  const [activada, setActivada] = useState(null);

  useEffect(() => {
    isActivada().then(setActivada);
  }, []);

  useEffect(() => {
    if (activada) {
      (async () => {
        const granted = await requestPermissions();
        if (granted) await scheduleReporteDiario();
      })();
    }
  }, [activada]);

  if (activada === null) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8EEF4' }}>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );

  if (!activada) return (
    <ActivacionScreen onActivada={() => setActivada(true)} />
  );

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#000',
          tabBarInactiveTintColor: '#aaa',
          tabBarStyle: { borderTopWidth: 1, borderTopColor: '#eee', height: 60, paddingBottom: 8 },
          tabBarIcon: ({ color, size }) => {
            const tab = TABS.find(t => t.name === route.name);
            return <Ionicons name={tab?.icon} size={size} color={color} />;
          },
        })}
      >
        {TABS.map(tab => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{ tabBarLabel: tab.label || tab.name }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
