import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Clipboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDeviceFingerprint, validarCodigo, activar } from '../storage/licencia';

export default function ActivacionScreen({ onActivada }) {
  const [deviceId, setDeviceId] = useState('');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(true);
  const [activando, setActivando] = useState(false);

  useEffect(() => {
    getDeviceFingerprint().then(id => {
      setDeviceId(id);
      setLoading(false);
    });
  }, []);

  const copiarId = () => {
    Clipboard.setString(deviceId);
    Alert.alert('✅ Copiado', 'ID del dispositivo copiado al portapapeles');
  };

  const handleActivar = async () => {
    if (codigo.length < 6) return Alert.alert('Error', 'Ingresá el código de activación completo');
    setActivando(true);
    const valido = await validarCodigo(codigo);
    setActivando(false);
    if (valido) {
      await activar();
      onActivada();
    } else {
      Alert.alert('❌ Código incorrecto', 'El código no es válido para este dispositivo.\nContactá al soporte para obtener tu código.');
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="lock-closed" size={48} color="#000" style={styles.icono} />
        <Text style={styles.titulo}>ComercioApp</Text>
        <Text style={styles.subtitulo}>Activación requerida</Text>

        <Text style={styles.instruccion}>
          Enviá tu ID de dispositivo para recibir tu código de activación:
        </Text>

        <View style={styles.deviceBox}>
          <Text style={styles.deviceLabel}>ID de tu dispositivo:</Text>
          <Text style={styles.deviceId}>{deviceId}</Text>
          <TouchableOpacity style={styles.copiarBtn} onPress={copiarId}>
            <Ionicons name="copy-outline" size={16} color="#fff" />
            <Text style={styles.copiarText}>Copiar ID</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.contacto}>
          📱 Enviá este ID por WhatsApp para obtener tu código
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ingresá tu código de activación"
          value={codigo}
          onChangeText={setCodigo}
          autoCapitalize="characters"
          maxLength={8}
          placeholderTextColor="#aaa"
        />

        <TouchableOpacity
          style={[styles.btnActivar, activando && styles.btnDeshabilitado]}
          onPress={handleActivar}
          disabled={activando}
        >
          {activando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnActivarText}>Activar App</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#E8EEF4', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', gap: 12 },
  icono: { marginBottom: 4 },
  titulo: { fontSize: 26, fontWeight: 'bold' },
  subtitulo: { fontSize: 14, color: '#888', marginTop: -8 },
  instruccion: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20 },
  deviceBox: { backgroundColor: '#F0F4F8', borderRadius: 12, padding: 14, width: '100%', alignItems: 'center', gap: 8 },
  deviceLabel: { fontSize: 12, color: '#888' },
  deviceId: { fontSize: 22, fontWeight: 'bold', letterSpacing: 3, color: '#000' },
  copiarBtn: { flexDirection: 'row', backgroundColor: '#000', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, gap: 6, alignItems: 'center' },
  copiarText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  contacto: { fontSize: 12, color: '#666', textAlign: 'center' },
  input: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 18, width: '100%', textAlign: 'center', letterSpacing: 4, fontWeight: 'bold' },
  btnActivar: { backgroundColor: '#000', borderRadius: 12, padding: 16, width: '100%', alignItems: 'center' },
  btnDeshabilitado: { backgroundColor: '#888' },
  btnActivarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
