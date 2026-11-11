import { StyleSheet, Text, View } from 'react-native';

import type { ObjetivoExtra } from '@/juego/tipos';
import { AlturaLinea, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

export function textoObjetivo(o: ObjetivoExtra): string {
  switch (o.tipo) {
    case 'monedas':
      return 'Recoge todas las monedas';
    case 'maxInstrucciones':
      return `Usa máximo ${o.valor} instrucciones`;
    case 'sinChoques':
      return 'No choques contra los muros';
    case 'sinDanio':
      return 'No recibas daño';
    case 'derrotarTodos':
      return 'Derrota a todos los enemigos';
  }
}

type Props = {
  objetivos: ObjetivoExtra[];
  // null mientras no se ha ejecutado: todos sin marcar.
  gano: boolean | null;
  cumplidos: boolean[] | null;
};

// Objetivo principal + extras, cada uno con casilla ☐/☑ y texto.
export function Objetivos({ objetivos, gano, cumplidos }: Props) {
  const filas = [
    { texto: 'Llega a la puerta', hecho: gano === true, principal: true },
    ...objetivos.map((o, i) => ({ texto: textoObjetivo(o), hecho: cumplidos?.[i] === true, principal: false })),
  ];
  return (
    <View style={estilos.caja}>
      <Text style={estilos.titulo} accessibilityRole="header">
        OBJETIVOS
      </Text>
      {filas.map((f) => (
        <View
          key={f.texto}
          style={estilos.fila}
          accessible
          accessibilityLabel={`${f.principal ? 'Objetivo principal' : 'Objetivo extra'}: ${f.texto}. ${f.hecho ? 'Cumplido' : 'Pendiente'}`}>
          <Text style={[estilos.casilla, f.hecho && estilos.hecho]}>{f.hecho ? '☑' : '☐'}</Text>
          <Text style={[estilos.texto, f.hecho && estilos.hecho]}>
            {f.texto}
            {f.principal ? '' : ' ★'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    gap: 2,
    padding: Espacio.sm,
    borderWidth: 2,
    borderColor: '#1e293b',
    backgroundColor: Colores.superficie,
  },
  titulo: {
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.oro,
    letterSpacing: 1,
  },
  fila: { flexDirection: 'row', gap: Espacio.sm, alignItems: 'center' },
  casilla: { fontSize: Tamanos.cuerpo, lineHeight: AlturaLinea.cuerpo, color: Colores.textoSecundario },
  texto: {
    flexShrink: 1,
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.texto,
  },
  hecho: { color: Colores.verde },
});
