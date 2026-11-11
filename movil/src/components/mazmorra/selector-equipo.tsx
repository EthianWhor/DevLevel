import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { authApi, esErrorApi, obtenerInventario, type ObjetoInventario } from '@/api';
import { ICONO_OBJETO } from '@/components/pixel/sprites';
import { useAuth } from '@/context/auth-context';
import type { Equipo, Espacio as EspacioEquipo } from '@/juego/tipos';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

const ESPACIOS: { id: EspacioEquipo; nombre: string }[] = [
  { id: 'arma', nombre: 'Arma' },
  { id: 'armadura', nombre: 'Armadura' },
  { id: 'amuleto', nombre: 'Amuleto' },
];

export const ROJO_MITICO = '#EF4444';

type Props = {
  equipo: Equipo;
  resumen: string[];
  onCerrar?: () => void;
};

// Equipo del héroe: por cada espacio muestra los objetos ganados y deja
// elegir cuál llevar (o ninguno). Se guarda con PATCH /me.
export function SelectorEquipo({ equipo, resumen, onCerrar }: Props) {
  const { conSesion, actualizarPerfilLocal } = useAuth();
  const [objetos, setObjetos] = useState<ObjetoInventario[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;
    conSesion((token) => obtenerInventario(token))
      .then((r) => activo && setObjetos(r.objetos))
      .catch((e) => activo && setError(esErrorApi(e) ? e.message : 'No se pudo cargar tu inventario.'));
    return () => {
      activo = false;
    };
  }, [conSesion]);

  async function equipar(espacio: EspacioEquipo, id: string | null) {
    if (guardando) return;
    setGuardando(true);
    setError(null);
    try {
      const r = await conSesion((token) => authApi.actualizarMe(token, { equipo: { [espacio]: id } }));
      actualizarPerfilLocal(r.perfil);
    } catch (e) {
      setError(esErrorApi(e) ? e.message : 'No se pudo cambiar el equipo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <View style={estilos.caja}>
      <View style={estilos.cabecera}>
        <Text style={estilos.titulo} accessibilityRole="header">
          🎒 EQUIPO
        </Text>
        {onCerrar ? (
          <Pressable onPress={onCerrar} accessibilityRole="button" accessibilityLabel="Cerrar equipo" style={estilos.cerrar}>
            <Text style={estilos.textoCerrar}>✕</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={estilos.texto}>Llevas: {resumen.length > 0 ? resumen.join(', ') : 'nada equipado'}.</Text>

      {error ? (
        <Text style={estilos.error} accessibilityRole="alert">
          ⚠ {error}
        </Text>
      ) : null}
      {!objetos && !error ? <ActivityIndicator color={Colores.oro} accessibilityLabel="Cargando inventario" /> : null}
      {objetos && objetos.length === 0 ? (
        <Text style={estilos.texto}>Todavía no tienes objetos. Cumple los objetivos con ★ de una mazmorra para ganar uno.</Text>
      ) : null}

      {objetos && objetos.length > 0
        ? ESPACIOS.map((espacio) => {
            const delEspacio = objetos.filter((o) => o.espacio === espacio.id);
            if (delEspacio.length === 0) return null;
            return (
              <View key={espacio.id} style={estilos.espacio}>
                <Text style={estilos.nombreEspacio}>{espacio.nombre}</Text>
                <View style={estilos.opciones}>
                  <Opcion
                    texto="Ninguno"
                    elegido={equipo[espacio.id] === null}
                    onPress={() => void equipar(espacio.id, null)}
                    deshabilitado={guardando}
                  />
                  {delEspacio.map((o) => (
                    <Opcion
                      key={o.id}
                      texto={`${ICONO_OBJETO[o.id] ?? '✦'} ${o.nombre}`}
                      detalle={o.efecto}
                      mitico={o.mitico}
                      elegido={equipo[espacio.id] === o.id}
                      onPress={() => void equipar(espacio.id, o.id)}
                      deshabilitado={guardando}
                    />
                  ))}
                </View>
              </View>
            );
          })
        : null}
    </View>
  );
}

function Opcion({
  texto,
  detalle,
  mitico = false,
  elegido,
  onPress,
  deshabilitado,
}: {
  texto: string;
  detalle?: string;
  mitico?: boolean;
  elegido: boolean;
  onPress: () => void;
  deshabilitado: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="radio"
      accessibilityState={{ checked: elegido, disabled: deshabilitado }}
      accessibilityLabel={`${texto}${mitico ? ', mítico' : ''}${detalle ? `. ${detalle}` : ''}`}
      style={[estilos.opcion, mitico && estilos.opcionMitica, elegido && estilos.opcionElegida]}>
      <Text style={estilos.textoOpcion}>
        {elegido ? '● ' : '○ '}
        {texto}
        {mitico ? '  MÍTICO' : ''}
      </Text>
      {detalle ? <Text style={estilos.detalle}>{detalle}</Text> : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  caja: { gap: Espacio.sm, padding: Espacio.sm, borderWidth: 2, borderColor: '#3b82f6', backgroundColor: Colores.superficie },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontFamily: Fuentes.codigo, fontSize: Tamanos.cuerpo, color: '#93c5fd', letterSpacing: 1 },
  cerrar: { minHeight: AreaTactilMinima, minWidth: AreaTactilMinima, alignItems: 'center', justifyContent: 'center' },
  textoCerrar: { fontSize: Tamanos.subtitulo, color: Colores.texto },
  texto: { fontFamily: Fuentes.cuerpo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.texto },
  error: { fontFamily: Fuentes.cuerpoNegrita, fontSize: Tamanos.pequeno, color: Colores.error },
  espacio: { gap: 4 },
  nombreEspacio: { fontFamily: Fuentes.cuerpoNegrita, fontSize: Tamanos.pequeno, color: Colores.oro },
  opciones: { gap: 4 },
  opcion: { minHeight: AreaTactilMinima, justifyContent: 'center', padding: Espacio.sm, borderWidth: 2, borderColor: '#1e293b', backgroundColor: '#0f172a' },
  opcionMitica: { borderColor: ROJO_MITICO },
  opcionElegida: { backgroundColor: '#1e293b', borderColor: Colores.oro },
  textoOpcion: { fontFamily: Fuentes.cuerpoNegrita, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.texto },
  detalle: { fontFamily: Fuentes.cuerpo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.textoSecundario },
});
