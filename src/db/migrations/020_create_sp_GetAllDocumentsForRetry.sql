-- =============================================
-- MIGRACIÓN 020: SP para Obtener TODOS los Documentos para Reintento
-- =============================================
-- Descripción: Obtiene TODOS los documentos que pertenecen a un lote
--              específico, sin paginación ni filtros en campo7.
--              Usado exclusivamente por el flujo de reintento.
-- =============================================
IF OBJECT_ID('dbo.sp_GetAllDocumentsForRetry', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetAllDocumentsForRetry;
GO

CREATE PROCEDURE [dbo].[sp_GetAllDocumentsForRetry]
    @BatchId VARCHAR(50) -- El ID del lote a procesar
AS
BEGIN
    SET NOCOUNT ON;

    -- Este SP devuelve todos los documentos de un lote, incluyendo su campo7,
    -- para que la lógica de negocio en JS decida qué hacer.
    SELECT
        a.*, -- Seleccionamos todas las columnas de saDocumentoVenta
        b.cli_des,
        b.telefonos as cli_telefonos,
        b.email as cli_email,
        b.direc1 as cli_direc1
    FROM [dbo].[saDocumentoVenta] a
    INNER JOIN saCliente b ON a.co_cli = b.co_cli
    WHERE 
        a.campo8 = @BatchId
    ORDER BY 
        a.nro_doc;
END
GO

PRINT 'Stored Procedure sp_GetAllDocumentsForRetry creado exitosamente.';
GO