/*
================================================================================
 MIGRACIÓN 005: ÍNDICES DE RENDIMIENTO (VERSIÓN COMPATIBLE CON SQL SERVER 2014)
================================================================================
Descripción:
Crea los índices necesarios para optimizar la consulta del Stored Procedure
sp_GetDocumentosVentaParaProcesar, solucionando problemas de timeout.
*/

-- 1. Eliminar índices antiguos si existen (sintaxis compatible con SQL 2014)
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_saDocumentoVenta_Performance' AND object_id = OBJECT_ID('dbo.saDocumentoVenta'))
BEGIN
    DROP INDEX IX_saDocumentoVenta_Performance ON dbo.saDocumentoVenta;
END
GO

-- 2. Crear el índice filtrado y de cobertura para la tabla principal saDocumentoVenta.
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_saDocumentoVenta_ParaProcesar_V2' AND object_id = OBJECT_ID('dbo.saDocumentoVenta'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_saDocumentoVenta_ParaProcesar_V2
    ON [dbo].[saDocumentoVenta] (
        [fec_emis],
        [nro_doc]
    )
    INCLUDE (
        [co_tipo_doc], [co_cli], [doc_orig], [co_ven], [co_mone], [mov_ban],
        [tasa], [observa], [fec_reg], [fec_venc], [anulado], [aut], [contrib],
        [tipo_origen], [nro_orig], [nro_che], [saldo], [total_bruto],
        [porc_desc_glob], [monto_desc_glob], [total_neto], [monto_imp],
        [monto_imp2], [monto_imp3], [tipo_imp], [tipo_imp2], [tipo_imp3],
        [porc_imp], [porc_imp2], [porc_imp3], [n_control], [adicional], [ven_ter]
    )
    WHERE [campo7] IS NULL;
END
GO

-- 3. Crear índices en las tablas secundarias para acelerar las uniones (JOINs).
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_saFacturaVenta_doc_num' AND object_id = OBJECT_ID('dbo.saFacturaVenta'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_saFacturaVenta_doc_num 
    ON dbo.saFacturaVenta (doc_num)
    INCLUDE (campo7);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_saDevolucionCliente_doc_num' AND object_id = OBJECT_ID('dbo.saDevolucionCliente'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_saDevolucionCliente_doc_num 
    ON dbo.saDevolucionCliente (doc_num);
END
GO