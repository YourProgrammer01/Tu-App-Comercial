import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getVentas, formatPesos } from '../storage/db';

const FILTROS = ['Hoy', 'Semana', 'Mes'];

export default function ResumenScreen() {
  const [ventas, setVentas] = useState([]);
  const [filtro, setFiltro] = useState('Hoy');

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const cargar = async () => setVentas(await getVentas());

  const filtrarVentas = () => {
    const ahora = new Date();
    return ventas.filter(v => {
      const fecha = new Date(v.fecha);
      if (filtro === 'Hoy') return fecha.toDateString() === ahora.toDateString();
      if (filtro === 'Semana') {
        const hace7 = new Date(ahora); hace7.setDate(ahora.getDate() - 7);
        return fecha >= hace7;
      }
      if (filtro === 'Mes') return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
      return true;
    });
  };

  const ventasFiltradas = filtrarVentas();
  const totalGeneral = ventasFiltradas.reduce((acc, v) => acc + v.total, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Resumen</Text>

      <View style={styles.filtros}>
        {FILTROS.map(f => (
          <TouchableOpacity key={f} style={[styles.filtroBtn, filtro === f && styles.filtroBtnActivo]} onPress={() => setFiltro(f)}>
            <Text style={[styles.filtroText, filtro === f && styles.filtroTextActivo]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{ventasFiltradas.length}</Text>
          <Text style={styles.statLabel}>Ventas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, styles.verde]}>{formatPesos(totalGeneral)}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <FlatList
        data={[...ventasFiltradas].reverse()}
        keyExtractor={v => String(v.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={<Text style={styles.empty}>No hay ventas en este período</Text>}
        renderItem={({ item }) => (
          <View style={styles.ventaCard}>
            <View style={styles.ventaHeader}>
              <Text style={styles.ventaFecha}>{new Date(item.fecha).toLocaleString('es-AR')}</Text>
              <Text style={styles.ventaTotal}>{formatPesos(item.total)}</Text>
            </View>
            {item.items.map((i, idx) => (
              <Text key={idx} style={styles.ventaItem}>• {i.nombre} x{i.cantidad} — {formatPesos(i.precio * i.cantidad)}</Text>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8EEF4' },
  titulo: { fontSize: 22, fontWeight: 'bold', padding: 16, paddingTop: 50 },
  filtros: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filtroBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center' },
  filtroBtnActivo: { backgroundColor: '#000' },
  filtroText: { fontWeight: '600', color: '#555' },
  filtroTextActivo: { color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 4 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  verde: { color: '#2E9E4F' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  ventaCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  ventaHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ventaFecha: { fontSize: 12, color: '#888' },
  ventaTotal: { fontSize: 15, fontWeight: 'bold', color: '#2E9E4F' },
  ventaItem: { fontSize: 13, color: '#444', marginTop: 2 },
});
