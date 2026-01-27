IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[fn_CleanString]') AND type in (N'FN', N'IF', N'TF', N'FS', N'FT'))
BEGIN
    -- El EXEC es necesario para ejecutar el CREATE FUNCTION dentro de un bloque IF.
    EXEC('
    CREATE FUNCTION [dbo].[fn_CleanString]
    (
        @inputString VARCHAR(MAX)
    )
    RETURNS VARCHAR(MAX)
    WITH SCHEMABINDING
    AS
    BEGIN
        IF @inputString IS NULL RETURN NULL;
        DECLARE @cleanedString VARCHAR(MAX);
        SET @cleanedString = REPLACE(@inputString, CHAR(13), '''');
        SET @cleanedString = REPLACE(@cleanedString, CHAR(10), '' '');
        SET @cleanedString = REPLACE(@cleanedString, CHAR(9), '' '');
        SET @cleanedString = REPLACE(@cleanedString, ''"'', '''');
        SET @cleanedString = REPLACE(@cleanedString, ''\'', '''');
        
        -- CORRECCIÓN: Se reemplaza TRIM() por la versión compatible con SQL Server 2014
        SET @cleanedString = LTRIM(RTRIM(@cleanedString)); 
        
        RETURN @cleanedString;
    END
    ')
END
GO