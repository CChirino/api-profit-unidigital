IF OBJECT_ID('dbo.sp_UnmarkDocumentsByBatchId', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UnmarkDocumentsByBatchId;
GO

CREATE PROCEDURE dbo.sp_UnmarkDocumentsByBatchId
    @BatchId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.saDocumentoVenta
    SET campo7 = NULL,  -- BatchId
        campo8 = NULL   -- Estado (o el campo que uses para indicar que está en un lote)
    WHERE campo7 = @BatchId;
END;
GO