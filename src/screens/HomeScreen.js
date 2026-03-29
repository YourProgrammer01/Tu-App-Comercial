import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getVentasHoy, getProductos, formatPesos } from '../storage/db';

export default function HomeScreen({ navigation }) {
  const [resumen, setResumen] = useState({ ventas: 0, total: 0, productos: 0 });

  useFocusEffect(useCallback(() => {
    (async () => {
      const [ventasHoy, productos] = await Promise.all([getVentasHoy(), getProductos()]);
      const total = ventasHoy.reduce((acc, v) => acc + v.total, 0);
      setResumen({ ventas: ventasHoy.length, total, productos: productos.length });
    })();
  }, []));

  const fecha = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const fechaCapitalizada = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>ComercioApp</Text>
          <Text style={styles.fecha}>{fechaCapitalizada}</Text>
        </View>
        <TouchableOpacity style={styles.camaraBtn} onPress={() => navigation.navigate('Venta', { scanMode: true })}>
          <Ionicons name="camera-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.acciones}>
        <TouchableOpacity style={styles.btnNuevaVenta} onPress={() => navigation.navigate('Venta')}>
          <Ionicons name="cart-outline" size={22} color="#fff" />
          <Text style={styles.btnNuevaVentaText}>Nueva Venta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnAgregar} onPress={() => navigation.navigate('Catalogo', { agregar: true })}>
          <Ionicons name="add" size={22} color="#000" />
          <Text style={styles.btnAgregarText}>Agregar Producto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="trending-up-outline" size={18} color="#000" />
          <Text style={styles.cardTitulo}> Resumen de Hoy</Text>
        </View>
        <View style={styles.resumenRow}>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenNum}>{resumen.ventas}</Text>
            <Text style={styles.resumenLabel}>Ventas</Text>
          </View>
          <View style={styles.resumenItem}>
            <Text style={[styles.resumenNum, styles.verde]}>{formatPesos(resumen.total)}</Text>
            <Text style={styles.resumenLabel}>Total</Text>
          </View>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenNum}>{resumen.productos}</Text>
            <Text style={styles.resumenLabel}>Productos</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="cube-outline" size={18} color="#000" />
            <Text style={styles.cardTitulo}> Inventario</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Catalogo')}>
            <Text style={styles.verTodo}>Ver todo →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inventarioRow}>
          <Ionicons name="cube-outline" size={20} color="#4A90D9" />
          <Text style={styles.inventarioText}>Total de Productos</Text>
          <Text style={styles.inventarioNum}>{resumen.productos}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8EEF4' },
  content: { padding: 16, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  titulo: { fontSize: 24, fontWeight: 'bold' },
  fecha: { fontSize: 13, color: '#666', marginTop: 2 },
  camaraBtn: { padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#fff' },
  acciones: { flexDirection: 'row', gap: 10 },
  btnNuevaVenta: { flex: 1, backgroundColor: '#000', borderRadius: 12, padding: 16, alignItems: 'center', gap: 6 },
  btnNuevaVentaText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  btnAgregar: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#ddd' },
  btnAgregarText: { color: '#000', fontWeight: '600', fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitulo: { fontSize: 16, fontWeight: '600' },
  verTodo: { color: '#555', fontSize: 13 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-around' },
  resumenItem: { alignItems: 'center' },
  resumenNum: { fontSize: 28, fontWeight: 'bold' },
  resumenLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  verde: { color: '#2E9E4F' },
  inventarioRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F8', borderRadius: 10, padding: 12, gap: 10 },
  inventarioText: { flex: 1, fontSize: 14, fontWeight: '500' },
  inventarioNum: { fontSize: 18, fontWeight: 'bold' },
});
