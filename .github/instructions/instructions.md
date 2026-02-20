---
applyTo: "**"
---

# 📘 Guía de Documentación y Buenas Prácticas

Este documento define el estándar de documentación, estilo de código y buenas prácticas a seguir en los proyectos del repositorio.

---

## 🐍 Estándar de documentación en Python

La documentación debe seguir las convenciones oficiales de **docstrings** definidas en [PEP 257](https://peps.python.org/pep-0257/).

### Principios básicos

- Usar `"""triple comillas dobles"""` para docstrings.
- La primera línea debe contener un **resumen breve** de lo que hace la función, clase o módulo.
- Si se necesita una descripción extendida, dejar una línea en blanco después del resumen.
- Documentar **módulos, clases, funciones y métodos**.
- Los docstrings deben estar en **español, claros y concisos**.
- Usar siempre **nombres descriptivos** para variables, clases y funciones.
- Documentar el código cuando sea necesario para mejorar la legibilidad.

---

## 🔤 Anotaciones de tipos en Python (_type hints_)

Todos los métodos y funciones que no son los que tiene por defecto django deben incluir anotaciones de tipo según [PEP 484](https://peps.python.org/pep-0484/).  
Se debe importar desde el módulo `typing` cuando corresponda (`List`, `Dict`, `Optional`, etc.).

### Ejemplo:

```python
from typing import List, Dict

def procesar_datos(entradas: List[float]) -> Dict[str, float]:
    """
    Procesa una lista de números y devuelve estadísticas.

    Args:
        entradas (List[float]): Lista de números de entrada.

    Returns:
        Dict[str, float]: Diccionario con estadísticas calculadas.
        Ejemplo: {"media": 3.4, "maximo": 10.2}.
    """
    return {
        "media": sum(entradas) / len(entradas),
        "maximo": max(entradas)
    }

```

## ⚛️ Estándar en proyectos React (TypeScript)

### 📦 Librerías y herramientas a utilizar

- **TypeScript** en lugar de JavaScript.
- **React-Bootstrap** para la interfaz de usuario.
- **React Query** para la gestión de consultas y sincronización con la API.
- **Zustand** para manejo de estado global.
- **Axios** para realizar peticiones HTTP.
- Estructurar el código en **componentes reutilizables y modulares**.
- Diseño **responsivo**, limpio y moderno.

---

### 📝 Documentación de métodos, funciones y variables (TSDoc)

Toda la documentación en código TypeScript debe seguir el estándar **[TSDoc](https://tsdoc.org)**, el formato oficial de comentarios de documentación para TypeScript.  
Esto asegura compatibilidad con **VSCode IntelliSense**, **GitHub Copilot** y herramientas como **[TypeDoc](https://typedoc.org)** para generar documentación automática.

#### Reglas generales

- Documentar **todas las funciones, clases, métodos y variables exportadas**.
- Describir de forma clara el propósito de cada elemento.
- Utilizar las etiquetas estándar:
  - `@param` para los parámetros.
  - `@returns` para el valor de retorno.
  - `@example`, `@remarks`, `@deprecated` u otras si aplica.
- Mantener los comentarios en **español claro y técnico**.

#### Ejemplo:

```ts
/**
 * Calcula el precio total de un par de anteojos.
 *
 * @param basePrice - Precio base del armazón.
 * @param lensPrice - Precio de los cristales.
 * @param discount - Porcentaje de descuento a aplicar (opcional).
 * @returns El precio final con descuento aplicado.
 */
function calculateTotal(
  basePrice: number,
  lensPrice: number,
  discount?: number
): number {
  const total = basePrice + lensPrice;
  return discount ? total * (1 - discount / 100) : total;
}
```

### 🧩 Ejemplo de implementación

#### Estado global con Zustand

```tsx
// store.ts
import { create } from "zustand";

interface UserState {
  user: string | null;
  setUser: (user: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```
