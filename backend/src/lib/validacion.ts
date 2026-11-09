// Validaciones sencillas de los datos que llegan en el cuerpo de las peticiones.
// Cada función devuelve el mensaje de error o null si el valor es válido,
// para que la app pueda mostrar el error debajo del campo correspondiente.

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export function validarCorreo(valor: unknown): string | null {
  if (typeof valor !== 'string' || valor.trim() === '') {
    return 'Escribe tu correo';
  }
  if (!PATRON_CORREO.test(valor.trim())) {
    return 'El correo no tiene un formato válido';
  }
  return null;
}

export function validarPassword(valor: unknown): string | null {
  if (typeof valor !== 'string' || valor === '') {
    return 'Escribe tu contraseña';
  }
  if (valor.length < PASSWORD_MIN) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
  }
  if (valor.length > PASSWORD_MAX) {
    return `La contraseña puede tener máximo ${PASSWORD_MAX} caracteres`;
  }
  return null;
}

export type ErroresCampos = Record<string, string>;

// Quita los campos sin error. Si no queda ninguno, devuelve null.
export function juntarErrores(errores: Record<string, string | null>): ErroresCampos | null {
  const conError = Object.entries(errores).filter(([, mensaje]) => mensaje !== null);
  return conError.length > 0 ? (Object.fromEntries(conError) as ErroresCampos) : null;
}
