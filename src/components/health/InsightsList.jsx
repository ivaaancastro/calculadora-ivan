import React from 'react';
import {
    ShieldAlert, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { Card, SectionHeader } from '../ui';

export const InsightsList = ({ wellnessMetrics }) => (
    <>
        {Array.isArray(wellnessMetrics?.insights) && wellnessMetrics.insights.length > 0 && (
            <div>
                <SectionHeader as="p">Aspectos Destacados</SectionHeader>
                <div className="space-y-2.5">
                    {wellnessMetrics.insights.map((insight, idx) => {
                        const isDanger = insight.type === 'danger';
                        const isWarning = insight.type === 'warning';
                        return (
                            <Card key={idx} data-health="insight" className="motion-safe:animate-rise-slow motion-safe:[animation-delay:0.4s] p-3.5 sm:p-4 flex items-start gap-3.5">
                                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                                    isDanger ? 'bg-rose-50 text-hr-ink dark:bg-rose-950/50' :
                                    isWarning ? 'bg-amber-50 text-warning-ink dark:bg-amber-950/50' :
                                    'bg-emerald-50 text-positive-ink dark:bg-emerald-950/50'
                                }`}>
                                    {isDanger ? <ShieldAlert size={16} /> : isWarning ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-ink uppercase tracking-tight">
                                        {insight.label}
                                    </h4>
                                    <p className="text-xs text-body-soft leading-relaxed mt-0.5">
                                        {insight.desc}
                                    </p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        )}
    </>
);
