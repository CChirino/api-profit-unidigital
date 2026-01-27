-- =============================================
-- Script SEGURO para crear la tabla de registro de lotes (UnidigitalBatchLog)
-- Descripción: Comprueba si la tabla existe. Si no existe, la crea.
--              NO elimina la tabla si ya contiene datos.
-- =============================================

-- Comprobamos si la tabla NO existe ('U' significa User Table).
IF OBJECT_ID('dbo.UnidigitalBatchLog', 'U') IS NULL
BEGIN
    -- Si no existe, procedemos a crearla.
    CREATE TABLE dbo.UnidigitalBatchLog (
        -- === Campos Clave ===
        BatchStrongId VARCHAR(50) NOT NULL PRIMARY KEY,
        SerieStrongId VARCHAR(50) NOT NULL,
        -- === Campos de Estado y Fechas ===
        /*
            Códigos de Estado (Alineados con Unidigital):
            - 1 (Open):     El lote ha sido creado en Unidigital y está abierto para recibir documentos.
            - 2 (Closed):   El proceso de envío de documentos ha finalizado. El lote está cerrado y pendiente de revisión.
            - 3 (Approved): Un usuario ha aprobado manualmente el lote. Está en espera de asignación fiscal.
            - 4 (Assigned): Unidigital ha asignado los números de control fiscal a los documentos.
            - 5 (Canceled): El lote ha sido cancelado, ya sea por un error fatal durante el proceso o por una acción manual.
        */
        CurrentStatus INT NOT NULL DEFAULT 0,
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
        OpenedDate DATETIME NULL,
        ClosedDate DATETIME NULL,
        CanceledDate DATETIME NULL,
        ApprovedDate DATETIME NULL,
        PrintedDate DATETIME NULL,

        -- === Campos de Resumen del Contenido ===
        DateFrom DATETIME NOT NULL,
        DateTo DATETIME NOT NULL,
        DocType VARCHAR(10) NOT NULL,
        FirstDocNumber VARCHAR(20) NULL,
        LastDocNumber VARCHAR(20) NULL,
        TotalDocuments INT NOT NULL DEFAULT 0,
        ProcessedDocuments INT DEFAULT 0,
        FailedDocuments INT DEFAULT 0,

        -- === Campos de Auditoría y Errores ===
        CreatedBy VARCHAR(100) NOT NULL,
        ErrorMessage NVARCHAR(MAX) NULL
    );

    PRINT 'Tabla UnidigitalBatchLog no existía y ha sido creada exitosamente.';
END
ELSE
BEGIN
    -- Si ya existe, informamos y no hacemos nada.
    PRINT 'La tabla UnidigitalBatchLog ya existe. No se realizaron cambios.';
END
GO