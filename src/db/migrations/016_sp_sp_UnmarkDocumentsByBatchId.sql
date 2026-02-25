IF OBJECT_ID('dbo.sp_UnmarkDocumentsByBatchId', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UnmarkDocumentsByBatchId;
GO

CREATE PROCEDURE dbo.sp_UnmarkDocumentsByBatchId
    @BatchId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    -- Limpiar docs donde campo7 = BatchId (marcados por sp_MarkDocumentsForProcessing, aún no enviados)
    UPDATE dbo.saDocumentoVenta
    SET campo7 = NULL,
        campo8 = NULL
    WHERE campo7 = @BatchId;

    -- Limpiar docs donde campo8 = BatchId (marcados como FALLIDO-ENVIO, FALLIDO-VALIDACION, etc.)
    UPDATE dbo.saDocumentoVenta
    SET campo7 = NULL,
        campo8 = NULL
    WHERE campo8 = @BatchId;

    -- Limpiar también saFacturaVenta para documentos FACT
    UPDATE dbo.saFacturaVenta
    SET campo7 = NULL,
        campo8 = NULL
    WHERE campo7 = @BatchId OR campo8 = @BatchId;
END;
GO