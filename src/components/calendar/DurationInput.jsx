import React from 'react';

// Compact HH:MM:SS input — stores value as decimal minutes, supports seconds for sprints
export const DurationInput = ({ value, onChange, className = '' }) => {
    const totalSecs = Math.round((Number(value) || 0) * 60);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const commit = (newH, newM, newS) => {
        const clampH = Math.max(0, Math.min(23, Number(newH) || 0));
        const clampM = Math.max(0, Math.min(59, Number(newM) || 0));
        const clampS = Math.max(0, Math.min(59, Number(newS) || 0));
        onChange((clampH * 3600 + clampM * 60 + clampS) / 60);
    };
    const inCls = 'w-8 shrink-0 bg-transparent text-[13px] font-mono font-medium py-1 text-center outline-none text-body no-spinner';
    const sep = <span className="text-faint text-[12px] font-semibold select-none">:</span>;
    return (
        <div className={`inline-flex shrink-0 items-center rounded-lg bg-sunken px-1.5 py-0.5 gap-0.5 ${className}`} title="HH:MM:SS">
            <input type="number" value={h} min={0} max={23}
                onChange={e => commit(e.target.value, m, s)}
                className={inCls} placeholder="0" />
            {sep}
            <input type="number" value={m} min={0} max={59}
                onChange={e => commit(h, e.target.value, s)}
                className={inCls} placeholder="00" />
            {sep}
            <input type="number" value={s} min={0} max={59}
                onChange={e => commit(h, m, e.target.value)}
                className={inCls} placeholder="00" />
        </div>
    );
};
