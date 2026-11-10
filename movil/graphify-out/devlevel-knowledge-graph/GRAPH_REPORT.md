# Graph Report - movil  (2026-11-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 265 nodes · 531 edges · 30 communities (11 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e5beb200`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29

## God Nodes (most connected - your core abstractions)
1. `Retro` - 18 edges
2. `esErrorApi()` - 17 edges
3. `react-native` - 16 edges
4. `useAuth()` - 15 edges
5. `pedir()` - 15 edges
6. `expo` - 14 edges
7. `AreaTactilMinima` - 12 edges
8. `react` - 12 edges
9. `NivelScreen()` - 9 edges
10. `expo-router` - 9 edges

## Surprising Connections (you probably didn't know these)
- `enviar()` --calls--> `esErrorApi()`  [EXTRACTED]
  src/app/login.tsx → src/api/cliente.ts
- `NivelScreen()` --calls--> `esErrorApi()`  [EXTRACTED]
  src/app/nivel/[id].tsx → src/api/cliente.ts
- `responder()` --calls--> `esErrorApi()`  [EXTRACTED]
  src/app/nivel/[id].tsx → src/api/cliente.ts
- `reintentar()` --calls--> `esErrorApi()`  [EXTRACTED]
  src/app/(tabs)/_layout.tsx → src/api/cliente.ts
- `AuthProvider()` --calls--> `esErrorApi()`  [EXTRACTED]
  src/context/auth-context.tsx → src/api/cliente.ts

## Import Cycles
- None detected.

## Communities (30 total, 19 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (36): expo-router, esErrorApi(), authApi, mapaApi, Avatar, NivelMapa, LoginScreen(), enviar() (+28 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (29): react-native, obtenerNivel(), responderReto(), RespuestaNivel, RespuestaReto, estilos, Fase, NivelScreen() (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (31): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, web (+23 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (24): actualizarMe(), iniciarSesion(), obtenerMe(), registrar(), renovarSesion(), API_URL, ErrorApi, Metodo (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (8): exampleAssets, exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 5 - "Community 5"
Cohesion: 0.24
Nodes (11): react, Navegacion(), RootLayout(), temaNavegacion, AuthContext, AuthProvider(), borrarSesion(), EstadoAuth (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.20
Nodes (11): expo-web-browser@~58.0.7, devDependencies, @types/react@~19.3.0, typescript@~6.0.3, main, name, private, version (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (12): dependencies, expo-dev-client@~58.0.18, expo-font@~58.0.11, @expo-google-fonts/inter@^0.4.2, expo-router@~58.0.30, react@19.3.0, react-native@0.88.1, react-native-worklets@0.13.0 (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (7): react-native-safe-area-context@~5.11.1, react-native-safe-area-context, ConfiguracionScreen(), HechizosScreen(), PerfilScreen(), PantallaPendiente(), styles

### Community 9 - "Community 9"
Cohesion: 0.25
Nodes (7): expo/tsconfig.base, compilerOptions, paths, strict, extends, include, @/assets/*

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (7): scripts, android, ios, lint, reset-project, start, web

## Knowledge Gaps
- **1 isolated node(s):** `expo/tsconfig.base`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 87 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-native` connect `Community 1` to `Community 0`, `Community 8`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0935374149659864 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `Community 7` to `Community 6`, `Community 8`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11923076923076924 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Community 5` to `Community 0`, `Community 1`, `Community 6`, `Community 7`, `Community 8`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._