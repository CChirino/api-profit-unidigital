-- =============================================
-- MIGRACIÓN 009: SP para Obtener Renglones de un Documento (Versión 2)
-- Descripción: Obtiene los renglones de un documento, consultando la tabla
--              correcta ('saFacturaVentaReng' o 'saDocumentoVentaReng')
--              basado en el co_tipo_doc.
-- =============================================
IF OBJECT_ID('dbo.sp_GetDocumentRenglones', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetDocumentRenglones;
GO

CREATE PROCEDURE [dbo].[sp_GetDocumentRenglones]
    @nro_doc VARCHAR(20),
    @co_tipo_doc VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    -- Si el tipo de documento es 'FACT', consultamos la tabla de renglones de factura.
    IF @co_tipo_doc = 'FACT'
    BEGIN
        SELECT
            reng_num,
            re.co_art,
            art_des as des_art,
            total_art AS Quantity, -- AJUSTAR SI EL CAMPO DE CANTIDAD ES DIFERENTE
            prec_vta AS UnitPrice,
            reng_neto AS Amount,
            monto_imp AS TaxAmount,
            porc_imp AS TaxPercent
        FROM
            dbo.saFacturaVentaReng re -- <-- TABLA DE FACTURAS
             INNER JOIN dbo.saArticulo ar ON re.co_art = ar.co_art
        WHERE
            doc_num = @nro_doc
        ORDER BY
            reng_num;
    END
    -- Para cualquier otro tipo de documento (N/CR, N/DB, etc.), consultamos la tabla genérica.
    ELSE
    BEGIN
        SELECT
            reng_num,
            co_art,
            des_art,
            total_art AS Quantity, -- AJUSTAR SI EL CAMPO DE CANTIDAD ES DIFERENTE
            prec_vta AS UnitPrice,
            reng_neto AS Amount,
            monto_imp AS TaxAmount,
            porc_imp AS TaxPercent
        FROM
            dbo.saDocumentoVentaReng -- <-- TABLA GENÉRICA DE DOCUMENTOS
        WHERE
            nro_doc = @nro_doc
            AND co_tipo_doc = @co_tipo_doc
        ORDER BY
            reng_num;
    END
END
GO