export function round2(val) {
    return Math.round((val + Number.EPSILON) * 100) / 100;
}