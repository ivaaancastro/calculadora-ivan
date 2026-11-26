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
import { Activity, HeartPulse, Trophy } from 'lucide-react';
import { EmptyState } from '../ui';
import { StatsHero } from '../fitness/StatsHero';

/**
 * Receta de tarjeta única de Rendimiento (Fase D3, PR 2), aplicada desde el envoltorio porque cada
 * tarjeta es un componente propio: filete y sombra del token, radios concéntricos (tarjeta 20 →
 * ficha 12), título 13/600 sin mayúsculas, rótulos de 11 px y cifras tabulares. En móvil, menos
 * aire y el orden de «¿cómo estoy?» primero (estado, VFC, umbrales, balance).
 */
const STATS_CARD = [
    '[&_section>div:first-child]:border-line [&_section>div:first-child]:shadow-card [&_section>div:first-child]:rounded-[20px]',
    "[&_section_[class*='rounded-xl']]:rounded-[12px] [&_section_[class*='rounded-2xl']]:rounded-[12px]",
    '[&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:tracking-[-0.005em] [&_h3]:normal-case [&_h3]:text-ink [&_.text-2xs]:text-[11px]',
    "[&_[class*='tracking-tighter']]:tracking-[0]",
    "[&_:is(p,span)[class*='text-xl']]:[font-feature-settings:'tnum'_1,'cv11'_1] [&_:is(p,h4)[class*='text-2xl']]:[font-feature-settings:'tnum'_1,'cv11'_1]",
    'max-md:order-[10] max-md:[&_section]:mb-3 max-md:[&_section>div:first-child]:p-4 max-md:[&_section>div:first-child>div:first-child]:mb-3',
    'data-[empty=true]:[&_section]:border data-[empty=true]:[&_section]:border-dashed data-[empty=true]:[&_section]:border-line data-[empty=true]:[&_section]:rounded-[20px]',
].join(' ');
const CARD_ORDER = { status: 'max-md:!order-2', hrv: 'max-md:!order-3', thresholds: 'max-md:!order-4', balance: 'max-md:!order-5' };

const CATEGORIES = [
    { id: 'physiology', label: 'Fisiología' },
    { id: 'power', label: 'Potencia' },
    { id: 'vo2', label: 'VO₂max y marcas' },
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

    const cardVisibility = (category, id) => {
        const shown = (mobileCategory === 'all' || mobileCategory === category)
            ? 'block'
            : 'hidden md:block';
        return `${STATS_CARD} ${CARD_ORDER[id] ?? ''} ${shown}`;
    };

    const cardNodes = {
        'thresholds': (
    <div data-stats="card" data-card="thresholds" className={cardVisibility('physiology', 'thresholds')}>
        <ThresholdsCard settings={settings} />
    </div>
        ),
        'status': (
    <div data-stats="card" data-card="status" className={cardVisibility('physiology', 'status')}>
        <TrainingStatusCard trainingStatus={stats.trainingStatus} />
    </div>
        ),
        'hrv': (
    <div data-stats="card" data-card="hrv" className={cardVisibility('physiology', 'hrv')}>
        <HrvCard hrv={stats.hrv} />
    </div>
        ),
        'race': (
    <div data-stats="card" data-card="race" className={cardVisibility('vo2', 'race')}>
        <RacePredictionsCard racePredictions={stats.racePredictions} />
    </div>
        ),
        'vo2': (
    <div data-stats="card" data-card="vo2" className={cardVisibility('vo2', 'vo2')}>
        <Vo2MaxCard
            vo2Sport={vo2Sport}
            setVo2Sport={setVo2Sport}
            currentVo2={currentVo2}
            vo2Level={vo2Level}
            vo2Stats={stats.vo2}
        />
    </div>
        ),
        'balance': (
    <div data-stats="card" data-card="balance" className={cardVisibility('physiology', 'balance')}>
        <TrainingBalanceCard
            balance={stats.balance}
            balanceDays={balanceDays}
            setBalanceDays={setBalanceDays}
        />
    </div>
        ),
        'volume': (
    <div data-stats="card" data-card="volume" className={cardVisibility('volume', 'volume')}>
        <WeeklyVolumeAndFocusCard
            weeklyChart={analytics.weeklyChart}
            focusChart={analytics.focusChart}
            zonesChart={analytics.zonesChart}
            intensityTimeframe={intensityTimeframe}
            setIntensityTimeframe={setIntensityTimeframe}
        />
    </div>
        ),
        'power-profile': (
    <div data-stats="card" data-card="power-profile" className={cardVisibility('power', 'power-profile')}>
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
        ),
        'ftp': (
    <div data-stats="card" data-card="ftp" className={cardVisibility('power', 'ftp')}>
        <EstimatedFtpCard
            ftp={stats.ftp}
            ftpDiff={ftpDiff}
            configFTP={configFTP}
            curveChartData={curveChartData}
        />
    </div>
        ),
        'mmp': (
    <div data-stats="card" data-card="mmp" className={cardVisibility('power', 'mmp')}>
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
        ),
    };

    const CARD_CATEGORY = { thresholds: 'physiology', status: 'physiology', hrv: 'physiology', balance: 'physiology', race: 'vo2', vo2: 'vo2', volume: 'volume', 'power-profile': 'power', ftp: 'power', mmp: 'power' };

    // Una tarjeta sin datos explica qué falta en lugar de desaparecer (EST-4).
    const emptyCard = (id, Icon, title, description) => (
        <div data-stats="card" data-card={id} data-empty="true" className={cardVisibility(CARD_CATEGORY[id], id)}>
            <section className="mb-8">
                <EmptyState icon={Icon} title={title} description={description} />
            </section>
        </div>
    );
    if (!stats.trainingStatus) cardNodes.status = emptyCard('status', Activity, 'Sin estado de entreno', 'Registra actividades con carga (TSS) de las últimas semanas para calcularlo.');
    if (!stats.hrv) cardNodes.hrv = emptyCard('hrv', HeartPulse, 'Sin datos de VFC', 'Conecta un dispositivo que registre la variabilidad cardiaca para ver tu recuperación.');
    if (!stats.racePredictions) cardNodes.race = emptyCard('race', Trophy, 'Sin pronóstico de carrera', 'Hace falta un VO2 máx. estimado: corre al menos una vez con pulsómetro.');

    const GROUPS = [
        { id: 'today', label: 'Hoy', cards: ['status', 'hrv', 'balance', 'thresholds'] },
        { id: 'power', label: 'Potencia', cards: ['power-profile', 'ftp', 'mmp'] },
        { id: 'marks', label: 'Marcas', cards: ['race', 'vo2'] },
        { id: 'volume', label: 'Volumen', cards: ['volume'] },
    ];
    const isShown = (id) => mobileCategory === 'all' || mobileCategory === CARD_CATEGORY[id];

    return (
        <div data-stats="page" className="animate-in fade-in duration-500 pb-16 w-full max-w-[1200px] mx-auto px-4 sm:px-8 max-md:flex max-md:flex-col max-md:!pb-8 max-sm:[&_button[aria-pressed]]:min-h-[44px]">
            {/* Header */}
            <div data-stats="header" className="pt-8 pb-6 sm:pb-10 max-md:order-none max-md:!pt-4 max-md:!pb-3">
                <h2 className="text-3xl max-md:text-[26px] font-bold text-ink tracking-tight">Rendimiento</h2>
                <p className="text-sm font-medium text-ink-3-flat mt-1.5 opacity-80">Perfil fisiológico avanzado y recuperación</p>
            </div>

            {/* Selector por categorías SOLO en móvil (estilo Apple sobrio, sin emojis) */}
            <div data-stats="tabs" className="md:hidden flex items-center gap-2 overflow-x-auto hide-scrollbar touch-scroll -mx-4 px-4 mb-6 pb-1 max-md:order-1 max-md:!mb-3 max-md:[&_button]:min-h-[44px]">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setMobileCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-paint select-none touch-manipulation active:scale-press shrink-0 ${
                            mobileCategory === cat.id
                                ? 'bg-inverse text-ink-inverse shadow-xs font-bold'
                                : 'bg-fill-4 text-body-soft hover:text-ink'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {(mobileCategory === 'all' || mobileCategory === 'physiology') && (
                <StatsHero trainingStatus={stats.trainingStatus} hrv={stats.hrv} ftpDiff={ftpDiff} eFTP={stats.ftp?.eFTP} />
            )}
            {GROUPS.map(g => (
                <div key={g.id} data-stats="group" data-group={g.id} className={`mb-4 max-md:order-3 ${g.cards.some(isShown) ? 'block' : 'hidden md:block'}`}>
                    <h3 data-stats="group-title" className="flex items-center gap-3 m-0 mb-4 text-[11px] font-semibold tracking-[0.08em] uppercase text-ink-4 after:content-[''] after:flex-1 after:h-px after:bg-line">{g.label}</h3>
                    {g.cards.map(id => <React.Fragment key={id}>{cardNodes[id]}</React.Fragment>)}
                </div>
            ))}
        </div>
    );
};
