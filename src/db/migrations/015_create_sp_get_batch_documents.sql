-- =============================================
-- MIGRACIÓN 015: SP para Obtener los Documentos de un Lote
-- Descripción: Devuelve una lista de documentos con campos clave
--              pertenecientes a un BatchId específico.
-- =============================================

IF OBJECT_ID('dbo.sp_GetDocumentsByBatchId', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDocumentsByBatchId;
GO

CREATE PROCEDURE dbo.sp_GetDocumentsByBatchId
    @BatchId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.nro_doc AS DocumentNumber,
        a.n_control AS ControlNumber,
        a.campo7 AS UnidigitalStrongId,
        a.fec_emis AS EmissionDate,
        a.co_cli AS ClientCode,
        c.cli_des AS ClientName,
        a.monto_imp AS TaxAmount,
        a.total_neto AS GrandTotal
    FROM
        dbo.saDocumentoVenta a -- Usamos alias 'a'
    INNER JOIN
        dbo.saCliente c ON a.co_cli = c.co_cli -- El JOIN para obtener el nombre
    WHERE
        a.campo8 = @BatchId
    ORDER BY
        a.fec_emis, a.nro_doc;
END
GO

PRINT 'Stored Procedure sp_GetDocumentsByBatchId creado exitosamente.';
GO