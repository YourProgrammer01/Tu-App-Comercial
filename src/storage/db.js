import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = { PRODUCTOS: 'productos', VENTAS: 'ventas' };

export const getProductos = async () => {
  const data = await AsyncStorage.getItem(KEYS.PRODUCTOS);
  return data ? JSON.parse(data) : [];
};

export const saveProductos = async (productos) => {
  await AsyncStorage.setItem(KEYS.PRODUCTOS, JSON.stringify(productos));
};

export const getVentas = async () => {
  const data = await AsyncStorage.getItem(KEYS.VENTAS);
  return data ? JSON.parse(data) : [];
};

export const saveVentas = async (ventas) => {
  await AsyncStorage.setItem(KEYS.VENTAS, JSON.stringify(ventas));
};

export const agregarVenta = async (items, total) => {
  const ventas = await getVentas();
  const nueva = { id: Date.now(), fecha: new Date().toISOString(), items, total };
  await saveVentas([...ventas, nueva]);
  return nueva;
};

export const getVentasHoy = async () => {
  const ventas = await getVentas();
  const hoy = new Date().toDateString();
  return ventas.filter(v => new Date(v.fecha).toDateString() === hoy);
};

export const formatPesos = (monto) =>
  `$${Number(monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
