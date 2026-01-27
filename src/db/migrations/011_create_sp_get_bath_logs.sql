-- =============================================
-- MIGRACIÓN 011: SP para Consultar el Log de Lotes
-- Descripción: Obtiene una lista paginada de los registros de lotes,
--              ordenados por fecha de creación descendente.
-- =============================================

IF OBJECT_ID('dbo.sp_GetBatchLogs', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetBatchLogs;
GO

CREATE PROCEDURE dbo.sp_GetBatchLogs
    @PageNumber INT = 1,
    @PageSize INT = 25
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        BatchStrongId,
        SerieStrongId,
        CurrentStatus,
        CreatedDate,
        OpenedDate,
        ClosedDate,
        CanceledDate,
        ApprovedDate,
        PrintedDate,
        DateFrom,
        DateTo,
        DocType,
        FirstDocNumber,
        LastDocNumber,
        TotalDocuments,
        ProcessedDocuments,
        FailedDocuments,
        CreatedBy,
        ErrorMessage
    FROM
        dbo.UnidigitalBatchLog
    ORDER BY
        CreatedDate DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

PRINT 'Stored Procedure sp_GetBatchLogs creado exitosamente.';
GO