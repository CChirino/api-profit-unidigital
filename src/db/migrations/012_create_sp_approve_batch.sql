-- =============================================
-- MIGRACIÓN 012: SP para Aprobar un Lote Manualmente
-- Descripción: Actualiza el estado de un lote a 'Aprobado' (6)
--              y establece la fecha de aprobación.
-- =============================================

IF OBJECT_ID('dbo.sp_ApproveBatchLog', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ApproveBatchLog;
GO

CREATE PROCEDURE dbo.sp_ApproveBatchLog
    @BatchStrongId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    -- Actualizamos el lote solo si está en estado 'Cerrado' (5)
    -- para asegurar que el flujo sea correcto.
    UPDATE dbo.UnidigitalBatchLog
    SET
        CurrentStatus = 3, -- 3 = Aprobado
        ApprovedDate = GETDATE()
    WHERE
        BatchStrongId = @BatchStrongId
        AND CurrentStatus = 2; -- Solo se puede aprobar un lote que ya está cerrado.

    -- Devolvemos el número de filas afectadas. Será 1 si tuvo éxito, 0 si no.
    SELECT @@ROWCOUNT AS ApprovedCount;
END
GO

PRINT 'Stored Procedure sp_ApproveBatchLog creado exitosamente.';
GO