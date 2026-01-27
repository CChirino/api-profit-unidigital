-- =============================================
-- MIGRACIÓN 010: Stored Procedures para UnidigitalBatchLog
-- =============================================

-- SP para INSERTAR un nuevo registro de lote.
IF OBJECT_ID('dbo.sp_CreateBatchLogEntry', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CreateBatchLogEntry;
GO

CREATE PROCEDURE dbo.sp_CreateBatchLogEntry
    @BatchStrongId VARCHAR(50),
    @SerieStrongId VARCHAR(50),
    @CreatedBy VARCHAR(100),
    @DateFrom DATETIME,
    @DateTo DATETIME,
    @DocType VARCHAR(10),
    @FirstDocNumber VARCHAR(20),
    @LastDocNumber VARCHAR(20),
    @TotalDocuments INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.UnidigitalBatchLog (
        BatchStrongId,
        SerieStrongId,
        CreatedBy,
        DateFrom,
        DateTo,
        DocType,
        FirstDocNumber,
        LastDocNumber,
        TotalDocuments,
        CurrentStatus, -- Estado inicial (ej: 1 = Creado)
        OpenedDate     -- Fecha de apertura del lote en Unidigital
    )
    VALUES (
        @BatchStrongId,
        @SerieStrongId,
        @CreatedBy,
        @DateFrom,
        @DateTo,
        @DocType,
        @FirstDocNumber,
        @LastDocNumber,
        @TotalDocuments,
        1, -- Asignamos un estado inicial de 'Creado y Marcado'
        GETDATE() -- Usamos la fecha actual como la fecha de apertura
    );
END
GO

PRINT 'Stored Procedure sp_CreateBatchLogEntry creado exitosamente.';
GO

-- SP para ACTUALIZAR el estado de un lote existente.
IF OBJECT_ID('dbo.sp_UpdateBatchLogStatus', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UpdateBatchLogStatus;
GO

CREATE PROCEDURE dbo.sp_UpdateBatchLogStatus
    @BatchStrongId VARCHAR(50),
    @NewStatus INT,
    @ProcessedCount INT = NULL,
    @FailedCount INT = NULL,
    @ErrorMessage NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.UnidigitalBatchLog
    SET
        CurrentStatus = @NewStatus,
        ProcessedDocuments = ISNULL(@ProcessedCount, ProcessedDocuments),
        FailedDocuments = ISNULL(@FailedCount, FailedDocuments),
        ErrorMessage = ISNULL(@ErrorMessage, ErrorMessage),
        -- Actualiza la fecha correspondiente al nuevo estado oficial
        -- 1=Open, 2=Closed, 3=Approved, 5=Canceled
        ClosedDate = CASE WHEN @NewStatus = 2 THEN GETDATE() ELSE ClosedDate END,
        ApprovedDate = CASE WHEN @NewStatus = 3 THEN GETDATE() ELSE ApprovedDate END,
        CanceledDate = CASE WHEN @NewStatus = 5 THEN GETDATE() ELSE CanceledDate END
    WHERE
        BatchStrongId = @BatchStrongId;
END
GO

PRINT 'Stored Procedure sp_UpdateBatchLogStatus (con estados oficiales) creado exitosamente.';
GO