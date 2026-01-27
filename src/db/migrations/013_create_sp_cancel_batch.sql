-- =============================================
-- MIGRACIÓN 013: SP para Cancelar un Lote Manualmente
-- Descripción: Actualiza el estado de un lote a 'Cancelado' (99)
--              y establece la fecha y motivo de la cancelación.
-- =============================================

IF OBJECT_ID('dbo.sp_CancelBatchLog', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CancelBatchLog;
GO

CREATE PROCEDURE dbo.sp_CancelBatchLog
    @BatchStrongId VARCHAR(50),
    @Reason NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    -- Actualizamos el lote si está en estado:
    -- 1 = Abierto (Open) - para lotes huérfanos FAIL- que nunca llegaron a Unidigital
    -- 2 = Cerrado (Closed)
    -- 5 = Error Fatal
    -- Esto permite cancelar lotes fallidos o huérfanos (prefijo FAIL-)
    UPDATE dbo.UnidigitalBatchLog
    SET
        CurrentStatus = 99, -- 99 = Cancelado Manualmente
        CanceledDate = GETDATE(),
        ErrorMessage = @Reason
    WHERE
        BatchStrongId = @BatchStrongId
        AND CurrentStatus NOT IN (99, 4); -- Cualquier estado excepto ya Cancelado (99) o Asignado (4)

    -- Devolvemos el número de filas afectadas. Será 1 si tuvo éxito, 0 si no.
    SELECT @@ROWCOUNT AS CanceledCount;
END
GO

PRINT 'Stored Procedure sp_CancelBatchLog creado exitosamente.';
GO