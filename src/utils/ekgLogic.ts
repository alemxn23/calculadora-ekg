export type Sex = 'M' | 'F';

export interface AxisResult {
    angle: number;
    classification: string;
}

export interface QTcResult {
    bazett: number;
    fridericia: number;
    framingham: number;
}

export interface LVHResult {
    sokolow: { value: number; positive: boolean };
    cornell: { value: number; positive: boolean };
    peguero: { value: number; positive: boolean };
    lewis: { value: number; positive: boolean };
}

/**
 * Calcula el eje cardiaco basado en las derivaciones DI y aVF.
 * Utiliza trigonometría exacta: arctan(aVF / DI) * (180 / PI).
 */
export function calculateAxis(di: number, avf: number): AxisResult {
    if (di === 0 && avf === 0) return { angle: 0, classification: 'Indeterminado' };

    let angle = Math.atan2(avf, di) * (180 / Math.PI);
    angle = Math.round(angle);

    let classification = '';
    if (angle >= -30 && angle <= 90) {
        classification = 'Normal';
    } else if (angle > 90 && angle <= 180) {
        classification = 'Desviación Derecha';
    } else if (angle >= -90 && angle < -30) {
        classification = 'Desviación Izquierda';
    } else {
        classification = 'Desviación Extrema';
    }

    return { angle, classification };
}

/**
 * Calcula el QTc usando las fórmulas de Bazett y Fridericia.
 * Requiere QT en ms y FC en lpm.
 */
export function calculateQTc(qt: number, hr: number): QTcResult {
    if (hr <= 0 || qt <= 0) return { bazett: 0, fridericia: 0, framingham: 0 };

    const rr = 60 / hr; // RR en segundos
    const bazett = qt / Math.sqrt(rr);
    const fridericia = qt / Math.cbrt(rr);
    const framingham = qt + 154 * (1 - rr);

    return {
        bazett: Math.round(bazett),
        fridericia: Math.round(fridericia),
        framingham: Math.round(framingham)
    };
}

/**
 * Calcula los criterios de Hipertrofia Ventricular Izquierda (HVI).
 * Requiere amplitudes en mm y el sexo del paciente.
 */
export function calculateLVH(
    sex: Sex,
    s_v1: number,
    r_v5_v6: number,
    r_avl: number,
    s_v3: number,
    s_v4: number,
    deepest_s: number,
    r_di: number,
    s_diii: number,
    r_diii: number,
    s_di: number
): LVHResult {
    // Sokolow-Lyon: S(V1) + R(V5 o V6) >= 35 mm
    const sokolowValue = s_v1 + r_v5_v6;
    const isSokolowPositive = sokolowValue >= 35;

    // Cornell: R(aVL) + S(V3) > 28 mm (H) o > 20 mm (M)
    const cornellValue = r_avl + s_v3;
    const isCornellPositive = sex === 'M' ? cornellValue > 28 : cornellValue > 20;

    // Peguero-Lo Presti: S más profunda + S(V4) >= 28 mm (H) o >= 23 mm (M)
    const pegueroValue = deepest_s + s_v4;
    const isPegueroPositive = sex === 'M' ? pegueroValue >= 28 : pegueroValue >= 23;

    // Lewis: (R(DI) + S(DIII)) - (R(DIII) + S(DI)) > 17 mm
    const lewisValue = (r_di + s_diii) - (r_diii + s_di);
    const isLewisPositive = lewisValue > 17;

    return {
        sokolow: { value: sokolowValue, positive: isSokolowPositive },
        cornell: { value: cornellValue, positive: isCornellPositive },
        peguero: { value: pegueroValue, positive: isPegueroPositive },
        lewis: { value: lewisValue, positive: isLewisPositive }
    };
}
