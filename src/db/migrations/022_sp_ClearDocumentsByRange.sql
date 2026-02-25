-- =============================================
-- MIGRACIÓN 022: SP para Limpiar Documentos por Rango
-- Permite reprocesar documentos que quedaron marcados de lotes anteriores fallidos
-- =============================================
IF OBJECT_ID('dbo.sp_ClearDocumentsByRange', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ClearDocumentsByRange;
GO

CREATE PROCEDURE dbo.sp_ClearDocumentsByRange
    @DocType VARCHAR(10),       -- Tipo de documento: 'FACT', 'N/CR', 'N/DB'
    @FromDoc VARCHAR(20),       -- Número de documento inicial (inclusive)
    @ToDoc VARCHAR(20),         -- Número de documento final (inclusive)
    @ClearedCount INT OUTPUT    -- Cantidad de documentos limpiados
AS
BEGIN
    SET NOCOUNT ON;

    -- Limpiar los campos campo7 y campo8 para permitir reprocesamiento
    UPDATE dbo.saDocumentoVenta
    SET campo7 = NULL,
        campo8 = NULL
    WHERE co_tipo_doc = @DocType
      AND nro_doc >= @FromDoc
      AND nro_doc <= @ToDoc
      AND (campo7 IS NOT NULL OR campo8 IS NOT NULL);

    SET @ClearedCount = @@ROWCOUNT;
END;
GO
