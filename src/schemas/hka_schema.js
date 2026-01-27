export const hka_schema = {  
        "definitions": {},
        "$schema": "http://json-schema.org/draft-07/schema#", 
        "$id": "https://example.com/object1694055999.json", 
        "title": "Root", 
        "type": "object",
        "required": [
            "documentoElectronico"
        ],
        "properties": {
            "documentoElectronico": {
                "$id": "#root/documentoElectronico", 
                "title": "Documentoelectronico", 
                "type": "object",
                "required": [
                    "Encabezado",
                    "DetallesItems",
                    "DetallesRetencion",
                    "Viajes",
                    "InfoAdicional",
                    "GuiaDespacho",
                    "Transporte",
                    "EsLote"
                ],
                "properties": {
                    "Encabezado": {
                        "$id": "#root/documentoElectronico/Encabezado", 
                        "title": "Encabezado", 
                        "type": "object",
                        "required": [
                            "IdentificacionDocumento",
                            "Vendedor",
                            "comprador",
                            "SujetoRetenido",
                            "Tercero",
                            "Totales",
                            "TotalesRetencion",
                            "TotalesOtraMoneda",
                            "TotalDescuento"
                        ],
                        "properties": {
                            "IdentificacionDocumento": {
                                "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento", 
                                "title": "Identificaciondocumento", 
                                "type": "object",
                                "required": [
                                    "TipoDocumento",
                                    "NumeroDocumento",
                                    "TipoProveedor",
                                    "TipoTransaccion",
                                    "NumeroPlanillaImportacion",
                                    "NumeroExpedienteImportacion",
                                    "SerieFacturaAfectada",
                                    "NumeroFacturaAfectada",
                                    "FechaFacturaAfectada",
                                    "MontoFacturaAfectada",
                                    "ComentarioFacturaAfectada",
                                    "RegimenEspTributacion",
                                    "FechaEmision",
                                    "FechaVencimiento",
                                    "HoraEmision",
                                    "Anulado",
                                    "TipoDePago",
                                    "Serie",
                                    "Sucursal",
                                    "TipoDeVenta",
                                    "Moneda"
                                ],
                                "properties": {
                                    "TipoDocumento": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/TipoDocumento", 
                                        "title": "Tipodocumento", 
                                        "type": "string",
                                        "minLength": 2,
                                        "enum": ["01", "02","03"],
                                        "default": "",  
                                        "examples": [
                                            "01"
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "NumeroDocumento": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/NumeroDocumento", 
                                        "title": "Numerodocumento", 
                                        "type": "string",
                                        "minLength": 1,
                                        "maxLength": 8,
                                        "default": "",
                                        "examples": [
                                            "14589"
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "TipoProveedor": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/TipoProveedor", 
                                        "title": "Tipoproveedor", 
                                        "type": "string",
                                        "maxLength": 2,
                                        "default": "",
                                        "nullable": true
                                    },
                                    "TipoTransaccion": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/TipoTransaccion", 
                                        "title": "Tipotransaccion", 
                                        "type": "string",
                                        "maxLength": 2,
                                        "default": "",
                                        "nullable": true
                                    },
                                    "NumeroPlanillaImportacion": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/NumeroPlanillaImportacion", 
                                        "title": "Numeroplanillaimportacion", 
                                        "type": "string",
                                        "maxLength": 20,
                                        "default": "",
                                        "nullable": true
                                    },
                                    "NumeroExpedienteImportacion": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/NumeroExpedienteImportacion", 
                                        "title": "Numeroexpedienteimportacion", 
                                        "type": "string",
                                        "maxLength": 20,
                                        "default": "",
                                        "nullable": true
                                    },
                                    "SerieFacturaAfectada": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/SerieFacturaAfectada", 
                                        "title": "Seriefacturaafectada", 
                                        "type": "string",
                                        "maxLength": 20,
                                        "default": "",
                                        "nullable": true,
                                        "examples": [
                                            ""
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "NumeroFacturaAfectada": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/NumeroFacturaAfectada", 
                                        "title": "Numerofacturaafectada", 
                                        "type": "string",
                                        "maxLength": 20,
                                        "default": null,
                                        "nullable": true,
                                    },
                                    "FechaFacturaAfectada": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/FechaFacturaAfectada", 
                                        "title": "Fechafacturaafectada", 
                                        "type": "string",
                                        "maxLength": 10,
                                        "default": null,
                                        "nullable": true,
                                    },
                                    "MontoFacturaAfectada": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/MontoFacturaAfectada", 
                                        "title": "Montofacturaafectada", 
                                        "type": "string",
                                        "maxLength": 10,
                                        "default": null,
                                        "nullable": true,
                                    },
                                    "ComentarioFacturaAfectada": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/ComentarioFacturaAfectada", 
                                        "title": "Comentariofacturaafectada", 
                                        "type": "string",
                                        "maxLength": 255,
                                        "default": null,
                                        "nullable": true,
                                    },
                                    "RegimenEspTributacion": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/RegimenEspTributacion", 
                                        "title": "Regimenesptributacion", 
                                        "type": "string",
                                        "maxLength": 55,
                                        "enum": ["Zonas Económicas especiales","Zona franca de Paraguaná","Zona libre de Paraguaná","Puerto libre Santa Elena de Uairén","Zona libre de Mérida","Puerto Libre Edo. Nueva Esparta","Dutty Free", null],
                                        "default": null,
                                        "nullable": true,
                                    },
                                    "FechaEmision": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/FechaEmision", 
                                        "title": "Fechaemision", 
                                        "type": "string",
                                        "format": "date",
                                        "default": "",
                                        "examples": [
                                            "28/04/2023"
                                        ],
                                        "pattern": "^.*$",
                                    },
                                    "FechaVencimiento": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/FechaVencimiento", 
                                        "title": "Fechavencimiento", 
                                        "type": "string",
                                        "format": "date",
                                        "default": "",
                                        "examples": [
                                            "28/04/2023"
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "HoraEmision": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/HoraEmision", 
                                        "title": "Horaemision", 
                                        "type": "string",
                                        "format":"time",
                                        "default": "",
                                        "examples": [
                                            "12:00:00 am"
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "Anulado": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/Anulado", 
                                        "title": "Anulado", 
                                        "type": "boolean",
                                        "examples": [
                                            false
                                        ],
                                        "default": false
                                    },
                                    "TipoDePago": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/TipoDePago", 
                                        "title": "Tipodepago", 
                                        "type": "string",
                                        "enum": ["Credito", "inmediato"],
                                        "default": "Credito",
                                        "examples": [
                                            "Credito", "inmediato"
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "Serie": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/Serie", 
                                        "title": "Serie", 
                                        "type": "string",
                                        "maxLength": 20,
                                        "default": null,
                                        "nullable": true,
                                        "default": "",
                                        "examples": [
                                            ""
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "Sucursal": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/Sucursal", 
                                        "title": "Sucursal", 
                                        "type": "string",
                                        "maxLength": 6,
                                        "default": null,
                                        "nullable": true,
                                        "examples": [
                                            ""
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "TipoDeVenta": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/TipoDeVenta", 
                                        "title": "Tipodeventa", 
                                        "type": "string",
                                        "enum":["Interna","Exportación (INCOTERM)","FOB","CIF","EXW"],
                                        "default": "Interna",
                                        "examples": [
                                            "Interna"
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "Moneda": {
                                        "$id": "#root/documentoElectronico/Encabezado/IdentificacionDocumento/Moneda", 
                                        "title": "Moneda", 
                                        "type": "string",
                                        "enum":["VEF","USD","EUR", "COP"],
                                        "default": "",
                                        "examples": [
                                            "VEF","USD","EUR","COP"
                                        ],
                                        "pattern": "^.*$"
                                    }
                                }
                            }
    ,
                            "Vendedor": {
                                "$id": "#root/documentoElectronico/Encabezado/Vendedor", 
                                "title": "Vendedor", 
                                "type": "null",
                                "default": null
                            },
                            "comprador": {
                                "$id": "#root/documentoElectronico/Encabezado/comprador", 
                                "title": "Comprador", 
                                "type": "object",
                                "required": [
                                    "TipoIdentificacion",
                                    "NumeroIdentificacion",
                                    "RazonSocial",
                                    "Direccion",
                                    "Pais",
                                    "Notificar",
                                    "Telefono",
                                    "Correo"
                                ],
                                "properties": {
                                    "TipoIdentificacion": {
                                        "$id": "#root/documentoElectronico/Encabezado/comprador/TipoIdentificacion", 
                                        "title": "Tipoidentificacion", 
                                        "type": "string",
                                        "enum": ["V","J","E","P","G","C"],
                                        "default": "",
                                        "examples": [
                                            "J"
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "NumeroIdentificacion": {
                                        "$id": "#root/documentoElectronico/Encabezado/comprador/NumeroIdentificacion", 
                                        "title": "Numeroidentificacion", 
                                        "type": "string",
                                        "minLength": 1,
                                        "maxLength": 13,
                                        "default": "",
                                        "examples": [
                                            "503497947"
                                        ],
                                        "pattern": "^[0-9]*$"
                                    },
                                    "RazonSocial": {
                                        "$id": "#root/documentoElectronico/Encabezado/comprador/RazonSocial", 
                                        "title": "Razonsocial", 
                                        "type": "string",
                                        "minLength": 1,
                                        "maxLength": 100,
                                        "default": "",
                                        "examples": [
                                            "CLOTHING GEFS FASHION, C.A"
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "Direccion": {
                                        "$id": "#root/documentoElectronico/Encabezado/comprador/Direccion", 
                                        "title": "Direccion", 
                                        "type": "string",
                                        "minLength": 1,
                                        "maxLength": 255,
                                        "default": "",
                                        "examples": [
                                            "CALLE LOS CEDROS CASA MARIA AUXILIADORA NRO. 0 URB. LA CAMPIÑA, CARACAS DTO. CAPITAL CODIGO POSTAL 1050"
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "Pais": {
                                        "$id": "#root/documentoElectronico/Encabezado/comprador/Pais", 
                                        "title": "Pais", 
                                        "type": "string",
                                        "enum": ["VE","CO","PE","EC","PA","CR","GT","SV","HN","NI","MX","US","CA"],
                                        "default": "VE",
                                        "examples": [
                                            "VE"
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "Notificar": {
                                        "$id": "#root/documentoElectronico/Encabezado/comprador/Notificar", 
                                        "title": "Notificar", 
                                        "type": "string",
                                        "maxLength": 2,
                                        "default": "Si",
                                        "nullable": true,
                                        "examples": [
                                            "No"
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "Telefono": {
                                        "$id": "#root/documentoElectronico/Encabezado/comprador/Telefono", 
                                        "title": "Telefono", 
                                        "type": "array",
                                        "default": [],
                                        "items":{
                                            "$id": "#root/documentoElectronico/Encabezado/comprador/Telefono/items", 
                                            "title": "Items", 
                                            "type": "string",
                                            "maxLength": 20,
                                            "default": "",
                                            "examples": [
                                                "04126039777"
                                            ],
                                            "pattern": "^[0-9]*$"
                                        }
                                    },
                                    "Correo": {
                                        "$id": "#root/documentoElectronico/Encabezado/comprador/Correo", 
                                        "title": "Correo", 
                                        "type": "array",
                                        "default": [],
                                        "items":{
                                            "$id": "#root/documentoElectronico/Encabezado/comprador/Correo/items", 
                                            "title": "Items", 
                                            "type": "string",
                                            "default": "",
                                            "format": "email",
                                            "max-length": 50,
                                            "examples": [
                                                "FATINASGENESIS@GMAIL.COM"
                                            ],
                                            "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                                        }
                                    }
                                }
                            }
    ,
                            "SujetoRetenido": {
                                "$id": "#root/documentoElectronico/Encabezado/SujetoRetenido", 
                                "title": "Sujetoretenido", 
                                "type": "string",
                                "default": null,
                                "nullable": true
                            },
                            "Tercero": {
                                "$id": "#root/documentoElectronico/Encabezado/Tercero", 
                                "title": "Tercero", 
                                "type": "string",
                                "default": null, 
                                "nullable": true
                            },
                            "Totales": {
                                "$id": "#root/documentoElectronico/Encabezado/Totales", 
                                "title": "Totales", 
                                "type": "object",
                                "required": [
                                    "NroItems",
                                    "MontoGravadoTotal",
                                    "MontoExentoTotal",
                                    "Subtotal",
                                    "TotalAPagar",
                                    "TotalIVA",
                                    "MontoTotalConIVA",
                                    "MontoEnLetras",
                                    "TotalDescuento",
                                    "ListaDescBonificacion",
                                    "ImpuestosSubtotal",
                                    "FormasPago"
                                ],
                                "properties": {
                                    "NroItems": {
                                        "$id": "#root/documentoElectronico/Encabezado/Totales/NroItems", 
                                        "title": "Nroitems", 
                                        "type": "string",
                                        "min-length": 1,
                                        "max-length": 4,
                                        "default": "",
                                        "examples": [
                                            "1"
                                        ],
                                        "pattern": "^[0-9]*$"
                                    },
                                    "MontoGravadoTotal": {
                                        "$id": "#root/documentoElectronico/Encabezado/Totales/MontoGravadoTotal", 
                                        "title": "Montogravadototal", 
                                        "type": "string",
                                        "min-length": 1,
                                        "default": "",
                                        "examples": [
                                            "743.49"
                                        ],
                                        "pattern": "^[0-9,.!?]*$"
                                    },
                                    "MontoExentoTotal": {
                                        "$id": "#root/documentoElectronico/Encabezado/Totales/MontoExentoTotal", 
                                        "title": "Montoexentototal", 
                                        "type": "string",
                                        "min-length": 1,
                                        "default": "",
                                        "examples": [
                                            "0"
                                        ],
                                        "pattern": "^[0-9,.!?]*$"
                                    },
                                    "Subtotal": {
                                        "$id": "#root/documentoElectronico/Encabezado/Totales/Subtotal", 
                                        "title": "Subtotal", 
                                        "type": "string",
                                        "min-length": 1,
                                        "default": "",
                                        "examples": [
                                            "743.49"
                                        ],
                                        "pattern": "^[0-9,.!?]*$"
                                    },
                                    "TotalAPagar": {
                                        "$id": "#root/documentoElectronico/Encabezado/Totales/TotalAPagar", 
                                        "title": "Totalapagar", 
                                        "type": "string",
                                        "min-length": 1,
                                        "default": "",
                                        "examples": [
                                            "862.45"
                                        ],
                                        "pattern": "^[0-9,.!?]*$"
                                    },
                                    "TotalIVA": {
                                        "$id": "#root/documentoElectronico/Encabezado/Totales/TotalIVA", 
                                        "title": "Totaliva", 
                                        "type": "string",
                                        "min-length": 1,
                                        "default": "",
                                        "examples": [
                                            "118.96"
                                        ],
                                        "pattern": "^[0-9,.!?]*$"
                                    },
                                    "MontoTotalConIVA": {
                                        "$id": "#root/documentoElectronico/Encabezado/Totales/MontoTotalConIVA", 
                                        "title": "Montototalconiva", 
                                        "type": "string",
                                        "min-length": 1,
                                        "default": "",
                                        "examples": [
                                            "862.45"
                                        ],
                                        "pattern": "^[0-9,.!?]*$"
                                    },
                                    "MontoEnLetras": {
                                        "$id": "#root/documentoElectronico/Encabezado/Totales/MontoEnLetras", 
                                        "title": "Montoenletras", 
                                        "type": "string",
                                        "max-length": 255,
                                        "default": "",
                                        "examples": [
                                            "OCHOCIENTOS SESENTA Y DOS BOLÍVARES CON CUARENTA Y CINCO CÉNTIMOS"
                                        ],
                                        "pattern": "^.*$"
                                    },
                                    "TotalDescuento": {
                                        "$id": "#root/documentoElectronico/Encabezado/Totales/TotalDescuento", 
                                        "title": "Totaldescuento", 
                                        "type": "string",
                                        "nullable": true,
                                        "default": null,
                                        "pattern": "^[0-9,.!?]*$"

                                    },
                                    "ListaDescBonificacion": {
                                        "$id": "#root/documentoElectronico/Encabezado/Totales/ListaDescBonificacion", 
                                        "title": "Listadescbonificacion", 
                                        "type": "null",
                                        "default": null,
                                        "nullable":true
                                    },
                                    "ImpuestosSubtotal": {
                                        "$id": "#root/documentoElectronico/Encabezado/Totales/ImpuestosSubtotal", 
                                        "title": "Impuestossubtotal", 
                                        "type": "array",
                                        "default": [],
                                        "items":{
                                            "$id": "#root/documentoElectronico/Encabezado/Totales/ImpuestosSubtotal/items", 
                                            "title": "Items", 
                                            "type": "object",
                                            "required": [
                                                "CodigoTotalImp",
                                                "BaseImponibleImp",
                                                "ValorTotalImp"
                                            ],
                                            "properties": {
                                                "CodigoTotalImp": {
                                                    "$id": "#root/documentoElectronico/Encabezado/Totales/ImpuestosSubtotal/items/CodigoTotalImp", 
                                                    "title": "Codigototalimp", 
                                                    "type": "string",
                                                    "default": "",
                                                    "min-length": 1,
                                                    "enum": ["R", "G", "A", "E", "P", "X", "IGTF"],
                                                    "examples": [
                                                        "G"
                                                    ],
                                                    "pattern": "^.*$"
                                                },
                                                "BaseImponibleImp": {
                                                    "$id": "#root/documentoElectronico/Encabezado/Totales/ImpuestosSubtotal/items/BaseImponibleImp", 
                                                    "title": "Baseimponibleimp", 
                                                    "type": "string",
                                                    "min-length": 1,
                                                    "default": "",
                                                    "examples": [
                                                        "743.49"
                                                    ],
                                                    "pattern": "^[0-9,.!?]*$"
                                                },
                                                "ValorTotalImp": {
                                                    "$id": "#root/documentoElectronico/Encabezado/Totales/ImpuestosSubtotal/items/ValorTotalImp", 
                                                    "title": "Valortotalimp", 
                                                    "type": "string",
                                                    "min-length": 1,
                                                    "default": "",
                                                    "examples": [
                                                        "118.96"
                                                    ],
                                                    "pattern": "^[0-9,.!?]*$"
                                                }
                                            }
                                        }
    
                                    },
                                    "FormasPago": {
                                        "$id": "#root/documentoElectronico/Encabezado/Totales/FormasPago", 
                                        "title": "Formaspago", 
                                        "type": "null",
                                        "default": null,
                                        "nullable": true
                                    }
                                }
                            }
    ,
                            "TotalesRetencion": {
                                "$id": "#root/documentoElectronico/Encabezado/TotalesRetencion", 
                                "title": "Totalesretencion", 
                                "type": "null",
                                "default": null
                            },
                            "TotalesOtraMoneda": {
                                "$id": "#root/documentoElectronico/Encabezado/TotalesOtraMoneda", 
                                "title": "Totalesotramoneda", 
                                "type": "null",
                                "default": null
                            },
                            "TotalDescuento": {
                                "$id": "#root/documentoElectronico/Encabezado/TotalDescuento", 
                                "title": "Totaldescuento", 
                                "type": "string",
                                "default": "",
                                "examples": [
                                    "0.00"
                                ],
                                "pattern": "^.*$"
                            }
                        }
                    }
    ,
                    "DetallesItems": {
                        "$id": "#root/documentoElectronico/DetallesItems", 
                        "title": "Detallesitems", 
                        "type": "array",
                        "default": [],
                        "items":{
                            "$id": "#root/documentoElectronico/DetallesItems/items", 
                            "title": "Items", 
                            "type": "object",
                            "required": [
                                "NumeroLinea",
                                "CodigoCIIU",
                                "CodigoPLU",
                                "IndicadorBienoServicio",
                                "Descripcion",
                                "Cantidad",
                                "UnidadMedida",
                                "PrecioUnitario",
                                "PrecioUnitarioDescuento",
                                "MontoBonificacion",
                                "DescripcionBonificacion",
                                "DescuentoMonto",
                                "PrecioItem",
                                "CodigoImpuesto",
                                "TasaIVA",
                                "ValorIva",
                                "ValorTotalItem",
                                "InfoAdicionalItem",
                                "ListaItemOTI"
                            ],
                            "properties": {
                                "NumeroLinea": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/NumeroLinea", 
                                    "title": "Numerolinea", 
                                    "type": "string",
                                    "default": "",
                                    "max-length": 4,
                                    "examples": [
                                        "1"
                                    ],
                                    "pattern": "^[0-9]*$"
                                },
                                "CodigoCIIU": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/CodigoCIIU", 
                                    "title": "Codigociiu", 
                                    "type": "string",
                                    "default": "",
                                    "min-length": 1,
                                    "max-length": 6,
                                    "examples": [
                                        "K64-66"
                                    ],
                                    "pattern": "^.*$"
                                },
                                "CodigoPLU": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/CodigoPLU", 
                                    "title": "Codigoplu", 
                                    "type": "string",
                                    "max-length": 20,
                                    "default": "",
                                    "examples": [
                                        "7110301007"
                                    ],
                                    "pattern": "^.*$"
                                },
                                "IndicadorBienoServicio": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/IndicadorBienoServicio", 
                                    "title": "Indicadorbienoservicio", 
                                    "type": "string",
                                    "min-length": 1,
                                    "max-length": 1,
                                    "default": "",
                                    "examples": [
                                        "1"
                                    ],
                                    "pattern": "^[1-2]*$"
                                },
                                "Descripcion": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/Descripcion", 
                                    "title": "Descripcion", 
                                    "type": "string",
                                    "max-length": 255,
                                    "min-length": 1,
                                    "default": "",
                                    "examples": [
                                        "GASTOS ADMINISTRATIVOS"
                                    ],
                                    "pattern": "^.*$"
                                },
                                "Cantidad": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/Cantidad", 
                                    "title": "Cantidad", 
                                    "type": "string",
                                    "max-length": 11,
                                    "default": "",
                                    "examples": [
                                        "1"
                                    ],
                                    "pattern": "^[0-9,.!?]*$"
                                },
                                "UnidadMedida": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/UnidadMedida", 
                                    "title": "Unidadmedida", 
                                    "type": "string",
                                    "default": "",
                                    "enum": ['28'], //Colocar tantas unidades de medida como sean necesarias
                                    "examples": [
                                        "28"
                                    ],
                                    "pattern": "^.*$"
                                },
                                "PrecioUnitario": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/PrecioUnitario", 
                                    "title": "Preciounitario", 
                                    "type": "string",
                                    "default": "",
                                    "examples": [
                                        "743.49"
                                    ],
                                    "pattern": "^[0-9,.!?]*$"
                                },
                                "PrecioUnitarioDescuento": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/PrecioUnitarioDescuento", 
                                    "title": "Preciounitariodescuento", 
                                    "type": "string",
                                    "default": "",
                                    "nullable": true,
                                    "pattern": "^[0-9,.!?]*$"
                                },
                                "MontoBonificacion": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/MontoBonificacion", 
                                    "title": "Montobonificacion", 
                                    "type": "string",
                                    "default": "",
                                    "nullable": true,
                                    "pattern": "^[0-9,.!?]*$"
                                },
                                "DescripcionBonificacion": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/DescripcionBonificacion", 
                                    "title": "Descripcionbonificacion", 
                                    "type": "string",
                                    "default": null,
                                    "max-length": 255,
                                    "nullable": true
                                },
                                "DescuentoMonto": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/DescuentoMonto", 
                                    "title": "Descuentomonto", 
                                    "type": "string",
                                    "default": "",
                                    "nullable": true,
                                    "pattern": "^[0-9,.!?]*$"
                                },
                                "PrecioItem": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/PrecioItem", 
                                    "title": "Precioitem", 
                                    "type": "string",
                                    "default": "",
                                    "examples": [
                                        "862.45"
                                    ],
                                    "pattern": "^.*$"
                                },
                                "CodigoImpuesto": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/CodigoImpuesto", 
                                    "title": "Codigoimpuesto", 
                                    "type": "string",
                                    "default": "",
                                    "examples": [
                                        "G"
                                    ],
                                    "pattern": "^.*$"
                                },
                                "TasaIVA": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/TasaIVA", 
                                    "title": "Tasaiva", 
                                    "type": "string",
                                    "default": "",
                                    "examples": [
                                        "16"
                                    ],
                                    "pattern": "^.*$"
                                },
                                "ValorIva": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/ValorIva", 
                                    "title": "Valoriva", 
                                    "type": "string",
                                    "default": "",
                                    "examples": [
                                        "118.96"
                                    ],
                                    "pattern": "^.*$"
                                },
                                "ValorTotalItem": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/ValorTotalItem", 
                                    "title": "Valortotalitem", 
                                    "type": "string",
                                    "default": "",
                                    "examples": [
                                        "743.49"
                                    ],
                                    "pattern": "^.*$"
                                },
                                "InfoAdicionalItem": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/InfoAdicionalItem", 
                                    "title": "Infoadicionalitem", 
                                    "type": "null",
                                    "default": null
                                },
                                "ListaItemOTI": {
                                    "$id": "#root/documentoElectronico/DetallesItems/items/ListaItemOTI", 
                                    "title": "Listaitemoti", 
                                    "type": "null",
                                    "default": null
                                }
                            }
                        }
    
                    },
                    "DetallesRetencion": {
                        "$id": "#root/documentoElectronico/DetallesRetencion", 
                        "title": "Detallesretencion", 
                        "type": "null",
                        "default": null
                    },
                    "Viajes": {
                        "$id": "#root/documentoElectronico/Viajes", 
                        "title": "Viajes", 
                        "type": "null",
                        "default": null
                    },
                    "InfoAdicional": {
                        "$id": "#root/documentoElectronico/InfoAdicional", 
                        "title": "Infoadicional", 
                        "type": "array",
                        "default": []
                    },
                    "GuiaDespacho": {
                        "$id": "#root/documentoElectronico/GuiaDespacho", 
                        "title": "Guiadespacho", 
                        "type": "null",
                        "default": null
                    },
                    "Transporte": {
                        "$id": "#root/documentoElectronico/Transporte", 
                        "title": "Transporte", 
                        "type": "null",
                        "default": null
                    },
                    "EsLote": {
                        "$id": "#root/documentoElectronico/EsLote", 
                        "title": "Eslote", 
                        "type": "null",
                        "default": null
                    }
                }
            }
        }
}
    
