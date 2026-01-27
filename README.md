# Integrador Profit Plus y Facturación Digital Unidigital

Este proyecto es un servicio middleware desarrollado en Node.js que actúa como puente entre un ERP **Profit Plus Administrativo (2k8/2k12)** y la plataforma de facturación electrónica **Unidigital (HKA)**.

Su función principal es automatizar el proceso de lectura, procesamiento y envío de documentos de venta (Facturas, Notas de Crédito, Notas de Débito) desde la base de datos de Profit Plus hacia la API de Unidigital para su validación y procesamiento fiscal.

## Características Principales

-   **Conexión a SQL Server**: Se conecta de forma segura a la base de datos de Profit Plus.
-   **Autenticación API**: Gestiona la autenticación con la API de Unidigital para obtener tokens de acceso.
-   **Procesamiento por Lotes**:
    -   Crea lotes en Unidigital para agrupar los envíos.
    -   Marca los documentos en Profit con un ID de lote único para evitar duplicados y permitir el seguimiento.
    -   Construye el payload JSON complejo que requiere la API de Unidigital, incluyendo cálculos de montos y conversión de números a letras.
    -   Actualiza los documentos en Profit con el `strongId` de Unidigital una vez procesados.
-   **Gestión de Errores y Reintentos**: Separa la lógica de creación de lotes de la de reintentos. Permite reanudar lotes que fallaron a mitad del proceso, evitando la pérdida de datos y la duplicación.
-   **Ciclo de Vida Completo**: Administra el ciclo de vida completo de un lote: creación, cierre, aprobación y sincronización de números de control.
-   **Sistema de Migraciones**: Incluye un sistema de scripts para crear y mantener actualizados los Stored Procedures y funciones necesarias en la base de datos de Profit.
-   **API RESTful**: Expone una API REST clara y bien definida para controlar todo el proceso desde un frontend o cualquier otro cliente.
-   **Configuración Flexible**: Utiliza variables de entorno para una fácil configuración en diferentes ambientes.

## Requisitos Previos

-   [Node.js](https://nodejs.org/en/) (v18.x o superior recomendado)
-   NPM (se instala junto con Node.js)
-   Acceso a una instancia de **Microsoft SQL Server** con la base de datos de Profit Plus.
-   Credenciales de acceso para la **API de Unidigital**.

## Instalación

1.  Clona este repositorio en tu máquina local:
    ```bash
    git clone https://github.com/tu-usuario/ProfitUnidigital.git
    ```
2.  Navega al directorio del proyecto:
    ```bash
    cd ProfitUnidigital
    ```
3.  Instala todas las dependencias necesarias:
    ```bash
    npm install
    ```

## Configuración

1.  En la raíz del proyecto, crea una copia del archivo `.env.example` y renómbrala a `.env`.
2.  Abre el archivo `.env` y rellena todas las variables con tus credenciales y configuraciones:

    ```env
    # Nivel de log: 0: info, 1: warn, 2: error, 3: debug
    LOG_LEVEL=0 
    PORT=5000
    JWT_SECRET="TU_SECRETO_PARA_JWT"
    TOKEN_EXPIRE=31557600000

    # Configuración de conexión a la base de datos
    SERVER_NAME="TU_SERVIDOR_SQL\INSTANCIA"
    DB_USER="tu_usuario_sql"
    DB_PWD="tu_password_sql"
    DB_NAME="NOMBRE_DB_PROFIT"
    SERVER_IP="127.0.0.1"

    # Credenciales para el usuario de servicio de esta API
    API_USER=service_user
    API_PASSWORD_SALT="un_salt_seguro"
    API_PASSWORD_HASH="el_hash_de_la_contraseña"

    # Configuración de conexión a la API de Unidigital
    UNIDIGITAL_BASE_URL=https://api.unidigital.com.ve
    UNIDIGITAL_USER="tu_usuario_unidigital"
    UNIDIGITAL_PASSWORD="tu_contraseña_unidigital"
    PROCESSING_BATCH_SIZE=100

    # Opcional: Establecer el primer documento a procesar por tipo
    FIRST_DOC_NUMBER_FACT=1
    FIRST_DOC_NUMBER_NCR=1
    FIRST_DOC_NUMBER_NDB=1
    ```

## Uso

### 1. Ejecutar las Migraciones de la Base de Datos

Este es el primer paso y el más importante. Prepara la base de datos de Profit creando todos los Stored Procedures necesarios para que la aplicación funcione.

```bash
npm run migrate
```

### 2. Iniciar el Servidor

-   Para un entorno de **desarrollo** (con reinicio automático al detectar cambios):
    ```bash
    npm run dev
    ```
-   Para un entorno de **producción**:
    ```bash
    npm run start
    ```

El servidor se iniciará y mostrará en la consola la dirección y el puerto en el que está escuchando.

---

## Flujo de Trabajo de la API

El sistema está diseñado para ser controlado a través de su API REST. A continuación se describe el flujo de trabajo principal.

### Flujo Principal (Happy Path)

1.  **Login**: Obtén un `accessToken` usando el endpoint `/login`.
2.  **(Opcional) Previsualizar**: Consulta los documentos pendientes de envío con `/profit/documents`.
3.  **Iniciar Lote**: Inicia el proceso de envío con `/processing/start`. Esto crea un lote nuevo y comienza a enviar los documentos. La API responderá inmediatamente con un `202 Accepted`.
4.  **Monitorear**: Consulta el estado del lote periódicamente con `/logs/batches`. Espera a que el estado del lote cambie a `2` (Completado / Cerrado).
5.  **Aprobar**: Una vez el lote esté cerrado, apruébalo en Unidigital con `/batches/:id/approve`. El estado en el log cambiará a `3` (Aprobado).
6.  **Sincronizar**: Finalmente, sincroniza los números de control fiscal asignados por Unidigital con `/batches/:id/sync-controls`.

### Flujo de Error y Reintento

1.  **Detección**: Si al monitorear con `/logs/batches`, un lote queda en estado `1` (Abierto con errores) o `5` (Error Fatal), significa que el proceso se interrumpió.
2.  **Corrección**: El usuario debe analizar el mensaje de error guardado en el log del lote para corregir la causa raíz (ej. un dato incorrecto en una factura).
3.  **Reintentar**: Una vez corregido el problema, se llama al endpoint `/processing/retry/:id` para que el sistema reanude el envío de documentos **únicamente para ese lote**, comenzando desde el punto donde falló.
4.  **Continuar**: El flujo continúa desde el paso 4 del "Happy Path".

---

## Ciclo de Vida del Lote (Estados)

La siguiente tabla describe los estados por los que puede pasar un lote en nuestro sistema de logs y su equivalencia en Unidigital.

| Estado (Log) | Nombre en Nuestro Sistema | Descripción y Cuándo se Usa | Estado Equivalente en Unidigital |
| :--- | :--- | :--- | :--- |
| **1** | **Abierto / En Proceso** | El lote está en curso, o finalizó pero con documentos fallidos. Permanece abierto para reintentos. | **1** (Abierto) |
| **2** | **Completado / Cerrado** | Todos los documentos se procesaron con éxito. El lote ha sido cerrado en Unidigital. | **2** (Cerrado) |
| **3** | **Aprobado** | El lote fue aprobado en Unidigital después de ser cerrado. Es el paso previo a sincronizar controles. | **3** (Aprobado) |
| **5** | **Error Fatal** | El proceso se detuvo por un error crítico (ej. fallo de correlativo). El lote permanece abierto en Unidigital para permitir un reintento. | **1** (Abierto) |
| **7** | **Cancelado** | El lote fue cancelado manualmente por un usuario. | **3** (Cancelado) o **4** (Anulado) |

---

## Referencia de Endpoints de la API

| Acción | Método | Endpoint | Autenticación | Cuerpo (Body) |
| :--- | :--- | :--- | :--- | :--- |
| **Autenticación** | | | | |
| Iniciar Sesión | `POST` | `/login` | No | `{ "user": "...", "pass": "..." }` |
| **Procesamiento de Lotes** | | | | |
| Iniciar Nuevo Lote | `POST` | `/processing/start` | Sí | `{ "serieStrongId": "...", "fechaHasta": "..." }` |
| Reintentar Lote Fallido | `POST` | `/processing/retry/:id` | Sí | Vacío |
| **Gestión de Lotes** | | | | |
| Consultar Logs de Lotes | `GET` | `/logs/batches` | Sí | Vacío (Usa query params `?page=...&limit=...`) |
| Consultar Documentos de un Lote | `GET` | `/batches/:id/documents` | Sí | Vacío |
| Aprobar Lote | `POST` | `/batches/:id/approve` | Sí | Vacío |
| Sincronizar Controles de Lote | `POST` | `/batches/:id/sync-controls` | Sí | Vacío |
| Cancelar Lote | `POST` | `/batches/:id/cancel` | Sí | `{ "reason": "..." }` |
| **Consultas (Profit)** | | | | |
| Consultar Documentos de Venta | `POST` | `/profit/documents` | Sí | `{ "fechaHasta": "..." }` |
| **Consultas (Unidigital)** | | | | |
| Consultar Series y Templates | `GET` | `/uni/series` | Sí | Vacío |
| Consultar Último Documento | `POST` | `/uni/documents/last` | Sí | `{ "serieStrongId": "...", "documentType": "..." }` |
| **Utilidades** | | | | |
| Test de Conexión | `GET` | `/` | No | Vacío |


## Flujo de Trabajo y Endpoints de la API

El sistema está diseñado para ser controlado a través de su API REST. A continuación se describe el flujo de trabajo principal y el propósito de cada endpoint.

### 1. Autenticación

#### `POST /login`
-   **Descripción**: Autentica a un usuario contra la base de datos local y devuelve un token JWT para ser usado en las siguientes peticiones.
-   **Body**: `{ "user": "...", "pass": "..." }`
-   **Respuesta Exitosa**: `200 OK` con un objeto `{ token: "..." }`.

### 2. Proceso Principal de Envío

Este es el corazón del sistema, diseñado para ser asíncrono.

#### `POST /processing/start`
-   **Descripción**: Inicia un **nuevo** proceso de envío de documentos. Es el punto de partida del flujo.
-   **Body**: `{ "serieStrongId": "...", "fechaHasta": "..." }`
-   **Flujo de Ejecución**:
    1.  Valida que no exista otro lote abierto para la misma serie. Si existe, devuelve un error `409 Conflict`.
    2.  Inicia un proceso en segundo plano (`processBatchFlow`) que:
        -   Crea un nuevo lote en Unidigital.
        -   Marca los documentos pendientes en Profit con el nuevo ID de lote.
        -   Comienza a enviar los documentos a Unidigital en sub-lotes.
    3.  Responde inmediatamente con `202 Accepted` para no bloquear al cliente.
-   **Respuesta de Error Común**: `409 Conflict` si ya hay un lote abierto.

#### `POST /processing/retry/:id`
-   **Descripción**: Reintenta el envío de un lote que falló previamente y quedó en estado "Abierto" o "Error Fatal".
-   **Parámetro URL**: `:id` es el `batchId` del lote a reintentar.
-   **Flujo de Ejecución**:
    1.  Valida que el lote exista y esté en estado "Abierto" en la API de Unidigital.
    2.  Inicia un proceso en segundo plano (`processBatchFlow` en modo reintento) que:
        -   Obtiene **todos** los documentos del lote desde Profit.
        -   Filtra y se queda **únicamente** con los que fallaron (los que no tienen un StrongId válido).
        -   Reanuda el envío de estos documentos fallidos.
    3.  Responde inmediatamente con `202 Accepted`.
-   **Respuesta de Error Común**: `409 Conflict` si el lote ya fue cerrado o cancelado en Unidigital.

### 3. Monitoreo y Gestión de Lotes

#### `GET /logs/batches`
-   **Descripción**: Permite monitorear el estado de todos los lotes procesados. Es el endpoint principal para que el frontend muestre el historial.
-   **Parámetros Query**: `?page=1&limit=10` para paginación.
-   **Respuesta Exitosa**: `200 OK` con un array de los logs de los lotes.

#### `GET /batches/:id/documents`
-   **Descripción**: Obtiene la lista detallada de todos los documentos asociados a un lote específico, incluyendo su estado individual.
-   **Parámetro URL**: `:id` es el `batchId` del lote a consultar.
-   **Respuesta Exitosa**: `200 OK` con un array de documentos.

#### `POST /batches/:id/cancel`
-   **Descripción**: Cancela un lote que está abierto. Libera los documentos en Profit para que puedan ser incluidos en un futuro lote.
-   **Parámetro URL**: `:id` es el `batchId` del lote a cancelar.
-   **Body**: `{ "reason": "Motivo de la cancelación" }`
-   **Flujo de Ejecución**:
    1.  Llama a la API de Unidigital para cancelar el lote.
    2.  Actualiza el estado del lote a `7` (Cancelado) en el log local.
    3.  Ejecuta un proceso para "desmarcar" los documentos en Profit (quita el `batchId` del `campo8`).
-   **Respuesta Exitosa**: `200 OK` con un mensaje de confirmación.

### 4. Ciclo de Vida Post-Envío

Estos endpoints se usan después de que un lote se ha completado exitosamente (Estado `2`).

#### `POST /batches/:id/approve`
-   **Descripción**: Aprueba un lote que ya fue cerrado en Unidigital. Este es un paso requerido por algunas plataformas de facturación antes de considerar el lote como finalizado.
-   **Parámetro URL**: `:id` es el `batchId` del lote.
-   **Pre-condición**: El lote debe estar en estado `2` (Cerrado).
-   **Flujo de Ejecución**:
    1.  Llama a la API de Unidigital para aprobar el lote.
    2.  Actualiza el estado del lote a `3` (Aprobado) en el log local.
-   **Respuesta Exitosa**: `200 OK` con un mensaje de confirmación.

#### `POST /batches/:id/sync-controls`
-   **Descripción**: Sincroniza los números de control fiscal asignados por Unidigital para cada documento y los guarda en la base de datos de Profit.
-   **Parámetro URL**: `:id` es el `batchId` del lote.
-   **Pre-condición**: El lote debe estar en estado `3` (Aprobado).
-   **Flujo de Ejecución**:
    1.  Consulta a la API de Unidigital para obtener los números de control del lote.
    2.  Recorre los resultados y actualiza el campo correspondiente (ej. `campo6`) en cada documento en Profit.
-   **Respuesta Exitosa**: `200 OK` con un mensaje de confirmación.

---

## Contribuciones

Las pull requests son bienvenidas. Para cambios importantes, por favor abre un "issue" primero para discutir lo que te gustaría cambiar.

## Licencia

[MIT](https://choosealicense.com/licenses/mit/)
