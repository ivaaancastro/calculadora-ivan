import React, { useState } from 'react';
import { useFitnessAnalytics } from '../../hooks/useFitnessAnalytics';
import { ThresholdsCard } from '../fitness/ThresholdsCard';
import { TrainingStatusCard } from '../fitness/TrainingStatusCard';
import { HrvCard } from '../fitness/HrvCard';
import { RacePredictionsCard } from '../fitness/RacePredictionsCard';
import { Vo2MaxCard } from '../fitness/Vo2MaxCard';
import { TrainingBalanceCard } from '../fitness/TrainingBalanceCard';
import { WeeklyVolumeAndFocusCard } from '../fitness/WeeklyVolumeAndFocusCard';
import { PowerProfileCard } from '../fitness/PowerProfileCard';
import { EstimatedFtpCard } from '../fitness/EstimatedFtpCard';
import { MmpAndEfCard } from '../fitness/MmpAndEfCard';

const CATEGORIES = [
    { id: 'physiology', label: 'Fisiología' },
    { id: 'power', label: 'Potencia' },
    { id: 'vo2', label: 'VO2 y Marcas' },
    { id: 'volume', label: 'Volumen' },
    { id: 'all', label: 'Todos' },
];

export const FitnessStatsPage = ({
    activities,
    settings,
    onSelectActivity,
    loadHistoricalStreams,
    isLoadingHistoricalStreams,
    hasLoadedHistoricalStreams,
    handleDeepSync,
    isDeepSyncing,
    deepSyncProgress
}) => {
    const [mobileCategory, setMobileCategory] = useState('physiology');

    const {
        vo2Sport, setVo2Sport,
        powerUnit, setPowerUnit,
        selectedDurs, toggleDur,
        showPowerConfig, setShowPowerConfig,
        balanceDays, setBalanceDays,
        curveType, setCurveType,
        curveSport, setCurveSport,
        mmpTimeframe, setMmpTimeframe,
        intensityTimeframe, setIntensityTimeframe,
        powerProfileTimeframe, setPowerProfileTimeframe,
        peaksViewMode, setPeaksViewMode,

        telemetryStats,

        stats,
        currentVo2,
        vo2Level,
        analytics,
        currentCurve,
        isPace,
        curveColor,
        curveUnit,
        curveChartData,
        ppChartData,
        configFTP,
        ftpDiff
    } = useFitnessAnalytics(activities, settings, {
        loadHistoricalStreams,
        isLoadingHistoricalStreams,
        hasLoadedHistoricalStreams
    });

    if (!activities || activities.length === 0) return null;

    const cardVisibility = (category) => {
        return (mobileCategory === 'all' || mobileCategory === category)
            ? 'block'
            : 'hidden md:block';
    };

    return (
        <div className="animate-in fade-in duration-500 pb-16 w-full max-w-[1100px] mx-auto px-4 sm:px-8">
            {/* Header */}
            <div className="pt-8 pb-6 sm:pb-10">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Rendimiento</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-500 mt-1.5 opacity-80">Perfil fisiológico avanzado y recuperación</p>
            </div>

            {/* Selector por categorías SOLO en móvil (estilo Apple sobrio, sin emojis) */}
            <div className="md:hidden flex items-center gap-2 overflow-x-auto hide-scrollbar touch-scroll -mx-4 px-4 mb-6 pb-1">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setMobileCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none touch-manipulation active:scale-95 shrink-0 ${
                            mobileCategory === cat.id
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs font-bold'
                                : 'bg-slate-200/70 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* 1. Umbrales Actuales */}
            <div className={cardVisibility('physiology')}>
                <ThresholdsCard settings={settings} />
            </div>

            {/* 2. Estado de Entreno */}
            <div className={cardVisibility('physiology')}>
                <TrainingStatusCard trainingStatus={stats.trainingStatus} />
            </div>

            {/* 3. Estado de VFC (HRV) */}
            <div className={cardVisibility('physiology')}>
                <HrvCard hrv={stats.hrv} />
            </div>

            {/* 4. Pronóstico de Carrera */}
            <div className={cardVisibility('vo2')}>
                <RacePredictionsCard racePredictions={stats.racePredictions} />
            </div>

            {/* 5. VO2 Máximo */}
            <div className={cardVisibility('vo2')}>
                <Vo2MaxCard
                    vo2Sport={vo2Sport}
                    setVo2Sport={setVo2Sport}
                    currentVo2={currentVo2}
                    vo2Level={vo2Level}
                    vo2Stats={stats.vo2}
                />
            </div>

            {/* 6. Balance de Entrenamiento */}
            <div className={cardVisibility('physiology')}>
                <TrainingBalanceCard
                    balance={stats.balance}
                    balanceDays={balanceDays}
                    setBalanceDays={setBalanceDays}
                />
            </div>

            {/* 7. Distribución y Volumen */}
            <div className={cardVisibility('volume')}>
                <WeeklyVolumeAndFocusCard
                    weeklyChart={analytics.weeklyChart}
                    focusChart={analytics.focusChart}
                    zonesChart={analytics.zonesChart}
                    intensityTimeframe={intensityTimeframe}
                    setIntensityTimeframe={setIntensityTimeframe}
                />
            </div>

            {/* 8. Perfil de Potencia */}
            <div className={cardVisibility('power')}>
                <PowerProfileCard
                    showPowerConfig={showPowerConfig}
                    setShowPowerConfig={setShowPowerConfig}
                    powerUnit={powerUnit}
                    setPowerUnit={setPowerUnit}
                    powerProfileTimeframe={powerProfileTimeframe}
                    setPowerProfileTimeframe={setPowerProfileTimeframe}
                    selectedDurs={selectedDurs}
                    toggleDur={toggleDur}
                    ppChartData={ppChartData}
                    profile={stats.profile}
                    powerProfile={stats.powerProfile}
                />
            </div>

            {/* 9. FTP Estimado (eFTP) */}
            <div className={cardVisibility('power')}>
                <EstimatedFtpCard
                    ftp={stats.ftp}
                    ftpDiff={ftpDiff}
                    configFTP={configFTP}
                    curveChartData={curveChartData}
                />
            </div>

            {/* 10. Potencial y Récords */}
            <div className={cardVisibility('power')}>
                <MmpAndEfCard
                    activities={activities}
                    onSelectActivity={onSelectActivity}
                    curveSport={curveSport}
                    setCurveSport={setCurveSport}
                    mmpTimeframe={mmpTimeframe}
                    setMmpTimeframe={setMmpTimeframe}
                    curveType={curveType}
                    setCurveType={setCurveType}
                    currentCurve={currentCurve}
                    curveColor={curveColor}
                    curveUnit={curveUnit}
                    isPace={isPace}
                    analytics={analytics}
                    peaksViewMode={peaksViewMode}
                    setPeaksViewMode={setPeaksViewMode}
                    telemetryStats={telemetryStats}
                    isLoadingHistoricalStreams={isLoadingHistoricalStreams}
                    handleDeepSync={handleDeepSync}
                    isDeepSyncing={isDeepSyncing}
                    deepSyncProgress={deepSyncProgress}
                />
            </div>
        </div>
    );
};
