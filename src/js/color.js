const PHI = 1.618
const COLOR_SEED = 47
const THEMES = {
    "GOTHIC": { s: 0.2, l: 0.2 },
    "PASTEL": { s: 0.2, l: 0.8 },
    "CYBERPUNK": { s: 0.8, l: 0.8 },
    "EVENING": { s: 0.8, l: 0.2 },
}

function getBase(x, y, seed) {
    const val = Math.sin(x + seed) * Math.sin(y + seed)
    return (val/2.0) + 1.0
}

function getNoise(x, y, p) {
    return ((x * y) % p) / p - 0.5
}

function getPrimaryColor(x, y, s, l) {
    const base = getBase(x, y, COLOR_SEED)
    const noise = getNoise(x, y, COLOR_SEED)
    const h = base + noise
    const hslStr = hsl2string(h, s,l)
    return hslStr
}

function getSecondaryColor(x, y, s, l) {
    const base = getBase(x, y, COLOR_SEED)
    const noise = getNoise(x, y, COLOR_SEED)
    const h = base + noise + PHI
    const hslStr = hsl2string(h, s,  l)
    return hslStr
}

function hsl2string(h, s, l){
    return `hsl${Math.round(h*255)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%`
}