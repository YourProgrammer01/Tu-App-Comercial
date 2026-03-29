import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, Image, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { getProductos, saveProductos, formatPesos } from '../storage/db';

const FORM_INICIAL = { nombre: '', precio: '', stock: '', codigoBarras: '', foto: null };

export default function CatalogoScreen({ route }) {
  const [productos, setProductos] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editId, setEditId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useFocusEffect(useCallback(() => {
    cargar();
    if (route.params?.agregar) setModal(true);
  }, [route.params]));

  const cargar = async () => setProductos(await getProductos());

  const guardar = async () => {
    if (!form.nombre || !form.precio) return Alert.alert('Error', 'Nombre y precio son obligatorios');
    const lista = await getProductos();
    if (editId) {
      await saveProductos(lista.map(p => p.id === editId ? { ...p, ...form, precio: parseFloat(form.precio), stock: parseInt(form.stock) || 0 } : p));
    } else {
      await saveProductos([...lista, { id: Date.now(), ...form, precio: parseFloat(form.precio), stock: parseInt(form.stock) || 0 }]);
    }
    setModal(false);
    setForm(FORM_INICIAL);
    setEditId(null);
    cargar();
  };

  const eliminar = (id) => Alert.alert('Eliminar', '¿Eliminar este producto?', [
    { text: 'Cancelar' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => {
      const lista = await getProductos();
      await saveProductos(lista.filter(p => p.id !== id));
      cargar();
    }}
  ]);

  const editar = (p) => {
    setForm({ nombre: p.nombre, precio: String(p.precio), stock: String(p.stock), codigoBarras: p.codigoBarras || '', foto: p.foto || null });
    setEditId(p.id);
    setModal(true);
  };

  const tomarFoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) setForm(f => ({ ...f, foto: result.assets[0].uri }));
  };

  const elegirFoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) setForm(f => ({ ...f, foto: result.assets[0].uri }));
  };

  const onBarcode = ({ data }) => {
    setForm(f => ({ ...f, codigoBarras: data }));
    setScanning(false);
  };

  const iniciarScan = async () => {
    if (!permission?.granted) await requestPermission();
    setScanning(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Catálogo</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setForm(FORM_INICIAL); setEditId(null); setModal(true); }}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={productos}
        keyExtractor={p => String(p.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={<Text style={styles.empty}>No hay productos. Agregá uno.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.foto ? <Image source={{ uri: item.foto }} style={styles.foto} /> : <View style={[styles.foto, styles.fotoPlaceholder]}><Ionicons name="cube-outline" size={28} color="#aaa" /></View>}
            <View style={styles.info}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              {item.codigoBarras ? <Text style={styles.barcode}>🔖 {item.codigoBarras}</Text> : null}
              <Text style={styles.precio}>{formatPesos(item.precio)}</Text>
              <Text style={styles.stock}>Stock: {item.stock}</Text>
            </View>
            <View style={styles.acciones}>
              <TouchableOpacity onPress={() => editar(item)}><Ionicons name="pencil-outline" size={20} color="#555" /></TouchableOpacity>
              <TouchableOpacity onPress={() => eliminar(item.id)}><Ionicons name="trash-outline" size={20} color="#e74c3c" /></TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal escaneo */}
      <Modal visible={scanning} animationType="slide">
        <CameraView style={{ flex: 1 }} onBarcodeScanned={onBarcode} barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39'] }}>
          <TouchableOpacity style={styles.cerrarScan} onPress={() => setScanning(false)}>
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>
          <View style={styles.scanOverlay}><Text style={styles.scanText}>Apuntá al código de barras</Text></View>
        </CameraView>
      </Modal>

      {/* Modal agregar/editar */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalBox} contentContainerStyle={{ gap: 12 }}>
            <Text style={styles.modalTitulo}>{editId ? 'Editar Producto' : 'Nuevo Producto'}</Text>

            <TouchableOpacity style={styles.fotoSelector} onPress={tomarFoto}>
              {form.foto ? <Image source={{ uri: form.foto }} style={styles.fotoPreview} /> : <><Ionicons name="camera-outline" size={32} color="#888" /><Text style={{ color: '#888' }}>Tomar foto</Text></>}
            </TouchableOpacity>
            <TouchableOpacity onPress={elegirFoto}><Text style={styles.link}>Elegir de galería</Text></TouchableOpacity>

            <TextInput style={styles.input} placeholder="Nombre del producto" value={form.nombre} onChangeText={t => setForm(f => ({ ...f, nombre: t }))} />
            <TextInput style={styles.input} placeholder="Precio ($)" keyboardType="numeric" value={form.precio} onChangeText={t => setForm(f => ({ ...f, precio: t }))} />
            <TextInput style={styles.input} placeholder="Stock inicial" keyboardType="numeric" value={form.stock} onChangeText={t => setForm(f => ({ ...f, stock: t }))} />

            <View style={styles.barcodeRow}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Código de barras" value={form.codigoBarras} onChangeText={t => setForm(f => ({ ...f, codigoBarras: t }))} />
              <TouchableOpacity style={styles.scanBtn} onPress={iniciarScan}>
                <Ionicons name="barcode-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnGuardar} onPress={guardar}>
              <Text style={styles.btnGuardarText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCancelar} onPress={() => setModal(false)}>
              <Text style={styles.btnCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8EEF4' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50 },
  titulo: { fontSize: 22, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#000', borderRadius: 10, padding: 8 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  foto: { width: 60, height: 60, borderRadius: 8 },
  fotoPlaceholder: { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: '600' },
  barcode: { fontSize: 11, color: '#888', marginTop: 2 },
  precio: { fontSize: 16, fontWeight: 'bold', color: '#2E9E4F', marginTop: 2 },
  stock: { fontSize: 12, color: '#666' },
  acciones: { gap: 10 },
  cerrarScan: { position: 'absolute', top: 50, right: 20 },
  scanOverlay: { position: 'absolute', bottom: 80, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 10 },
  scanText: { color: '#fff', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  fotoSelector: { height: 100, backgroundColor: '#f5f5f5', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
  fotoPreview: { width: '100%', height: '100%', borderRadius: 12 },
  link: { color: '#4A90D9', textAlign: 'center', fontSize: 13 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fafafa' },
  barcodeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  scanBtn: { backgroundColor: '#000', padding: 12, borderRadius: 10 },
  btnGuardar: { backgroundColor: '#000', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnGuardarText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  btnCancelar: { borderRadius: 12, padding: 14, alignItems: 'center' },
  btnCancelarText: { color: '#888', fontSize: 15 },
});
