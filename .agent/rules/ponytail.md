# Reglas de Ponytail (The Pragmatic Senior Engineer)

Este proyecto sigue estrictamente la filosofía y reglas de **Ponytail** para prevenir la sobre-ingeniería (*over-engineering*), reducir el código innecesario y garantizar máxima mantenibilidad y rendimiento.

---

## 🎯 Principio Rector: "El Senior Pragmático"
> *"El mejor código es el que no se escribe. El segundo mejor es el más simple, directo y nativo posible."*

---

## 🪜 La Escalera de Decisión (Antes de escribir cualquier línea de código)
1. **¿Esto realmente necesita existir? (YAGNI - You Aren't Gonna Need It):**
   - Si no resuelve un requerimiento explícito actual, no se escribe.
   - Prohibido agregar configuraciones o abstracciones especulativas para "el futuro".
2. **¿Lo resuelve la plataforma nativa o el lenguaje estándar?**
   - Si JavaScript ES6+, la API estándar del navegador o CSS nativo pueden resolverlo, **está estrictamente prohibido instalar una dependencia externa**.
   - Cero librerías para utilidades básicas (nada de `lodash`, `ramda`, `mathjs`, `moment`, `uuid`, etc.). Usar `Math.*`, `Array.prototype.*`, `crypto.randomUUID()`.
3. **¿Ya está resuelto o existe un patrón en el proyecto?**
   - Reutilizar funciones y componentes existentes antes de crear nuevos.
4. **Si debe escribirse nuevo código, escribir la menor cantidad posible:**
   - Funciones puras, directas, sin capas innecesarias de indirección, sin fábricas (*factories*) ni clases abstractas cuando una función de 10 líneas alcanza.

---

## ⚛️ Reglas Específicas para React y Frontend
1. **Estado Mínimo:**
   - No usar gestores de estado global complejos (Redux, Zustand, MobX) si el estado puede manejarse con `useState` local o elevación de estado (*lifting state up*).
   - El estado derivado debe calcularse al vuelo en el render, **no** duplicarse en nuevos `useState` ni `useEffect`.
2. **Estilos Limpios y Modulares:**
   - Mantener el diseño 100% idéntico a la fuente de verdad.
   - Estilos encapsulados para que ningún cambio en un componente afecte a otros.
3. **Cero Dependencias de UI Pesadas:**
   - No instalar suites completas de UI (Material UI, Ant Design, Chakra) cuando la interfaz ya tiene su propio diseño probado y liviano.

---

## 🧪 Reglas de Testing (TDD)
1. **TDD Estricto:** Test primero (Red) $\rightarrow$ Solución más simple (Green) $\rightarrow$ Auditoría Ponytail (Refactor).
2. **Tests de Alto Valor:**
   - Testear comportamiento real y reglas matemáticas (casos bordes, signos, transposición, simplex).
   - Testear interacciones reales de usuario (tipear, clickear, visualizar).
   - No testear detalles de implementación interna de React.

---

## 🔍 Checklist de Auditoría Ponytail (A ejecutar tras cada módulo)
- [ ] ¿Se agregaron dependencias en `package.json`? ¿Eran 100% indispensables?
- [ ] ¿Hay abstracciones innecesarias o código que podría reducirse a la mitad?
- [ ] ¿Hay funciones duplicadas o código muerto?
- [ ] ¿Todos los tests pasan limpiamente sin warnings?
