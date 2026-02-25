import { round2 } from './round.js';
import logger from '../helpers/logger.js';

/**
 * Módulo de validaciones Unidigital.
 * Implementa las reglas de formato/estructura y lógica fiscal
 * documentadas por Unidigital (https://docs.unidigital.global/).
 * 
 * Se ejecuta ANTES de enviar documentos a la API para detectar
 * errores localmente y evitar rechazos costosos.
 */

// ============================================================
// CONSTANTES DE VALIDACIÓN
// ============================================================
const VALID_DOC_TYPES = ['FA', 'NC', 'ND', 'GD', 'RI'];
const VALID_FISCAL_CODES = ['V', 'J', 'G', 'E', 'P'];
const VALID_TAX_CODES = ['G', 'R', 'S', 'E'];
const VALID_CURRENCIES = ['VES', 'USD', 'EUR'];
const LEGAL_TAX_PERCENT = 16;
const LEGAL_TAX_PERCENT_REDUCED = 8;
const LEGAL_TAX_PERCENT_SUMPTUARY = 31;
const LEGAL_IGTF_PERCENTAGE = 3;
// Tolerancia para comparaciones de punto flotante (0.01 = 1 céntimo)
const TOLERANCE = 0.02;

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function almostEqual(a, b, tolerance = TOLERANCE) {
    return Math.abs(a - b) <= tolerance;
}

function isValidEmail(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizePhone(phone) {
    if (!phone) return '';
    return phone.toString().replace(/[^0-9]/g, '');
}

// ============================================================
// 1. VALIDACIONES DE FORMATO Y ESTRUCTURA (Nivel de Campo)
// ============================================================

/**
 * Valida y sanitiza los campos de formato del documento.
 * Retorna un objeto con { errors: [], warnings: [], sanitized: {} }
 * donde `sanitized` contiene los valores corregidos automáticamente.
 */
function validateFormat(doc) {
    const errors = [];
    const warnings = [];
    const sanitized = {};

    // --- Phone: 12 dígitos, solo numérico ---
    const cleanPhone = sanitizePhone(doc.Phone);
    if (cleanPhone.length === 0) {
        sanitized.Phone = '000000000000';
        warnings.push(`Phone vacío, se usará valor por defecto '000000000000'.`);
    } else if (cleanPhone.length > 12) {
        sanitized.Phone = cleanPhone.substring(0, 12);
        warnings.push(`Phone '${doc.Phone}' excede 12 dígitos, truncado a '${sanitized.Phone}'.`);
    } else if (cleanPhone.length < 12) {
        sanitized.Phone = cleanPhone.padStart(12, '0');
        warnings.push(`Phone '${doc.Phone}' tiene menos de 12 dígitos, rellenado a '${sanitized.Phone}'.`);
    } else {
        sanitized.Phone = cleanPhone;
    }

    // --- FiscalRegistryCode: Solo V, J, G, E, P ---
    if (!VALID_FISCAL_CODES.includes(doc.FiscalRegistryCode)) {
        errors.push(`FiscalRegistryCode '${doc.FiscalRegistryCode}' no es válido. Permitidos: ${VALID_FISCAL_CODES.join(', ')}.`);
    }

    // --- FiscalRegistry: Solo dígitos, sin guiones ---
    const cleanRegistry = (doc.FiscalRegistry || '').replace(/[^0-9]/g, '');
    if (cleanRegistry.length === 0) {
        errors.push(`FiscalRegistry está vacío.`);
    } else if (cleanRegistry.length < 6) {
        warnings.push(`FiscalRegistry '${cleanRegistry}' tiene menos de 6 dígitos (mínimo recomendado).`);
        sanitized.FiscalRegistry = cleanRegistry.padStart(6, '0');
    } else if (cleanRegistry.length > 9) {
        sanitized.FiscalRegistry = cleanRegistry.substring(0, 9);
        warnings.push(`FiscalRegistry truncado de ${cleanRegistry.length} a 9 dígitos.`);
    } else {
        sanitized.FiscalRegistry = cleanRegistry;
    }

    // --- Name: Alfanumérico, sin caracteres especiales complejos ---
    if (!doc.Name || doc.Name.trim().length === 0) {
        errors.push(`Name está vacío.`);
    } else {
        // Limpiar caracteres no estándar pero mantener acentos y ñ
        const cleanName = doc.Name.replace(/[^\w\sáéíóúñÁÉÍÓÚÑüÜ.,\-\/()#&'°]/gi, '').trim();
        if (cleanName !== doc.Name.trim()) {
            sanitized.Name = cleanName;
            warnings.push(`Name sanitizado: caracteres especiales removidos.`);
        }
    }

    // --- Address: Obligatorio ---
    if (!doc.Address || doc.Address.trim().length === 0) {
        errors.push(`Address está vacío (obligatorio para documentos fiscales).`);
    } else {
        const cleanAddress = doc.Address.replace(/[^\w\sáéíóúñÁÉÍÓÚÑüÜ.,\-\/()#&'°:;]/gi, '').trim();
        if (cleanAddress !== doc.Address.trim()) {
            sanitized.Address = cleanAddress;
        }
    }

    // --- EmailTo: Obligatorio y con formato email válido ---
    const defaultEmail = process.env.DEFAULT_CLIENT_EMAIL || 'sincorreo@empresa.com';
    if (!doc.EmailTo || doc.EmailTo.trim().length === 0) {
        sanitized.EmailTo = defaultEmail;
        warnings.push(`EmailTo vacío, se usará valor por defecto '${defaultEmail}'.`);
    } else if (!isValidEmail(doc.EmailTo)) {
        warnings.push(`EmailTo '${doc.EmailTo}' no tiene formato válido de email, se usará '${defaultEmail}'.`);
        sanitized.EmailTo = defaultEmail;
    }

    // --- EmissionDateAndTime: ISO 8601 ---
    if (!doc.EmissionDateAndTime) {
        errors.push(`EmissionDateAndTime está vacío.`);
    } else {
        const dateObj = new Date(doc.EmissionDateAndTime);
        if (isNaN(dateObj.getTime())) {
            errors.push(`EmissionDateAndTime '${doc.EmissionDateAndTime}' no es una fecha válida ISO 8601.`);
        }
    }

    // --- DocumentType: Solo FA, NC, ND, GD, RI ---
    if (!VALID_DOC_TYPES.includes(doc.DocumentType)) {
        errors.push(`DocumentType '${doc.DocumentType}' no es válido. Permitidos: ${VALID_DOC_TYPES.join(', ')}.`);
    }

    // --- Currency: VES, USD, EUR ---
    if (!VALID_CURRENCIES.includes(doc.currency)) {
        errors.push(`Currency '${doc.currency}' no es válido. Permitidos: ${VALID_CURRENCIES.join(', ')}.`);
    }

    // --- ExchangeRate: Decimal > 0 si Currency != VES ---
    if (doc.currency !== 'VES') {
        if (!doc.ExchangeRate || doc.ExchangeRate <= 0) {
            errors.push(`ExchangeRate debe ser > 0 cuando Currency es '${doc.currency}'.`);
        }
    }

    // --- Details[].TaxCode: G, R, S, E ---
    if (doc.Details && Array.isArray(doc.Details)) {
        doc.Details.forEach((detail, idx) => {
            if (!VALID_TAX_CODES.includes(detail.TaxCode)) {
                errors.push(`Details[${idx}].TaxCode '${detail.TaxCode}' no es válido. Permitidos: ${VALID_TAX_CODES.join(', ')}.`);
            }
        });
    }

    // --- Alícuotas de Ley: Siempre enviar los valores legales ---
    if (doc.TaxPercent !== LEGAL_TAX_PERCENT) {
        sanitized.TaxPercent = LEGAL_TAX_PERCENT;
        warnings.push(`TaxPercent corregido a ${LEGAL_TAX_PERCENT} (valor legal).`);
    }
    if (doc.TaxPercentReduced !== LEGAL_TAX_PERCENT_REDUCED) {
        sanitized.TaxPercentReduced = LEGAL_TAX_PERCENT_REDUCED;
    }
    if (doc.TaxPercentSumptuary !== LEGAL_TAX_PERCENT_SUMPTUARY) {
        sanitized.TaxPercentSumptuary = LEGAL_TAX_PERCENT_SUMPTUARY;
    }
    if (doc.IGTFPercentage !== LEGAL_IGTF_PERCENTAGE) {
        sanitized.IGTFPercentage = LEGAL_IGTF_PERCENTAGE;
    }

    // --- Referencia: Obligatoria para NC y ND ---
    if (['NC', 'ND'].includes(doc.DocumentType)) {
        if (!doc.AffectedDocumentNumber || doc.AffectedDocumentNumber.toString().trim().length === 0) {
            errors.push(`AffectedDocumentNumber es obligatorio para documentos tipo ${doc.DocumentType}.`);
        }
    }

    return { errors, warnings, sanitized };
}

// ============================================================
// 2. VALIDACIONES DE CÁLCULO Y REGLAS DE NEGOCIO (Lógica Fiscal)
// ============================================================

/**
 * Valida las reglas de cálculo y lógica fiscal del documento.
 * Retorna un objeto con { errors: [], warnings: [], corrections: {} }
 * donde `corrections` contiene valores recalculados si es posible.
 */
function validateBusinessRules(doc) {
    const errors = [];
    const warnings = [];
    const corrections = {};

    if (!doc.Details || !Array.isArray(doc.Details) || doc.Details.length === 0) {
        errors.push('El documento no tiene líneas de detalle (Details).');
        return { errors, warnings, corrections };
    }

    // --- Cálculo de Línea: Quantity * UnitPrice == Amount ---
    let recalcTaxBase = 0;
    let recalcExempt = 0;
    let recalcTaxAmount = 0;

    for (let i = 0; i < doc.Details.length; i++) {
        const d = doc.Details[i];
        const expectedAmount = round2(d.Quantity * d.UnitPrice);
        if (!almostEqual(expectedAmount, d.Amount)) {
            warnings.push(`Details[${i}]: Quantity(${d.Quantity}) * UnitPrice(${d.UnitPrice}) = ${expectedAmount}, pero Amount = ${d.Amount}. Se corregirá.`);
            d.Amount = expectedAmount;
            d.TotalAmount = round2(expectedAmount + d.TaxAmount);
            d.AmountPlusDiscount = expectedAmount;
        }

        // --- Impuesto por Ítem: Amount * (TaxPercent / 100) == TaxAmount ---
        if (d.TaxPercent > 0) {
            const expectedTax = round2(d.Amount * d.TaxPercent / 100);
            if (!almostEqual(expectedTax, d.TaxAmount)) {
                warnings.push(`Details[${i}]: Amount(${d.Amount}) * TaxPercent(${d.TaxPercent})/100 = ${expectedTax}, pero TaxAmount = ${d.TaxAmount}. Se corregirá.`);
                d.TaxAmount = expectedTax;
                d.TotalAmount = round2(d.Amount + expectedTax);
            }
        }

        // Acumular para validaciones de encabezado
        if (d.IsExempt) {
            recalcExempt += d.Amount;
        } else {
            recalcTaxBase += d.Amount;
            recalcTaxAmount += d.TaxAmount;
        }
    }

    recalcTaxBase = round2(recalcTaxBase);
    recalcExempt = round2(recalcExempt);
    recalcTaxAmount = round2(recalcTaxAmount);

    // --- Base Imponible: Suma de Amount (no exentos) == TaxBase ---
    if (!almostEqual(recalcTaxBase, doc.TaxBase)) {
        warnings.push(`TaxBase: suma de líneas no exentas = ${recalcTaxBase}, pero encabezado tiene ${doc.TaxBase}. Se corregirá.`);
        corrections.TaxBase = recalcTaxBase;
    }

    // --- Monto Exento: Suma de Amount (exentos) == ExemptAmount ---
    if (!almostEqual(recalcExempt, doc.ExemptAmount)) {
        warnings.push(`ExemptAmount: suma de líneas exentas = ${recalcExempt}, pero encabezado tiene ${doc.ExemptAmount}. Se corregirá.`);
        corrections.ExemptAmount = recalcExempt;
    }

    // --- Recalcular totales coherentes ---
    const correctedTaxBase = corrections.TaxBase !== undefined ? corrections.TaxBase : doc.TaxBase;
    const correctedExempt = corrections.ExemptAmount !== undefined ? corrections.ExemptAmount : doc.ExemptAmount;
    const correctedTaxAmount = round2(recalcTaxAmount);

    if (!almostEqual(correctedTaxAmount, doc.TaxAmount)) {
        warnings.push(`TaxAmount: recalculado = ${correctedTaxAmount}, encabezado = ${doc.TaxAmount}. Se corregirá.`);
        corrections.TaxAmount = correctedTaxAmount;
        corrections.Taxes = correctedTaxAmount;
    }

    // --- Subtotal = TaxBase + ExemptAmount ---
    const expectedSubtotal = round2(correctedTaxBase + correctedExempt);
    if (!almostEqual(expectedSubtotal, doc.Subtotal)) {
        corrections.Subtotal = expectedSubtotal;
    }

    // --- Gran Total: TaxBase + TaxAmount + ExemptAmount == Total ---
    const finalTaxAmount = corrections.TaxAmount !== undefined ? corrections.TaxAmount : doc.TaxAmount;
    const expectedTotal = round2(expectedSubtotal - (doc.Discount || 0) + finalTaxAmount + (doc.PreviousBalance || 0));
    if (!almostEqual(expectedTotal, doc.Total)) {
        warnings.push(`Total: esperado ${expectedTotal} (TaxBase+ExemptAmount-Discount+TaxAmount+PreviousBalance), pero encabezado tiene ${doc.Total}. Se corregirá.`);
        corrections.Total = expectedTotal;
    }

    // --- SubtotalPlusDiscount ---
    const correctedSubtotal = corrections.Subtotal !== undefined ? corrections.Subtotal : doc.Subtotal;
    corrections.SubtotalPlusDiscount = round2(correctedSubtotal - (doc.Discount || 0) + (doc.PreviousBalance || 0));

    // --- GrandTotal = Total + Tip ---
    const correctedTotal = corrections.Total !== undefined ? corrections.Total : doc.Total;
    const expectedGrandTotal = round2(correctedTotal + (doc.Tip || 0));
    if (!almostEqual(expectedGrandTotal, doc.GrandTotal)) {
        corrections.GrandTotal = expectedGrandTotal;
    }

    // --- Conversión VES: Total * ExchangeRate == TotalVES ---
    if (doc.currency !== 'VES' && doc.ExchangeRate > 0) {
        const rate = doc.ExchangeRate;
        const corrTotal = corrections.Total !== undefined ? corrections.Total : doc.Total;
        
        const expectedTotalVES = round2(corrTotal * rate);
        if (!almostEqual(expectedTotalVES, doc.TotalVES)) {
            warnings.push(`TotalVES: esperado ${expectedTotalVES} (Total ${corrTotal} * Rate ${rate}), pero tiene ${doc.TotalVES}. Se corregirá.`);
            corrections.TotalVES = expectedTotalVES;
        }

        // Recalcular todos los campos VES para coherencia
        corrections.TaxBaseVES = round2(correctedTaxBase * rate);
        corrections.ExemptAmountVES = round2(correctedExempt * rate);
        corrections.TaxAmountVES = round2(finalTaxAmount * rate);
        corrections.SubtotalVES = round2(expectedSubtotal * rate);
        corrections.SubtotalPlusDiscountVES = round2((correctedSubtotal - (doc.Discount || 0) + (doc.PreviousBalance || 0)) * rate);
        
        const corrGrandTotal = corrections.GrandTotal !== undefined ? corrections.GrandTotal : doc.GrandTotal;
        corrections.GrandTotalVES = round2(corrGrandTotal * rate);
        corrections.TipVES = round2((doc.Tip || 0) * rate);
    }

    return { errors, warnings, corrections };
}

// ============================================================
// 3. FUNCIÓN PRINCIPAL DE VALIDACIÓN
// ============================================================

/**
 * Valida un documento completo antes de enviarlo a Unidigital.
 * Aplica sanitización automática y correcciones de cálculo cuando es posible.
 * 
 * @param {object} doc - El documento mapeado listo para enviar.
 * @returns {{ isValid: boolean, doc: object, errors: string[], warnings: string[] }}
 *   - isValid: true si el documento puede enviarse (sin errores bloqueantes).
 *   - doc: el documento con correcciones aplicadas.
 *   - errors: lista de errores bloqueantes que impiden el envío.
 *   - warnings: lista de advertencias/correcciones automáticas aplicadas.
 */
export function validateUnidigitalDocument(doc) {
    const allErrors = [];
    const allWarnings = [];

    // 1. Validaciones de formato
    const formatResult = validateFormat(doc);
    allErrors.push(...formatResult.errors);
    allWarnings.push(...formatResult.warnings);

    // Aplicar sanitización de formato
    Object.assign(doc, formatResult.sanitized);

    // 2. Validaciones de reglas de negocio
    const businessResult = validateBusinessRules(doc);
    allErrors.push(...businessResult.errors);
    allWarnings.push(...businessResult.warnings);

    // Aplicar correcciones de cálculo
    Object.assign(doc, businessResult.corrections);

    // 3. Log de resultados
    const docRef = `${doc.DocumentType}-${doc.Number}`;
    if (allWarnings.length > 0) {
        logger.debug(`[VALIDACIÓN ${docRef}] ${allWarnings.length} correcciones aplicadas: ${allWarnings.join(' | ')}`);
    }
    if (allErrors.length > 0) {
        logger.error(`[VALIDACIÓN ${docRef}] ${allErrors.length} errores bloqueantes: ${allErrors.join(' | ')}`);
    }

    return {
        isValid: allErrors.length === 0,
        doc,
        errors: allErrors,
        warnings: allWarnings
    };
}

/**
 * Valida un array de documentos. Separa los válidos de los inválidos.
 * 
 * @param {Array<object>} docs - Array de documentos mapeados.
 * @returns {{ validDocs: object[], invalidDocs: { doc: object, errors: string[] }[], totalWarnings: number }}
 */
export function validateDocumentBatch(docs) {
    const validDocs = [];
    const invalidDocs = [];
    let totalWarnings = 0;

    for (const doc of docs) {
        const result = validateUnidigitalDocument(doc);
        totalWarnings += result.warnings.length;

        if (result.isValid) {
            validDocs.push(result.doc);
        } else {
            invalidDocs.push({ doc: result.doc, errors: result.errors });
        }
    }

    if (invalidDocs.length > 0) {
        logger.warn(`[VALIDACIÓN BATCH] ${invalidDocs.length}/${docs.length} documentos rechazados por validación local.`);
    }
    if (totalWarnings > 0) {
        logger.info(`[VALIDACIÓN BATCH] ${totalWarnings} correcciones automáticas aplicadas en ${docs.length} documentos.`);
    }

    return { validDocs, invalidDocs, totalWarnings };
}
