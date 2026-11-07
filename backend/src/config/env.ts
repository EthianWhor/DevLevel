// Lee y valida las variables de entorno una sola vez al arrancar.
// Si falta alguna, el servidor se detiene con un mensaje claro
// en lugar de fallar más adelante en una petición.

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa backend/.env.example`);
  }
  return valor;
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  supabaseUrl: requerida('SUPABASE_URL'),
  supabaseSecretKey: requerida('SUPABASE_SECRET_KEY'),
};
