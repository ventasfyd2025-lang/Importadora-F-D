# GEMINI.md

## Resumen del Proyecto

Esta es una aplicación web de comercio electrónico moderna para "Importadora F&D". Está construida con Next.js, React y TypeScript, y utiliza Firebase para el backend. La aplicación ofrece una experiencia de comercio electrónico completa con listados de productos, un carrito de compras y un proceso de pago. También incluye un panel de administración para gestionar productos y pedidos.

**Tecnologías Clave:**

*   **Framework:** Next.js 15
*   **Biblioteca de UI:** React 19
*   **Lenguaje:** TypeScript
*   **Backend:** Firebase (Autenticación, Firestore, Storage)
*   **Estilos:** Tailwind CSS
*   **Despliegue:** Vercel

## Compilación y Ejecución

Para poner en marcha el proyecto, sigue estos pasos:

1.  **Instalar Dependencias:**
    ```bash
    npm install
    ```

2.  **Ejecutar el Servidor de Desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:3000`.

3.  **Compilar para Producción:**
    ```bash
    npm run build
    ```

4.  **Iniciar el Servidor de Producción:**
    ```bash
    npm run start
    ```

## Convenciones de Desarrollo

*   **Estilos:** El proyecto utiliza Tailwind CSS para los estilos. Se prefieren las clases de utilidad sobre el CSS personalizado.
*   **Componentes:** Los componentes reutilizables se encuentran en el directorio `src/components`.
*   **Obtención de Datos:** Se utilizan hooks personalizados en el directorio `src/hooks` para obtener datos de Firebase.
*   **Tipos:** Los tipos de TypeScript se definen en el directorio `src/types`.
*   **Firebase:** La configuración de Firebase se encuentra en `src/lib/firebase.ts`. Se utilizan variables de entorno para las credenciales de Firebase.

## Panel de Administración

La aplicación incluye un panel de administración para gestionar productos y pedidos.

*   **URL:** `/admin`
*   **Credenciales:**
    *   **Email:** `admin@importadorafyd.com`
    *   **Contraseña:** `admin123`