-- =============================================
-- MIGRACIÓN 008: SP para Obtener Documentos por BatchId
-- =============================================
-- Descripción: Obtiene un sub-lote de documentos que pertenecen
--              a un lote específico para su procesamiento.
-- =============================================
IF OBJECT_ID('dbo.sp_GetDocumentsByBatch', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDocumentsByBatch;
GO

CREATE PROCEDURE [dbo].[sp_GetDocumentsByBatch]
    @BatchId VARCHAR(50), -- El ID del lote a procesar
    @PageSize INT         -- El tamaño del sub-lote (ej. 100)
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
        a.campo8 = @BatchId -- Filtramos por el lote específico
        AND a.campo7 IS NULL -- Y solo los que no han sido procesados individualmente
    ORDER BY 
        a.nro_doc
END
GO