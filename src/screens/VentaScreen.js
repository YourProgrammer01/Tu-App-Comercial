import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, Modal, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getProductos, agregarVenta, saveProductos, formatPesos } from '../storage/db';

export default function VentaScreen({ navigation }) {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => { cargarProductos(); }, []);

  const cargarProductos = async () => setProductos(await getProductos());

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigoBarras && p.codigoBarras.includes(busqueda))
  );

  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) return prev.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito(prev => prev
      .map(i => i.id === id ? { ...i, cantidad: i.cantidad + delta } : i)
      .filter(i => i.cantidad > 0)
    );
  };

  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  const confirmarVenta = async () => {
    if (carrito.length === 0) return Alert.alert('Carrito vacío', 'Agregá productos para vender');
    Alert.alert('Confirmar venta', `Total: ${formatPesos(total)}`, [
      { text: 'Cancelar' },
      { text: 'Confirmar', onPress: async () => {
        await agregarVenta(carrito.map(i => ({ id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })), total);
        // Descontar stock
        const lista = await getProductos();
        await saveProductos(lista.map(p => {
          const item = carrito.find(i => i.id === p.id);
          return item ? { ...p, stock: Math.max(0, p.stock - item.cantidad) } : p;
        }));
        setCarrito([]);
        Alert.alert('✅ Venta registrada', `Se registró la venta por ${formatPesos(total)}`);
        navigation.navigate('Inicio');
      }}
    ]);
  };

  const onBarcode = async ({ data }) => {
    setScanning(false);
    const lista = await getProductos();
    const prod = lista.find(p => p.codigoBarras === data);
    if (prod) agregarAlCarrito(prod);
    else Alert.alert('Producto no encontrado', `Código: ${data}`);
  };

  const iniciarScan = async () => {
    if (!permission?.granted) await requestPermission();
    setScanning(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Nueva Venta</Text>
        <TouchableOpacity onPress={iniciarScan}>
          <Ionicons name="barcode-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#888" style={{ marginLeft: 10 }} />
        <TextInput style={styles.searchInput} placeholder="Buscar producto..." value={busqueda} onChangeText={setBusqueda} />
      </View>

      <FlatList
        data={productosFiltrados}
        keyExtractor={p => String(p.id)}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        ListEmptyComponent={<Text style={styles.empty}>No se encontraron productos</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productoCard} onPress={() => agregarAlCarrito(item)}>
            {item.foto ? <Image source={{ uri: item.foto }} style={styles.foto} /> : <View style={[styles.foto, styles.fotoPlaceholder]}><Ionicons name="cube-outline" size={20} color="#aaa" /></View>}
            <View style={styles.prodInfo}>
              <Text style={styles.prodNombre}>{item.nombre}</Text>
              <Text style={styles.prodPrecio}>{formatPesos(item.precio)}</Text>
              <Text style={styles.prodStock}>Stock: {item.stock}</Text>
            </View>
            <Ionicons name="add-circle-outline" size={28} color="#000" />
          </TouchableOpacity>
        )}
      />

      {carrito.length > 0 && (
        <View style={styles.carritoPanel}>
          <Text style={styles.carritoTitulo}>Carrito ({carrito.length})</Text>
          {carrito.map(item => (
            <View key={item.id} style={styles.carritoItem}>
              <Text style={styles.carritoNombre} numberOfLines={1}>{item.nombre}</Text>
              <View style={styles.cantidadRow}>
                <TouchableOpacity onPress={() => cambiarCantidad(item.id, -1)}><Ionicons name="remove-circle-outline" size={22} color="#e74c3c" /></TouchableOpacity>
                <Text style={styles.cantidad}>{item.cantidad}</Text>
                <TouchableOpacity onPress={() => cambiarCantidad(item.id, 1)}><Ionicons name="add-circle-outline" size={22} color="#2E9E4F" /></TouchableOpacity>
              </View>
              <Text style={styles.carritoSubtotal}>{formatPesos(item.precio * item.cantidad)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalMonto}>{formatPesos(total)}</Text>
          </View>
          <TouchableOpacity style={styles.btnConfirmar} onPress={confirmarVenta}>
            <Text style={styles.btnConfirmarText}>Confirmar Venta</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={scanning} animationType="slide">
        <CameraView style={{ flex: 1 }} onBarcodeScanned={onBarcode} barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39'] }}>
          <TouchableOpacity style={styles.cerrarScan} onPress={() => setScanning(false)}>
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>
          <View style={styles.scanOverlay}><Text style={styles.scanText}>Escaneá el código de barras</Text></View>
        </CameraView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8EEF4' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50 },
  titulo: { fontSize: 22, fontWeight: 'bold' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  searchInput: { flex: 1, padding: 10, fontSize: 15 },
  empty: { textAlign: 'center', color: '#888', marginTop: 30 },
  productoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  foto: { width: 48, height: 48, borderRadius: 8 },
  fotoPlaceholder: { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  prodInfo: { flex: 1 },
  prodNombre: { fontSize: 14, fontWeight: '600' },
  prodPrecio: { fontSize: 14, color: '#2E9E4F', fontWeight: 'bold' },
  prodStock: { fontSize: 11, color: '#888' },
  carritoPanel: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '50%' },
  carritoTitulo: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  carritoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  carritoNombre: { flex: 1, fontSize: 13 },
  cantidadRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cantidad: { fontSize: 15, fontWeight: 'bold', minWidth: 24, textAlign: 'center' },
  carritoSubtotal: { fontSize: 13, fontWeight: '600', minWidth: 70, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 2, borderTopColor: '#000' },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalMonto: { fontSize: 18, fontWeight: 'bold', color: '#2E9E4F' },
  btnConfirmar: { backgroundColor: '#000', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  btnConfirmarText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cerrarScan: { position: 'absolute', top: 50, right: 20 },
  scanOverlay: { position: 'absolute', bottom: 80, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 10 },
  scanText: { color: '#fff', fontSize: 14 },
});
