import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import CatalogoScreen from './src/screens/CatalogoScreen';
import VentaScreen from './src/screens/VentaScreen';
import ResumenScreen from './src/screens/ResumenScreen';
import ReporteScreen from './src/screens/ReporteScreen';
import { requestPermissions, scheduleReporteDiario } from './src/notifications/scheduler';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TABS = [
  { name: 'Inicio', component: HomeScreen, icon: 'home' },
  { name: 'Catalogo', component: CatalogoScreen, icon: 'cube-outline', label: 'Catálogo' },
  { name: 'Venta', component: VentaScreen, icon: 'cart-outline' },
  { name: 'Resumen', component: ResumenScreen, icon: 'bar-chart-outline' },
  { name: 'Reporte', component: ReporteScreen, icon: 'clipboard-outline' },
];

export default function App() {
  useEffect(() => {
    (async () => {
      const granted = await requestPermissions();
      if (granted) await scheduleReporteDiario();
    })();
  }, []);

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
          tabBarLabel: ({ color }) => {
            const tab = TABS.find(t => t.name === route.name);
            return <Ionicons name={tab?.icon} size={0} color={color} />;
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
