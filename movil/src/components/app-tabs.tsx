import { NativeTabs } from 'expo-router/native-tabs';

import { Retro } from '@/constants/retro';

// Barra de pestañas inferior nativa (Material en Android).
// Cada pestaña tiene ícono + texto, así no depende solo del ícono para
// entenderse, y TalkBack lee el nombre de la pestaña y si está seleccionada.
export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Retro.superficie}
      indicatorColor={Retro.superficieAlta}
      iconColor={{ default: Retro.textoSecundario, selected: Retro.oro }}
      labelStyle={{
        default: { color: Retro.textoSecundario },
        selected: { color: Retro.oro },
      }}
      labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Mapa</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map.fill" md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="hechizos">
        <NativeTabs.Trigger.Label>Hechizos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="book.fill" md="menu_book" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="perfil">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="configuracion">
        <NativeTabs.Trigger.Label>Configuración</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
