-- =============================================
-- Stored Procedure para eliminar lotes huérfanos (FAIL-)
-- Solo permite eliminar registros con BatchStrongId que empiece con 'FAIL-'
-- =============================================
IF OBJECT_ID('dbo.sp_DeleteOrphanBatchLog', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_DeleteOrphanBatchLog;
GO

CREATE PROCEDURE dbo.sp_DeleteOrphanBatchLog
    @BatchStrongId VARCHAR(50)
AS
BEGIN
    DECLARE @DeletedCount INT;

    -- Validar que el ID tenga el prefijo FAIL-
    IF @BatchStrongId NOT LIKE 'FAIL-%'
    BEGIN
        RAISERROR('Solo se pueden eliminar lotes con prefijo FAIL-', 16, 1);
        RETURN;
    END

    -- Eliminar el registro huérfano
    DELETE FROM dbo.UnidigitalBatchLog
    WHERE BatchStrongId = @BatchStrongId;

    -- Capturar cantidad de filas eliminadas INMEDIATAMENTE después del DELETE
    SET @DeletedCount = @@ROWCOUNT;

    -- Retornar cantidad de filas eliminadas
    SELECT @DeletedCount AS DeletedCount;
END
GO

PRINT 'Stored Procedure sp_DeleteOrphanBatchLog creado exitosamente.';
GO
