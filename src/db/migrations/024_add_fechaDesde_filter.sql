-- =============================================
-- MIGRACIÓN 024: Agregar filtro fechaDesde a SPs
-- Evita que documentos con fecha anterior a 2025 se incluyan en lotes
-- =============================================
PRINT '=== MIGRACIÓN 024: Agregar filtro @fechaDesde a SPs ===';
GO

-- PASO 1: Actualizar sp_GetDocumentosVentaParaProcesar
PRINT '== PASO 1: Actualizando sp_GetDocumentosVentaParaProcesar ==';
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
    @FirstDocNumber_NDB VARCHAR(20) = NULL,
    @fechaDesde DATETIME = '2025-01-01'
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
        a.fec_emis >= @fechaDesde
        AND a.fec_emis <= @fechaHasta 
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

PRINT 'sp_GetDocumentosVentaParaProcesar actualizado: filtro fechaDesde agregado';
GO

-- PASO 2: Actualizar sp_MarkDocumentsForProcessing
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
    @MarkedCount        INT OUTPUT,
    @fechaDesde         DATETIME = '2025-01-01'
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE TOP (@MaxDocs) a
    SET a.campo8 = @BatchId
    FROM dbo.saDocumentoVenta a
    INNER JOIN (
        SELECT nro_doc, co_tipo_doc
        FROM dbo.saDocumentoVenta
        WHERE
            fec_emis >= @fechaDesde
            AND fec_emis <= @fechaHasta
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

PRINT 'sp_MarkDocumentsForProcessing actualizado: filtro fechaDesde agregado';
GO

PRINT '=== MIGRACIÓN 024 COMPLETADA ===';
GO
