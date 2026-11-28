import React, { useId } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Footprints, Trophy, Zap } from 'lucide-react';
import { useFitnessAnalytics } from '../../hooks/useFitnessAnalytics';
import { ThresholdsCard } from '../fitness/ThresholdsCard';
import { RacePredictionsCard } from '../fitness/RacePredictionsCard';
import { Vo2MaxCard } from '../fitness/Vo2MaxCard';
import { TrainingBalanceCard } from '../fitness/TrainingBalanceCard';
import { WeeklyVolumeAndFocusCard } from '../fitness/WeeklyVolumeAndFocusCard';
import { PowerProfileCard } from '../fitness/PowerProfileCard';
import { EstimatedFtpCard } from '../fitness/EstimatedFtpCard';
import { MmpAndEfCard } from '../fitness/MmpAndEfCard';
import { StatsHero } from '../fitness/StatsHero';
import { Button, Card, EmptyState, Segmented, segmentedPanelId, segmentedTabId } from '../ui';

/** Pestañas de Rendimiento (Capa 6, PR 18; D9, RF-D7). El resumen queda fijo encima. */
const TABS = [
    { value: 'carga', label: 'Carga' },
    { value: 'potencia', label: 'Potencia' },
    { value: 'carrera', label: 'Carrera' },
    { value: 'volumen', label: 'Volumen' },
];


/** Tarjeta vacía con una acción (RF-D6): nunca ceros ni «--» cuando falta el dato. */
const EmptyCard = ({ id, icon, title, description, action }) => (
    <Card as="section" data-stats="card" data-card={id} data-empty="true" className="p-card md:p-card-lg">
        <EmptyState icon={icon} title={title} description={description} action={action} />
    </Card>
);

export const FitnessStatsPage = ({
    activities,
    settings,
    currentMetrics,
    onSelectActivity,
    loadHistoricalStreams,
    isLoadingHistoricalStreams,
    hasLoadedHistoricalStreams,
    handleDeepSync,
    isDeepSyncing,
    deepSyncProgress
}) => {
    const navigate = useNavigate();
    const TAB_IDS = `stats${useId().replace(/:/g, '')}`;
    const [params, setParams] = useSearchParams();
    const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'carga';
    const setTab = (value) => {
        const next = new URLSearchParams(params);
        if (value === 'carga') next.delete('tab');
        else next.set('tab', value);
        setParams(next, { replace: true });
    };

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

    const goProfile = <Button variant="secondary" onClick={() => navigate('/profile')}>Configurar umbrales</Button>;
    const canDeepSync = handleDeepSync && telemetryStats && telemetryStats.withStreams < telemetryStats.total;
    const powerAction = canDeepSync
        ? <Button variant="secondary" onClick={handleDeepSync} disabled={isDeepSyncing}>{isDeepSyncing ? 'Descargando telemetría…' : 'Completar telemetría'}</Button>
        : goProfile;

    const hasProfile = ppChartData.some((p) => Number(p['Usuario']) > 0);
    const hasEftp = Number(stats.ftp?.eFTP) > 0;
    const hasVo2 = currentVo2 > 0;

    const panels = {
        carga: (
            <>
                <TrainingBalanceCard balance={stats.balance} balanceDays={balanceDays} setBalanceDays={setBalanceDays} />
                <ThresholdsCard settings={settings} action={goProfile} />
            </>
        ),
        potencia: (
            <>
                {hasProfile && (
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
                )}
                {hasEftp && <EstimatedFtpCard ftp={stats.ftp} ftpDiff={ftpDiff} configFTP={configFTP} curveChartData={curveChartData} />}
                {!hasProfile && !hasEftp && (
                    <EmptyCard
                        id="power-profile"
                        icon={Zap}
                        title="Sin perfil de potencia ni FTP estimado"
                        description="Hacen falta salidas en bici con potenciómetro y telemetría completa para calcularlos."
                        action={powerAction}
                    />
                )}
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
                    handleDeepSync={hasProfile || hasEftp || !canDeepSync ? handleDeepSync : undefined}
                    isDeepSyncing={isDeepSyncing}
                    deepSyncProgress={deepSyncProgress}
                />
            </>
        ),
        carrera: (
            <>
                <Vo2MaxCard vo2Sport={vo2Sport} setVo2Sport={setVo2Sport} currentVo2={currentVo2} vo2Level={vo2Level} hasVo2={hasVo2} />
                {stats.racePredictions ? (
                    <RacePredictionsCard racePredictions={stats.racePredictions} />
                ) : (
                    <EmptyCard
                        id="race"
                        icon={Trophy}
                        title="Sin pronóstico de carrera"
                        description="Hace falta un VO₂max de carrera: corre al menos una vez con pulsómetro y tu ritmo umbral configurado."
                        action={goProfile}
                    />
                )}
            </>
        ),
        volumen: analytics.weeklyChart?.length ? (
            <WeeklyVolumeAndFocusCard
                weeklyChart={analytics.weeklyChart}
                zonesChart={analytics.zonesChart}
                intensityTimeframe={intensityTimeframe}
                setIntensityTimeframe={setIntensityTimeframe}
            />
        ) : (
            <EmptyCard id="volume" icon={Footprints} title="Sin volumen semanal" description="Registra entrenamientos para ver tu volumen y la distribución por zonas." action={<Button variant="secondary" onClick={() => navigate('/history')}>Ver actividades</Button>} />
        ),
    };

    return (
        <div data-stats="page" className="animate-in fade-in duration-500 w-full max-w-content mx-auto px-4 sm:px-8 pt-4 md:pt-8 pb-8 md:pb-16 flex flex-col gap-section md:gap-section-lg max-sm:[&_button[aria-pressed]]:min-h-[44px]">
            <header data-stats="header">
                <h2 className="text-[26px] md:text-3xl font-bold text-ink tracking-tight">Rendimiento</h2>
                <p className="text-sm font-medium text-ink-3 mt-1.5">Perfil fisiológico y recuperación</p>
            </header>

            <StatsHero metrics={currentMetrics} hrv={stats.hrv} />

            <div className="flex flex-col gap-4 md:gap-6">
                <Segmented
                    variant="rail"
                    tabs
                    idPrefix={TAB_IDS}
                    aria-label="Secciones de Rendimiento"
                    data-stats="tabs"
                    className="w-full md:w-fit overflow-x-auto"
                    value={tab}
                    onChange={setTab}
                    options={TABS}
                />
                <div
                    role="tabpanel"
                    id={segmentedPanelId(TAB_IDS, tab)}
                    aria-labelledby={segmentedTabId(TAB_IDS, tab)}
                    data-stats="panel"
                    data-tab={tab}
                    className="flex flex-col gap-4 md:gap-6"
                >
                    {panels[tab]}
                </div>
            </div>
        </div>
    );
};
