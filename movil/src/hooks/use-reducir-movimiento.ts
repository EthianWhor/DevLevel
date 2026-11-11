import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Devuelve true si el usuario activó "Quitar animaciones" (Android) o
// "Reducir movimiento" (iOS) en el sistema. Las pantallas con animación
// muestran entonces una versión estática.
// Escucha los cambios, así responde aunque lo active con la app abierta.
// Mientras el sistema todavía no responde devuelve null, para que la pantalla
// no arranque una animación que quizá no debía mostrar.
export function useReducirMovimiento() {
  const [reducir, setReducir] = useState<boolean | null>(null);

  useEffect(() => {
    let activo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((valor) => {
        if (activo) setReducir(valor);
      })
      .catch(() => {
        if (activo) setReducir(false);
      });

    const suscripcion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducir);
    return () => {
      activo = false;
      suscripcion.remove();
    };
  }, []);

  return reducir;
}
