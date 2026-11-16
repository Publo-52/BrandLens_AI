import React, { useState, useMemo } from 'react';
import { Eye, CheckCircle2, XCircle, Sparkles, Sliders } from 'lucide-react';

const PRESET_PALETTES = [
  { label: 'Nova Primary Dark', bg: '#0F172A', text: '#F8FAFC' },
  { label: 'Nova Brand Blue', bg: '#2563EB', text: '#FFFFFF' },
  { label: 'Nova Light Surface', bg: '#FFFFFF', text: '#1E293B' },
  { label: 'Warning Accent', bg: '#FEF3C7', text: '#92400E' },
  { label: 'Low Contrast Failure', bg: '#E2E8F0', text: '#94A3B8' },
];

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return { r, g, b };
}

function getLuminance({ r, g, b }) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function calculateContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hexToRgb(hex1));
  const lum2 = getLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function ContrastChecker() {
  const [bgColor, setBgColor] = useState('#0F172A'); // Slate-900
  const [textColor, setTextColor] = useState('#F8FAFC'); // Slate-50
  const [sampleText, setSampleText] = useState('Experience reliable enterprise cloud governance.');

  const ratio = useMemo(() => {
    return Number(calculateContrastRatio(bgColor, textColor).toFixed(2));
  }, [bgColor, textColor]);

  const passAANormal = ratio >= 4.5;
  const passAAANormal = ratio >= 7.0;
  const passAALarge = ratio >= 3.0;
  const passAAALarge = ratio >= 4.5;

  const presetPalettes = PRESET_PALETTES;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-600" />
            Visual WCAG 2.1 Contrast & Palette Analyzer
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time mathematical luminance verification for accessible brand typography and graphics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Contrast Ratio:</span>
          <span className={`text-base font-bold font-mono px-2.5 py-0.5 rounded-lg border ${
            passAANormal
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-rose-50 text-rose-700 border-rose-300'
          }`}>
            {ratio}:1
          </span>
        </div>
      </div>

      {/* Preset Swatches */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Quick Brand Presets
        </label>
        <div className="flex flex-wrap gap-2">
          {presetPalettes.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setBgColor(p.bg);
                setTextColor(p.text);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 hover:border-brand-400 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-2 transition-colors"
            >
              <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: p.bg }} />
              <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: p.text }} />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Color Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 flex items-center justify-between">
            <span>Background Color</span>
            <span className="font-mono text-slate-500">{bgColor}</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-10 h-10 rounded border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs uppercase"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 flex items-center justify-between">
            <span>Text / Foreground Color</span>
            <span className="font-mono text-slate-500">{textColor}</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-10 h-10 rounded border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs uppercase"
            />
          </div>
        </div>
      </div>

      {/* Live Visual Canvas Preview */}
      <div 
        className="p-6 rounded-xl border border-slate-200 transition-colors shadow-inner space-y-2"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <div className="text-xl font-bold tracking-tight">
          BrandLens Headline (24px Bold)
        </div>
        <p className="text-sm leading-relaxed opacity-90">
          {sampleText}
        </p>
        <div className="text-xs opacity-75 font-mono">
          Small Print / Caption (12px Normal Text)
        </div>
      </div>

      {/* WCAG Compliance Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className={`p-3 rounded-lg border ${
          passAANormal ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-1.5 font-bold">
            {passAANormal ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
            <span>WCAG AA Normal</span>
          </div>
          <div className="text-[11px] mt-1 opacity-80">Req: 4.5:1 ratio</div>
        </div>

        <div className={`p-3 rounded-lg border ${
          passAAANormal ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-1.5 font-bold">
            {passAAANormal ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
            <span>WCAG AAA Normal</span>
          </div>
          <div className="text-[11px] mt-1 opacity-80">Req: 7.0:1 ratio</div>
        </div>

        <div className={`p-3 rounded-lg border ${
          passAALarge ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-1.5 font-bold">
            {passAALarge ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
            <span>WCAG AA Large</span>
          </div>
          <div className="text-[11px] mt-1 opacity-80">Req: 3.0:1 ratio</div>
        </div>

        <div className={`p-3 rounded-lg border ${
          passAAALarge ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-1.5 font-bold">
            {passAAALarge ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
            <span>WCAG AAA Large</span>
          </div>
          <div className="text-[11px] mt-1 opacity-80">Req: 4.5:1 ratio</div>
        </div>
      </div>
    </div>
  );
}
