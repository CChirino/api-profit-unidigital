IF OBJECT_ID('sp_CountFailedDocumentsInBatch', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE sp_CountFailedDocumentsInBatch;
END
GO

CREATE PROCEDURE sp_CountFailedDocumentsInBatch
    @BatchId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    -- Un documento se considera fallido si su campo7 (donde va el StrongId de Unidigital)
    -- es nulo, está vacío o tiene una longitud menor a 30 caracteres.
    -- Un StrongId válido tiene 36 caracteres.
    SELECT COUNT(*) AS FailedCount
    FROM saDocumentoVenta
    WHERE
        campo8 = @BatchId
        AND (campo7 IS NULL OR LEN(LTRIM(RTRIM(campo7))) < 30);
END
GO