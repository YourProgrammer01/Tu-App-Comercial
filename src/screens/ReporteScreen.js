import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getVentasHoy, getProductos, formatPesos } from '../storage/db';
import { scheduleReporteDiario } from '../notifications/scheduler';

export default function ReporteScreen() {
  const [reporte, setReporte] = useState([]);
  const [totalVentas, setTotalVentas] = useState(0);
  const [totalMonto, setTotalMonto] = useState(0);
  const fecha = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useFocusEffect(useCallback(() => { generarReporte(); }, []));

  const generarReporte = async () => {
    const [ventasHoy, productos] = await Promise.all([getVentasHoy(), getProductos()]);
    const mapa = {};
    ventasHoy.forEach(v => {
      v.items.forEach(item => {
        if (!mapa[item.id]) mapa[item.id] = { ...item, totalCantidad: 0, totalMonto: 0 };
        mapa[item.id].totalCantidad += item.cantidad;
        mapa[item.id].totalMonto += item.precio * item.cantidad;
      });
    });
    const lista = Object.values(mapa).sort((a, b) => b.totalCantidad - a.totalCantidad);
    // Agregar stock actual
    const listaConStock = lista.map(item => {
      const prod = productos.find(p => p.id === item.id);
      return { ...item, stockActual: prod ? prod.stock : 0 };
    });
    setReporte(listaConStock);
    setTotalVentas(ventasHoy.length);
    setTotalMonto(ventasHoy.reduce((acc, v) => acc + v.total, 0));
  };

  const activarNotificacion = async () => {
    await scheduleReporteDiario();
    Alert.alert('✅ Listo', 'Recibirás el reporte diario a las 21:00 hs');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Reporte Diario</Text>
          <Text style={styles.fecha}>{fecha.charAt(0).toUpperCase() + fecha.slice(1)}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={activarNotificacion}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalVentas}</Text>
          <Text style={styles.statLabel}>Ventas del día</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, styles.verde]}>{formatPesos(totalMonto)}</Text>
          <Text style={styles.statLabel}>Total recaudado</Text>
        </View>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>📦 Productos a Reponer</Text>
        <Text style={styles.seccionSub}>Productos vendidos hoy — reponé para mañana</Text>
      </View>

      <FlatList
        data={reporte}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 8 }}
        ListEmptyComponent={<Text style={styles.empty}>No hubo ventas hoy todavía</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <Text style={styles.prodNombre}>{item.nombre}</Text>
              <Text style={styles.prodDetalle}>Vendido: <Text style={styles.bold}>{item.totalCantidad} unidades</Text></Text>
              <Text style={styles.prodDetalle}>Stock actual: <Text style={[styles.bold, item.stockActual < 3 && styles.rojo]}>{item.stockActual}</Text></Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.monto}>{formatPesos(item.totalMonto)}</Text>
              {item.stockActual < 3 && (
                <View style={styles.alertaBadge}>
                  <Text style={styles.alertaText}>⚠️ Reponer</Text>
                </View>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8EEF4' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingTop: 50 },
  titulo: { fontSize: 22, fontWeight: 'bold' },
  fecha: { fontSize: 12, color: '#666', marginTop: 2 },
  notifBtn: { backgroundColor: '#000', borderRadius: 10, padding: 10 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2, textAlign: 'center' },
  verde: { color: '#2E9E4F' },
  seccion: { paddingHorizontal: 16, marginBottom: 4 },
  seccionTitulo: { fontSize: 15, fontWeight: '700' },
  seccionSub: { fontSize: 12, color: '#888' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  prodNombre: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  prodDetalle: { fontSize: 12, color: '#666' },
  bold: { fontWeight: 'bold', color: '#333' },
  rojo: { color: '#e74c3c' },
  monto: { fontSize: 15, fontWeight: 'bold', color: '#2E9E4F' },
  alertaBadge: { backgroundColor: '#FFF3CD', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  alertaText: { fontSize: 11, color: '#856404', fontWeight: '600' },
});
