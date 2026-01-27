-- =============================================
-- MIGRACIÓN 008: SP para Actualizar Estado y IDs de Documento
-- =============================================
IF OBJECT_ID('dbo.sp_UpdateDocumentStatus', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UpdateDocumentStatus;
GO

CREATE PROCEDURE [dbo].[sp_UpdateDocumentStatus]
    @nro_doc VARCHAR(20),
    @co_tipo_doc VARCHAR(10),
    @documentId VARCHAR(50), -- Para campo7
    @batchId VARCHAR(50)     -- Para campo8
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.saDocumentoVenta
    SET 
        campo7 = @documentId,
        campo8 = @batchId
    WHERE 
        nro_doc = @nro_doc 
        AND co_tipo_doc = @co_tipo_doc;

    IF @co_tipo_doc = 'FACT'
    BEGIN
        UPDATE dbo.saFacturaVenta
        SET campo7 = @documentId,
            campo8 = @batchId
        WHERE doc_num = @nro_doc;
    END
END
GO