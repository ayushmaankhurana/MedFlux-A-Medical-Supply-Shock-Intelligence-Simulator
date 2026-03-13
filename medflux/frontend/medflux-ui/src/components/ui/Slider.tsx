import React from 'react';
interface SliderProps extends
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
}
export function Slider({
  value,
  onChange,
  label,
  unit,
  className,
  min = 0,
  max = 100,
  ...props
}: SliderProps) {
  const percentage = (value - Number(min)) / (Number(max) - Number(min)) * 100;
  return (
    <div className={`w-full ${className || ''}`}>
      {label &&
      <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-slate-300">{label}</label>
          <span className="text-xs font-mono text-cyan-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">
            {value}
            {unit}
          </span>
        </div>
      }
      <div className="relative h-2 rounded-full bg-slate-800 border border-slate-700">
        <div
          className="absolute h-full bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"
          style={{
            width: `${percentage}%`
          }} />
        
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer"
          {...props} />
        
        <div
          className="absolute w-4 h-4 bg-white rounded-full shadow-md top-1/2 -translate-y-1/2 pointer-events-none border-2 border-cyan-500"
          style={{
            left: `calc(${percentage}% - 8px)`
          }} />
        
      </div>
    </div>);

}