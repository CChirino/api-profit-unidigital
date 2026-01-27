-- =============================================
-- Script para crear una función de split compatible
-- =============================================
-- Comprobamos si la función ya existe para que el script se pueda ejecutar varias veces sin error.
IF OBJECT_ID('dbo.fn_SplitString', 'TF') IS NOT NULL
    DROP FUNCTION dbo.fn_SplitString;
GO

CREATE FUNCTION [dbo].[fn_SplitString]
(
    @String NVARCHAR(MAX),
    @Delimiter CHAR(1)
)
RETURNS @output TABLE(
    Value NVARCHAR(MAX)
)
AS
BEGIN
    DECLARE @start INT, @end INT;
    SELECT @start = 1, @end = CHARINDEX(@Delimiter, @String);

    WHILE @start < LEN(@String) + 1 BEGIN
        IF @end = 0 
            SET @end = LEN(@String) + 1;

        INSERT INTO @output (Value) 
        VALUES(SUBSTRING(@String, @start, @end - @start));

        SET @start = @end + 1;
        SET @end = CHARINDEX(@Delimiter, @String, @start);
    END

    RETURN;
END
GO