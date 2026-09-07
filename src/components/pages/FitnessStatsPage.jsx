import React from 'react';
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

    return (
        <div className="animate-in fade-in duration-500 pb-16 w-full max-w-[1100px] mx-auto px-4 sm:px-8">
            {/* Header */}
            <div className="pt-8 pb-10">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Rendimiento</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-500 mt-1.5 opacity-80">Perfil fisiológico avanzado y recuperación</p>
            </div>

            {/* 1. Umbrales Actuales */}
            <ThresholdsCard settings={settings} />

            {/* 2. Estado de Entreno */}
            <TrainingStatusCard trainingStatus={stats.trainingStatus} />

            {/* 3. Estado de VFC (HRV) */}
            <HrvCard hrv={stats.hrv} />

            {/* 4. Pronóstico de Carrera */}
            <RacePredictionsCard racePredictions={stats.racePredictions} />

            {/* 5. VO2 Máximo */}
            <Vo2MaxCard
                vo2Sport={vo2Sport}
                setVo2Sport={setVo2Sport}
                currentVo2={currentVo2}
                vo2Level={vo2Level}
                vo2Stats={stats.vo2}
            />

            {/* 6. Balance de Entrenamiento */}
            <TrainingBalanceCard
                balance={stats.balance}
                balanceDays={balanceDays}
                setBalanceDays={setBalanceDays}
            />

            {/* 7. Distribución y Volumen */}
            <WeeklyVolumeAndFocusCard
                weeklyChart={analytics.weeklyChart}
                focusChart={analytics.focusChart}
                zonesChart={analytics.zonesChart}
                intensityTimeframe={intensityTimeframe}
                setIntensityTimeframe={setIntensityTimeframe}
            />

            {/* 8. Perfil de Potencia */}
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

            {/* 9. FTP Estimado (eFTP) */}
            <EstimatedFtpCard
                ftp={stats.ftp}
                ftpDiff={ftpDiff}
                configFTP={configFTP}
                curveChartData={curveChartData}
            />

            {/* 10. Potencial y Récords */}
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
    );
};
