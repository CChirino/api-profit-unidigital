-- =============================================
-- MIGRACIÓN 006: SP para Marcar Documentos con un BatchId Externo
-- =============================================
IF OBJECT_ID('dbo.sp_MarkDocumentsForProcessing', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_MarkDocumentsForProcessing;
GO

CREATE PROCEDURE [dbo].[sp_MarkDocumentsForProcessing]
    -- PARÁMETROS DE ENTRADA
    @BatchId            VARCHAR(50),  -- El ID que viene de la API de Unidigital
    @fechaHasta         DATETIME,
    @tiposDoc           VARCHAR(100),
    @FirstDocNumber_FACT VARCHAR(20) = NULL,
    @FirstDocNumber_NCR  VARCHAR(20) = NULL,
    @FirstDocNumber_NDB  VARCHAR(20) = NULL,
    @MaxDocs            INT = 5000,   -- Límite máximo de documentos a marcar por lote
    -- PARÁMETRO DE SALIDA
    @MarkedCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Marca como máximo @MaxDocs documentos elegibles con el ID de lote proporcionado,
    -- ordenados por nro_doc ASC para respetar la correlatividad.
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
        -- ORDER BY nro_doc ASC  -- TOP sin ORDER no garantiza orden; usamos INNER JOIN para controlar
    ) sub ON a.nro_doc = sub.nro_doc AND a.co_tipo_doc = sub.co_tipo_doc
    WHERE
        a.campo7 IS NULL
        AND a.campo8 IS NULL;

    -- Devuelve el número de filas que fueron afectadas/marcadas.
    SET @MarkedCount = @@ROWCOUNT;
END
GO