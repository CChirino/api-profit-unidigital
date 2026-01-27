-- =============================================
-- SP para Obtener el Lote Abierto para una Serie
-- =============================================
IF OBJECT_ID('dbo.sp_GetOpenBatchBySerie', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetOpenBatchBySerie;
GO

CREATE PROCEDURE dbo.sp_GetOpenBatchBySerie
    @SerieStrongId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
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
    WHERE
        SerieStrongId = @SerieStrongId
        AND CurrentStatus = 1 -- 1 = Abierto
    ORDER BY
        CreatedDate DESC;
END
GO

PRINT 'Stored Procedure sp_GetOpenBatchBySerie creado exitosamente.';
GO