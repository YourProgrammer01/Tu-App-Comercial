import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SECRET = 'COMERCIOAPP_2024_X9K';
const KEY_ACTIVADA = 'app_activada';
const KEY_DEVICE = 'app_device_id';

export const getDeviceFingerprint = async () => {
  const androidId = Application.getAndroidId?.() ?? 'unknown';
  const installId = Application.getIosIdForVendorAsync
    ? await Application.getIosIdForVendorAsync()
    : androidId;
  const appId = Application.applicationId ?? 'com.comercioapp';
  const raw = `${androidId}-${installId}-${appId}-${Platform.OS}`;
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  return hash.substring(0, 12).toUpperCase();
};

export const generarCodigoValido = async (deviceId) => {
  const raw = `${deviceId}-${SECRET}`;
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  return hash.substring(0, 8).toUpperCase();
};

export const validarCodigo = async (codigoIngresado) => {
  const deviceId = await getDeviceFingerprint();
  const codigoEsperado = await generarCodigoValido(deviceId);
  return codigoIngresado.toUpperCase().trim() === codigoEsperado;
};

export const isActivada = async () => {
  const val = await AsyncStorage.getItem(KEY_ACTIVADA);
  return val === 'true';
};

export const activar = async () => {
  await AsyncStorage.setItem(KEY_ACTIVADA, 'true');
};
