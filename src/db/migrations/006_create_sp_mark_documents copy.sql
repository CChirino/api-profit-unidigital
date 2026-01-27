-- =============================================
-- MIGRACIÓN 006: SP para Marcar Documentos con un BatchId Externo
-- =============================================
IF OBJECT_ID('dbo.sp_MarkDocumentsForProcessing', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_MarkDocumentsForProcessing;
GO

CREATE PROCEDURE [dbo].[sp_MarkDocumentsForProcessing]
    -- PARÁMETROS DE ENTRADA
    @BatchId VARCHAR(50), -- El ID que viene de la API de Unidigital
    @fechaHasta DATETIME,
    @tiposDoc VARCHAR(100),
    @FirstDocNumber_FACT VARCHAR(20) = NULL,
    @FirstDocNumber_NCR VARCHAR(20) = NULL,
    @FirstDocNumber_NDB VARCHAR(20) = NULL,
    -- PARÁMETRO DE SALIDA
    @MarkedCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Actualiza todos los documentos elegibles con el ID de lote proporcionado.
    --TODO: Cambiara esto al momento de pasar al producción.
    UPDATE a -- Cambio Temporal y debe ser revisado para la ultima versión
    SET a.campo8 = @BatchId
    FROM dbo.saDocumentoVenta a
    WHERE 
        a.fec_emis <= @fechaHasta 
        AND a.campo7 IS NULL -- Solo los no procesados individualmente
        AND a.campo8 IS NULL -- Y los que no pertenecen ya a otro lote
        AND a.co_tipo_doc IN (SELECT Value FROM dbo.fn_SplitString(@tiposDoc, ','))
        AND (
            (a.co_tipo_doc = 'FACT' AND a.nro_doc >= @FirstDocNumber_FACT)
            OR (a.co_tipo_doc = 'N/CR' AND a.nro_doc >= @FirstDocNumber_NCR)
            OR (a.co_tipo_doc = 'N/DB' AND a.nro_doc >= @FirstDocNumber_NDB)
        )
    
    -- Devuelve el número de filas que fueron afectadas/marcadas.
    SET @MarkedCount = @@ROWCOUNT;
END
GO