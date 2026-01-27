IF OBJECT_ID('dbo.sp_GetFirstFailedBatch', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetFirstFailedBatch;
GO
CREATE PROCEDURE sp_GetFirstFailedBatch
AS
BEGIN
    SET NOCOUNT ON;

    -- Selecciona el TOP 1 de campo8 (BatchId) de cualquier documento que tenga el estado de fallo.
    -- Esto es muy rápido y nos da el lote que necesita atención.
    SELECT TOP 1
        campo8 AS BatchId
    FROM 
        saDocumentoVenta -- ¡IMPORTANTE! Asegúrate de que este es el nombre correcto de tu tabla.
    WHERE 
        campo7 = 'FALLIDO-ENVIO';
END
GO