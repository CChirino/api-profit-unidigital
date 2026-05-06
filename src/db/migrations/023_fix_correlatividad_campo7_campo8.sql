-- =============================================
-- MIGRACIÓN 023: Fix de Correlatividad - Unificar campo7/campo8
-- =============================================
-- CONVENCIÓN DEFINITIVA:
--   campo7 = StrongId del documento en Unidigital (resultado del envío) o 'FALLIDO-*'
--   campo8 = BatchId (identifica a qué lote pertenece el documento)
--
-- IMPORTANTE: Ejecutar esta migración en una VENTANA DE MANTENIMIENTO,
-- cuando el middleware NO esté procesando documentos.
-- =============================================

-- PASO 0: Verificar documentos huérfanos (campo7 tiene un BatchId GUID, campo8 es NULL)
-- Estos son documentos marcados con la versión anterior que nunca fueron enviados.
PRINT '== PASO 0: Diagnóstico de documentos huérfanos ==';
SELECT 
    co_tipo_doc, 
    COUNT(*) AS docs_huerfanos,
    MIN(nro_doc) AS desde_nro_doc,
    MAX(nro_doc) AS hasta_nro_doc
FROM dbo.saDocumentoVenta
WHERE 
    campo7 IS NOT NULL 
    AND campo8 IS NULL
    AND LEN(campo7) = 36  -- Parece un GUID (BatchId), no un StrongId ya procesado
    AND campo7 LIKE '%-%-%-%-%'
GROUP BY co_tipo_doc;
PRINT 'Si hay resultados arriba, estos documentos serán limpiados en el PASO 1.';
GO

-- PASO 1: Limpiar documentos huérfanos (marcados con campo7=BatchId pero nunca enviados)
PRINT '== PASO 1: Limpiando documentos huérfanos ==';
UPDATE dbo.saDocumentoVenta
SET campo7 = NULL, campo8 = NULL
WHERE 
    campo7 IS NOT NULL 
    AND campo8 IS NULL
    AND LEN(campo7) = 36
    AND campo7 LIKE '%-%-%-%-%'
    AND campo7 NOT IN (
        -- Excluir StrongIds legítimos que ya tienen un control asignado
        SELECT campo7 FROM dbo.saDocumentoVenta 
        WHERE campo8 IS NOT NULL AND n_control IS NOT NULL AND n_control != ''
    );
PRINT CONCAT('Documentos huérfanos limpiados: ', @@ROWCOUNT);
GO

-- PASO 2: Actualizar sp_MarkDocumentsForProcessing
-- ANTES: SET campo7 = @BatchId
-- AHORA: SET campo8 = @BatchId (con TOP @MaxDocs y subquery para orden)
PRINT '== PASO 2: Actualizando sp_MarkDocumentsForProcessing ==';
IF OBJECT_ID('dbo.sp_MarkDocumentsForProcessing', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_MarkDocumentsForProcessing;
GO

CREATE PROCEDURE [dbo].[sp_MarkDocumentsForProcessing]
    @BatchId            VARCHAR(50),
    @fechaHasta         DATETIME,
    @tiposDoc           VARCHAR(100),
    @FirstDocNumber_FACT VARCHAR(20) = NULL,
    @FirstDocNumber_NCR  VARCHAR(20) = NULL,
    @FirstDocNumber_NDB  VARCHAR(20) = NULL,
    @MaxDocs            INT = 5000,
    @MarkedCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE TOP (@MaxDocs) a
    SET a.campo8 = @BatchId          -- campo8 = BatchId (reserva el doc para este lote)
    FROM dbo.saDocumentoVenta a
    INNER JOIN (
        SELECT nro_doc, co_tipo_doc
        FROM dbo.saDocumentoVenta
        WHERE
            fec_emis <= @fechaHasta
            AND campo7 IS NULL
            AND campo8 IS NULL
            AND co_tipo_doc IN (SELECT Value FROM dbo.fn_SplitString(@tiposDoc, ','))
            AND (
                (co_tipo_doc = 'FACT' AND nro_doc >= @FirstDocNumber_FACT)
                OR (co_tipo_doc = 'N/CR' AND nro_doc >= @FirstDocNumber_NCR)
                OR (co_tipo_doc = 'N/DB' AND nro_doc >= @FirstDocNumber_NDB)
            )
    ) sub ON a.nro_doc = sub.nro_doc AND a.co_tipo_doc = sub.co_tipo_doc
    WHERE
        a.campo7 IS NULL
        AND a.campo8 IS NULL;

    SET @MarkedCount = @@ROWCOUNT;
END
GO

PRINT 'sp_MarkDocumentsForProcessing actualizado: campo8 = BatchId';
GO

-- PASO 3: Actualizar sp_GetDocumentsByBatch
-- ANTES: WHERE campo7 = @BatchId AND campo8 IS NULL
-- AHORA: WHERE campo8 = @BatchId AND campo7 IS NULL
PRINT '== PASO 3: Actualizando sp_GetDocumentsByBatch ==';
IF OBJECT_ID('dbo.sp_GetDocumentsByBatch', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDocumentsByBatch;
GO

CREATE PROCEDURE [dbo].[sp_GetDocumentsByBatch]
    @BatchId VARCHAR(50),
    @PageSize INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@PageSize)
        LTRIM(RTRIM(a.[co_tipo_doc])) as co_tipo_doc,
        LTRIM(RTRIM(a.[nro_doc])) as nro_doc,
        LTRIM(RTRIM(a.[co_cli])) as co_cli,
        LTRIM(RTRIM(b.tip_cli)) as tip_cli,
        dbo.fn_CleanString(b.rif) as rif,
        dbo.fn_CleanString(b.cli_des) as cli_des,
        dbo.fn_CleanString(b.telefonos) as telefonos,
        dbo.fn_CleanString(b.direc1) as direc1,
        LOWER(b.email) as email,
        LTRIM(RTRIM(b.tip_cli)) as tip_cli,
        LTRIM(RTRIM(a.[co_ven])) as co_ven,
        LTRIM(RTRIM(a.[co_mone])) as co_mone,
        a.[mov_ban],
        a.[tasa],
        a.[observa],
        a.[fec_reg],
        a.[fec_emis],
        a.[fec_venc],
        a.[anulado],
        a.[aut],
        a.[contrib],
        a.[doc_orig],
        a.[tipo_origen],
        a.[nro_orig],
        a.[nro_che],
        a.[saldo],
        a.[total_bruto],
        a.[porc_desc_glob],
        a.[monto_desc_glob],
        a.[total_neto],
        a.[monto_imp],
        a.[monto_imp2],
        a.[monto_imp3],
        a.[tipo_imp],
        a.[tipo_imp2],
        a.[tipo_imp3],
        a.[porc_imp],
        a.[porc_imp2],
        a.[porc_imp3],
        a.[n_control],
        a.[adicional],
        a.[ven_ter]
    FROM [dbo].[saDocumentoVenta] a
    INNER JOIN saCliente b ON a.co_cli = b.co_cli
    WHERE 
        a.campo8 = @BatchId
        AND a.campo7 IS NULL
    ORDER BY 
        a.co_tipo_doc, a.nro_doc
END
GO

PRINT 'sp_GetDocumentsByBatch actualizado: campo8 = BatchId, ORDER BY co_tipo_doc + nro_doc';
GO

-- PASO 4: Re-desplegar sp_CountFailedDocumentsInBatch
-- El archivo de migración 019 ya tenía la versión correcta (campo8=BatchId)
-- pero nunca fue desplegado en producción.
PRINT '== PASO 4: Re-desplegando sp_CountFailedDocumentsInBatch ==';
IF OBJECT_ID('sp_CountFailedDocumentsInBatch', 'P') IS NOT NULL
    DROP PROCEDURE sp_CountFailedDocumentsInBatch;
GO

CREATE PROCEDURE sp_CountFailedDocumentsInBatch
    @BatchId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*) AS FailedCount
    FROM saDocumentoVenta
    WHERE
        campo8 = @BatchId
        AND (campo7 IS NULL OR LEN(LTRIM(RTRIM(campo7))) < 30);
END
GO

PRINT 'sp_CountFailedDocumentsInBatch re-desplegado: campo8 = BatchId';
GO

-- PASO 5: Re-desplegar sp_GetAllDocumentsForRetry
-- El archivo de migración 020 ya tenía la versión correcta (campo8=BatchId)
-- pero nunca fue desplegado en producción.
PRINT '== PASO 5: Re-desplegando sp_GetAllDocumentsForRetry ==';
IF OBJECT_ID('dbo.sp_GetAllDocumentsForRetry', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetAllDocumentsForRetry;
GO

CREATE PROCEDURE [dbo].[sp_GetAllDocumentsForRetry]
    @BatchId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.*,
        b.cli_des,
        b.telefonos as cli_telefonos,
        b.email as cli_email,
        b.direc1 as cli_direc1
    FROM [dbo].[saDocumentoVenta] a
    INNER JOIN saCliente b ON a.co_cli = b.co_cli
    WHERE 
        a.campo8 = @BatchId
    ORDER BY 
        a.co_tipo_doc, a.nro_doc;
END
GO

PRINT 'sp_GetAllDocumentsForRetry re-desplegado: campo8 = BatchId, ORDER BY co_tipo_doc + nro_doc';
GO

-- PASO 6: Actualizar sp_GetDocumentosVentaParaProcesar (ORDER BY fix)
PRINT '== PASO 6: Actualizando ORDER BY en sp_GetDocumentosVentaParaProcesar ==';
IF OBJECT_ID('dbo.sp_GetDocumentosVentaParaProcesar', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDocumentosVentaParaProcesar;
GO

CREATE PROCEDURE [dbo].[sp_GetDocumentosVentaParaProcesar]
    @fechaHasta DATETIME,
    @tiposDoc VARCHAR(100) = 'FACT,N/CR,N/DB',
    @PageNumber INT = 1,
    @PageSize INT = NULL,
    @FirstDocNumber_FACT VARCHAR(20) = NULL,
    @FirstDocNumber_NCR VARCHAR(20) = NULL,
    @FirstDocNumber_NDB VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        LTRIM(RTRIM(a.[co_tipo_doc])) as co_tipo_doc,
        LTRIM(RTRIM(a.[nro_doc])) as nro_doc,
        LTRIM(RTRIM(a.[co_cli])) as co_cli,
        dbo.fn_CleanString(b.rif) as rif,
        dbo.fn_CleanString(b.cli_des) as cli_des,
        dbo.fn_CleanString(b.telefonos) as telefonos,
        dbo.fn_CleanString(b.direc1) as direc1,
        LOWER(b.email) as email,
        LTRIM(RTRIM(b.tip_cli)) as tip_cli,
        LTRIM(RTRIM(a.[co_ven])) as co_ven,
        LTRIM(RTRIM(a.[co_mone])) as co_mone,
        a.[mov_ban],
        a.[tasa],
        a.[observa],
        a.[fec_reg],
        a.[fec_emis],
        a.[fec_venc],
        a.[anulado],
        a.[aut],
        a.[contrib],
        a.[doc_orig],
        a.[tipo_origen],
        a.[nro_orig],
        a.[nro_che],
        a.[saldo],
        a.[total_bruto],
        a.[porc_desc_glob],
        a.[monto_desc_glob],
        a.[total_neto],
        a.[monto_imp],
        a.[monto_imp2],
        a.[monto_imp3],
        a.[tipo_imp],
        a.[tipo_imp2],
        a.[tipo_imp3],
        a.[porc_imp],
        a.[porc_imp2],
        a.[porc_imp3],
        a.[n_control],
        a.[adicional],
        a.[ven_ter]
    FROM [dbo].[saDocumentoVenta] a
    INNER JOIN saCliente b ON a.co_cli = b.co_cli
    WHERE 
        a.fec_emis <= @fechaHasta 
        AND a.campo7 IS NULL
        AND a.campo8 IS NULL
        AND a.co_tipo_doc IN (SELECT Value FROM dbo.fn_SplitString(@tiposDoc, ','))
        AND (
            (a.co_tipo_doc = 'FACT' AND a.nro_doc >= @FirstDocNumber_FACT)
            OR (a.co_tipo_doc = 'N/CR' AND a.nro_doc >= @FirstDocNumber_NCR)
            OR (a.co_tipo_doc = 'N/DB' AND a.nro_doc >= @FirstDocNumber_NDB)
        )
    ORDER BY 
        a.co_tipo_doc, a.nro_doc
    OFFSET CASE WHEN @PageSize IS NOT NULL THEN (@PageNumber - 1) * @PageSize ELSE 0 END ROWS
    FETCH NEXT CASE WHEN @PageSize IS NOT NULL THEN @PageSize ELSE 2147483647 END ROWS ONLY;
END
GO

PRINT 'sp_GetDocumentosVentaParaProcesar actualizado: ORDER BY co_tipo_doc + nro_doc';
GO

PRINT '========================================';
PRINT '== MIGRACIÓN 023 COMPLETADA ==';
PRINT '== Resumen de cambios: ==';
PRINT '== - campo7 = StrongId (resultado) ==';
PRINT '== - campo8 = BatchId (reserva) ==';
PRINT '== - ORDER BY co_tipo_doc, nro_doc ==';
PRINT '== - Docs huérfanos limpiados ==';
PRINT '========================================';
GO
