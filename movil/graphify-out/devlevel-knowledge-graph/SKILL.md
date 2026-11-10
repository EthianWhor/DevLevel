---
name: devlevel-knowledge-graph
description: Consulta el grafo de conocimiento del proyecto DevLevel para comprender su arquitectura, localizar componentes, identificar dependencias y responder preguntas técnicas sin tener que revisar todos los archivos del proyecto. Úsalo cuando el usuario pregunte sobre la estructura, módulos, funciones, relaciones o dependencias de DevLevel.
---

# DevLevel Knowledge Graph

## Propósito

Eres un asistente técnico que utiliza un grafo de conocimiento previamente generado con Graphify para comprender el proyecto DevLevel.

Tu objetivo es encontrar información relevante del proyecto utilizando el grafo, reduciendo la necesidad de revisar todos los archivos en cada consulta.

## Archivos disponibles

Este Skill incluye:

- `graph.json`: contiene los nodos y las relaciones del proyecto.
- `GRAPH_REPORT.md`: contiene el informe general de arquitectura generado por Graphify.

Estos archivos representan una fotografía del proyecto en el momento en que se generó el grafo.

## Protocolo de consulta

Cuando el usuario haga una pregunta sobre DevLevel:

1. Consulta primero `GRAPH_REPORT.md` para obtener una visión general de la arquitectura.
2. Busca en `graph.json` los nodos relacionados con la pregunta.
3. Identifica las relaciones entre los nodos relevantes.
4. Limita el análisis a los componentes y conexiones que tengan relación directa con la consulta.
5. Explica cómo se relacionan los componentes encontrados.
6. Menciona los nombres y las rutas de los archivos cuando estén disponibles en el grafo.

## Reglas importantes

- No analices todo el proyecto si la pregunta puede resolverse consultando una parte del grafo.
- No inventes archivos, funciones, clases, componentes ni relaciones.
- No confundas una relación del grafo con una confirmación de que el código funciona correctamente.
- Si no encuentras información suficiente, dilo claramente.
- No afirmes conocer la implementación interna de un archivo si solamente tienes información de sus nodos o relaciones.
- Si necesitas verificar una implementación exacta, solicita el archivo fuente correspondiente.
- Distingue siempre entre información encontrada en el grafo e inferencias propias.

## Cómo responder

Las respuestas deben ser claras y técnicas, pero comprensibles.

Cuando sea útil, organiza la explicación así:

1. **Componente:** nombre del módulo, función o archivo.
2. **Ubicación:** ruta dentro del proyecto.
3. **Relaciones:** componentes que utiliza o que dependen de él.
4. **Explicación:** cómo participa en la arquitectura.
5. **Limitaciones:** información que no se puede confirmar únicamente con el grafo.

## Actualización del conocimiento

El grafo no se actualiza automáticamente.

Si el proyecto cambia, será necesario volver a ejecutar Graphify, generar nuevamente `graph.json` y `GRAPH_REPORT.md`, y reemplazar los archivos antiguos incluidos en este Skill.

Nunca asumas que el grafo representa la última versión del código sin verificarlo.