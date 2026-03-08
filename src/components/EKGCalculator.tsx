import React, { useState, useMemo, useRef, useEffect } from 'react';
import { calculateAxis, calculateQTc, calculateLVH, Sex } from '../utils/ekgLogic';

/**
 * Renders an image with its white/near-white background removed via Canvas,
 * preserving 100% of the original colors.
 */
function TransparentImg({ src, alt, style, threshold = 230 }: {
    src: string;
    alt: string;
    style?: React.CSSProperties;
    threshold?: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                // If pixel is near-white, make it transparent
                if (r > threshold && g > threshold && b > threshold) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);
            setLoaded(true);
        };
        img.src = src;
    }, [src, threshold]);

    return (
        <canvas
            ref={canvasRef}
            aria-label={alt}
            style={{
                display: loaded ? 'block' : 'none',
                ...style,
            }}
        />
    );
}

interface InputState {
    sex: Sex;
    age: string;
    hr: string;
    qt: string;
    di: string;
    avf: string;
    s_v1: string;
    r_v5_v6: string;
    r_avl: string;
    s_v3: string;
    s_v4: string;
    deepest_s: string;
    r_di: string;
    s_di: string;
    r_diii: string;
    s_diii: string;
}

const INITIAL_STATE: InputState = {
    sex: 'M',
    age: '',
    hr: '',
    qt: '',
    di: '',
    avf: '',
    s_v1: '',
    r_v5_v6: '',
    r_avl: '',
    s_v3: '',
    s_v4: '',
    deepest_s: '',
    r_di: '',
    s_di: '',
    r_diii: '',
    s_diii: '',
};

export default function EKGCalculator() {
    const [inputs, setInputs] = useState<InputState>(INITIAL_STATE);

    const handleNumberChange = (field: keyof InputState, value: string, allowNegative: boolean = false) => {
        if (value === '' || (allowNegative && value === '-')) {
            setInputs(prev => ({ ...prev, [field]: value }));
            return;
        }
        const num = parseFloat(value);
        if (isNaN(num)) return;
        if (!allowNegative && num < 0) return;
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    const results = useMemo(() => {
        const hr = parseFloat(inputs.hr) || 0;
        const qt = parseFloat(inputs.qt) || 0;
        const di = parseFloat(inputs.di) || 0;
        const avf = parseFloat(inputs.avf) || 0;
        const s_v1 = parseFloat(inputs.s_v1) || 0;
        const r_v5_v6 = parseFloat(inputs.r_v5_v6) || 0;
        const r_avl = parseFloat(inputs.r_avl) || 0;
        const s_v3 = parseFloat(inputs.s_v3) || 0;
        const s_v4 = parseFloat(inputs.s_v4) || 0;
        const deepest_s = parseFloat(inputs.deepest_s) || 0;
        const r_di = parseFloat(inputs.r_di) || 0;
        const s_di = parseFloat(inputs.s_di) || 0;
        const r_diii = parseFloat(inputs.r_diii) || 0;
        const s_diii = parseFloat(inputs.s_diii) || 0;

        const axis = (inputs.di !== '' && inputs.avf !== '') ? calculateAxis(di, avf) : null;
        const qtc = (hr > 0 && qt > 0) ? calculateQTc(qt, hr) : null;
        const lvh = calculateLVH(inputs.sex, s_v1, r_v5_v6, r_avl, s_v3, s_v4, deepest_s, r_di, s_diii, r_diii, s_di);

        return { axis, qtc, lvh };
    }, [inputs]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', paddingBottom: '80px' }}>

            {/* ── Header ── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 50,
                background: 'rgba(18,18,18,0.95)',
                borderBottom: '1px solid rgba(255,255,255,0.09)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
            }}>
                <div style={{
                    maxWidth: '1200px', margin: '0 auto',
                    padding: '14px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                    flexWrap: 'wrap',
                }}>
                    {/* Left — hospital identity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Cardiología HCSAE — black bg disappears perfectly with screen blend, zero quality loss */}
                        <img
                            src="/cardiologia_hcsae.png"
                            alt="Cardiología HCSAE PEMEX"
                            style={{
                                height: '64px',
                                width: 'auto',
                                objectFit: 'contain',
                                mixBlendMode: 'screen',
                            }}
                        />
                        <div>
                            <h1 style={{
                                margin: 0,
                                fontSize: 'clamp(0.9rem, 2vw, 1.2rem)',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                color: '#e6edf3',
                                lineHeight: 1.2,
                            }}>
                                Calculadora de Índices de Hipertrofia
                            </h1>
                            {/* Hospital + PEMEX + Eagle line */}
                            <p style={{
                                margin: '5px 0 0',
                                fontSize: '0.6rem',
                                fontWeight: 500,
                                letterSpacing: '0.07em',
                                textTransform: 'uppercase',
                                color: '#8b949e',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                flexWrap: 'wrap',
                            }}>
                                Hosp. Central Sur Alta Especialidad
                                <span style={{ color: '#484f58', fontSize: '0.55rem' }}>·</span>
                                <span style={{ color: '#00a651', fontWeight: 700, letterSpacing: '0.12em' }}>
                                    PEMEX
                                </span>
                                {/* Eagle PEMEX — inside a branded dark-red chip, full quality */}
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    background: 'rgba(198, 40, 40, 0.15)',
                                    border: '1px solid rgba(198, 40, 40, 0.35)',
                                    borderRadius: '5px',
                                    padding: '1px 5px 1px 3px',
                                    verticalAlign: 'middle',
                                    gap: '3px',
                                }}>
                                    <img
                                        src="/pemex_aguila.png"
                                        alt="PEMEX Eagle"
                                        style={{
                                            height: '16px',
                                            width: 'auto',
                                            objectFit: 'contain',
                                            display: 'block',
                                        }}
                                    />
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
                {/* Decorative EKG line */}
                <div className="ekg-line" />
            </header>


            {/* ── Main ── */}
            <main style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* SECCIÓN 1: Datos Generales */}
                <section className="glass-card" style={{ padding: '28px' }}>
                    <SectionTitle number="1" label="Datos Generales" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginTop: '20px' }}>
                        {/* Sex toggle */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Sexo Biológico
                            </label>
                            <div style={{ display: 'flex', border: '1px solid var(--border-medium)', borderRadius: '8px', overflow: 'hidden' }}>
                                {(['M', 'F'] as const).map((s, i) => (
                                    <button
                                        key={s}
                                        onClick={() => setInputs(prev => ({ ...prev, sex: s }))}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            letterSpacing: '0.06em',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer',
                                            border: 'none',
                                            borderLeft: i === 1 ? '1px solid var(--border-medium)' : 'none',
                                            background: inputs.sex === s ? 'var(--accent-red)' : 'transparent',
                                            color: inputs.sex === s ? '#fff' : 'var(--text-secondary)',
                                            transition: 'background 0.2s ease, color 0.2s ease',
                                        }}
                                    >
                                        {s === 'M' ? 'Hombre' : 'Mujer'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <InputField label="Edad (Años)" value={inputs.age} onChange={v => handleNumberChange('age', v)} placeholder="Ej. 45" />
                        <InputField label="Frecuencia Cardiaca (lpm)" value={inputs.hr} onChange={v => handleNumberChange('hr', v)} placeholder="Ej. 75" />
                        <InputField label="Intervalo QT (ms)" value={inputs.qt} onChange={v => handleNumberChange('qt', v)} placeholder="Ej. 400" />
                    </div>
                </section>

                {/* SECCIÓN 2: Eje Cardiaco */}
                <section className="glass-card" style={{ padding: '28px' }}>
                    <SectionTitle number="2" label="Eje Cardiaco — Amplitud Neta" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                        <InputField label="DI (mm)" value={inputs.di} onChange={v => handleNumberChange('di', v, true)} placeholder="Ej. 5" allowNegative />
                        <InputField label="aVF (mm)" value={inputs.avf} onChange={v => handleNumberChange('avf', v, true)} placeholder="Ej. -2" allowNegative />
                    </div>

                    {results.axis && (
                        <div className="fade-in" style={{
                            marginTop: '24px',
                            padding: '24px',
                            background: 'rgba(198,40,40,0.08)',
                            border: '1px solid var(--red-border)',
                            borderRadius: '10px',
                            textAlign: 'center',
                        }}>
                            <p style={{ margin: '0 0 6px', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                                Eje Cardiaco
                            </p>
                            <p style={{ margin: '0', fontSize: '3.5rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)', lineHeight: 1 }}>
                                {results.axis.angle}°
                            </p>
                            <p style={{ margin: '10px 0 0', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-red-light)' }}>
                                {results.axis.classification}
                            </p>
                        </div>
                    )}
                </section>

                {/* SECCIÓN 3: Amplitudes HVI */}
                <section className="glass-card" style={{ padding: '28px' }}>
                    <SectionTitle number="3" label="Amplitudes para Criterios HVI (mm)" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: '16px', marginTop: '20px' }}>
                        <InputField label="S en V1" value={inputs.s_v1} onChange={v => handleNumberChange('s_v1', v)} />
                        <InputField label="R en V5/V6" value={inputs.r_v5_v6} onChange={v => handleNumberChange('r_v5_v6', v)} />
                        <InputField label="R en aVL" value={inputs.r_avl} onChange={v => handleNumberChange('r_avl', v)} />
                        <InputField label="S en V3" value={inputs.s_v3} onChange={v => handleNumberChange('s_v3', v)} />
                        <InputField label="S en V4" value={inputs.s_v4} onChange={v => handleNumberChange('s_v4', v)} />
                        <InputField label="S más profunda" value={inputs.deepest_s} onChange={v => handleNumberChange('deepest_s', v)} />
                        <InputField label="R en DI" value={inputs.r_di} onChange={v => handleNumberChange('r_di', v)} />
                        <InputField label="S en DI" value={inputs.s_di} onChange={v => handleNumberChange('s_di', v)} />
                        <InputField label="R en DIII" value={inputs.r_diii} onChange={v => handleNumberChange('r_diii', v)} />
                        <InputField label="S en DIII" value={inputs.s_diii} onChange={v => handleNumberChange('s_diii', v)} />
                    </div>
                </section>

                {/* SECCIÓN 4: Resultados */}
                <section className="glass-card" style={{ padding: '28px' }}>
                    <SectionTitle number="4" label="Resultados Clínicos" />

                    {/* QTc */}
                    <div style={{ marginTop: '24px', marginBottom: '32px' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                            Intervalo QTc Corregido
                        </h3>
                        {results.qtc ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                <ResultRow label="Bazett" value={results.qtc.bazett} />
                                <ResultRow label="Fridericia" value={results.qtc.fridericia} />
                                <ResultRow label="Framingham" value={results.qtc.framingham} />
                            </div>
                        ) : (
                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                                Ingrese FC y QT para calcular.
                            </p>
                        )}
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: 'var(--border-subtle)', marginBottom: '24px' }} />

                    {/* HVI */}
                    <div>
                        <h3 style={{ margin: '0 0 16px', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                            Hipertrofia Ventricular Izquierda (HVI)
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <HviRow label="Sokolow-Lyon" value={results.lvh.sokolow.value} isPositive={results.lvh.sokolow.positive} />
                            <HviRow label="Cornell" value={results.lvh.cornell.value} isPositive={results.lvh.cornell.positive} />
                            <HviRow label="Peguero-Lo Presti" value={results.lvh.peguero.value} isPositive={results.lvh.peguero.positive} />
                            <HviRow label="Lewis" value={results.lvh.lewis.value} isPositive={results.lvh.lewis.positive} />
                        </div>
                    </div>
                </section>

            </main>

            {/* ── Footer ── */}
            <footer style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
                background: 'rgba(13,17,23,0.92)',
                borderTop: '1px solid var(--border-subtle)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                padding: '10px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
            }}>
                {/* MedTech logo — frosted pill: standard for white-bg logos in dark-mode UI */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.85 }}>
                    <span style={{ fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Desarrollado por
                    </span>
                    <div style={{
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                        /* Container height clips the logo — only the illustration is visible */
                        height: '32px',
                    }}>
                        <img
                            src="/medtech_logo.png"
                            alt="MedTech Labs"
                            style={{
                                /* Show at full natural scale so illustration fills the container.
                                   The text at the bottom is cropped out by the parent overflow:hidden.
                                   Adjust translateY to center the illustration in the clip area. */
                                height: '55px',
                                width: 'auto',
                                objectFit: 'none',
                                marginTop: '-4px',
                                display: 'block',
                            }}
                        />
                    </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.6rem', fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', lineHeight: 1.4, textAlign: 'center' }}>
                    ⚕ Herramienta de apoyo clínico. Los resultados no constituyen diagnóstico médico ni sustituyen el juicio del especialista. Verifique siempre los valores.
                </p>
            </footer>
        </div>
    );
}

// ── Auxiliar Components ──

function SectionTitle({ number, label }: { number: string; label: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="section-badge">{number}</span>
            <h2 style={{
                margin: 0,
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
            }}>
                {label}
            </h2>
        </div>
    );
}

function InputField({ label, value, onChange, placeholder, allowNegative = false }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    allowNegative?: boolean;
}) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {label}
            </label>
            <input
                type="number"
                inputMode={allowNegative ? 'numeric' : 'decimal'}
                className="calc-input"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}

function ResultRow({ label, value }: { label: string; value: number }) {
    let bg = 'var(--bg-surface-2)';
    let border = 'var(--border-subtle)';
    let textColor = 'var(--text-primary)';
    let statusLabel = '—';
    let statusColor = 'var(--text-muted)';

    if (value > 0) {
        if (value <= 440) {
            bg = 'var(--green-bg)'; border = 'var(--green-border)'; textColor = 'var(--green-text)';
            statusLabel = 'Normal'; statusColor = 'var(--green-text)';
        } else if (value <= 480) {
            bg = 'var(--yellow-bg)'; border = 'var(--yellow-border)'; textColor = 'var(--yellow-text)';
            statusLabel = 'Borderline'; statusColor = 'var(--yellow-text)';
        } else {
            bg = 'var(--red-bg)'; border = 'var(--red-border)'; textColor = 'var(--red-text)';
            statusLabel = 'Prolongado'; statusColor = 'var(--red-text)';
        }
    }

    return (
        <div style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: '8px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            transition: 'background 0.3s ease',
        }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                {label}
            </span>
            <span style={{ fontSize: '1.6rem', fontFamily: 'monospace', fontWeight: 700, color: textColor, lineHeight: 1 }}>
                {value} <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>ms</span>
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: statusColor, letterSpacing: '0.06em' }}>
                {statusLabel}
            </span>
        </div>
    );
}

function HviRow({ label, value, isPositive }: { label: string; value: number; isPositive: boolean }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '14px 18px',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            transition: 'border-color 0.2s ease',
        }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.03em', color: 'var(--text-primary)' }}>
                {label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: isPositive ? 'var(--red-text)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {value} mm
                </span>
                <span className={isPositive ? 'badge-positive' : 'badge-negative'}>
                    {isPositive ? '✕ POSITIVO' : '✓ NEGATIVO'}
                </span>
            </div>
        </div>
    );
}
