-- =============================================
-- MIGRACIÓN 014: SPs para Sincronizar Controles Fiscales
-- =============================================

-- SP 1: Actualiza el número de control en las tablas de Profit
IF OBJECT_ID('dbo.sp_UpdateDocumentControlNumber', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UpdateDocumentControlNumber;
GO

CREATE PROCEDURE dbo.sp_UpdateDocumentControlNumber
    @DocumentNumber VARCHAR(20),
    @ControlNumber VARCHAR(20),
    @DocumentType VARCHAR(10) -- Para identificar la tabla correcta
AS
BEGIN
    SET NOCOUNT ON;

    -- Actualizamos la tabla principal de documentos
    UPDATE dbo.saDocumentoVenta
    SET n_control = @ControlNumber
    WHERE nro_doc = @DocumentNumber
    AND co_tipo_doc = @DocumentType;

    -- Si es una factura, actualizamos también la tabla de facturas
    IF @DocumentType = 'FACT'
    BEGIN
        UPDATE dbo.saFacturaVenta
        SET n_control = @ControlNumber
        WHERE doc_num = @DocumentNumber;
    END
END
GO

PRINT 'Stored Procedure sp_UpdateDocumentControlNumber creado exitosamente.';
GO

-- SP 2: Marca un lote como "Asignado" (4) en nuestro log
IF OBJECT_ID('dbo.sp_AssignBatchLog', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_AssignBatchLog;
GO

CREATE PROCEDURE dbo.sp_AssignBatchLog
    @BatchStrongId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    -- Actualizamos el lote a estado 4 (Assigned) solo si está en estado 3 (Approved).
    UPDATE dbo.UnidigitalBatchLog
    SET
        CurrentStatus = 4, -- 4 = Assigned
        PrintedDate = GETDATE() -- Usamos PrintedDate como la fecha de asignación
    WHERE
        BatchStrongId = @BatchStrongId
        AND CurrentStatus = 3; -- Solo se puede sincronizar un lote que ya está aprobado.
END
GO

PRINT 'Stored Procedure sp_AssignBatchLog creado exitosamente.';
GO