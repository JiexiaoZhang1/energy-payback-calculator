import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  BatteryCharging,
  Car,
  ChevronDown,
  CircleHelp,
  FlameKindling,
  Languages,
  Pencil,
  Plus,
  Share2,
  TimerReset,
  WashingMachine,
  Zap,
} from "lucide-react";
import { assetMetas } from "./lib/assets";
import { calculateOnServer, copyText, loadScenario, saveScenario } from "./lib/api";
import {
  drawerTransition,
  itemMotion,
  listMotion,
  pageMotion,
  quick,
  softSpring,
  spring,
} from "./lib/animation";
import { calculateSavings } from "./lib/calculations";
import { currencies, languages } from "./lib/defaults";
import { assetKeys, getCopy } from "./lib/i18n";
import { downloadShareImage } from "./lib/shareImage";
import { loadState, saveState } from "./lib/storage";
import {
  coverTariffRange,
  deleteTariffBlock,
  getSuggestedTariffRange,
  isTariffFullySplit,
  normalizeTariffBlocksForEditing,
  updateTariffBlockRange,
} from "./lib/tariffEditor";
import type {
  AssetKey,
  CalculatorState,
  CalculationResult,
  CurrencyCode,
  Language,
  TariffBlock,
} from "./lib/types";
import { formatHour, formatMoney, formatNumber } from "./lib/format";

type Screen = "input" | "result";

const assetIcons: Record<AssetKey, typeof BatteryCharging> = {
  battery: BatteryCharging,
  heat: FlameKindling,
  ev: Car,
  appliance: WashingMachine,
};

export function App() {
  const [state, setState] = useState<CalculatorState>(() => loadState());
  const [screen, setScreen] = useState<Screen>("input");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [apiStatus, setApiStatus] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [serverResult, setServerResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const copy = getCopy(state.language);
  const localResult = useMemo(() => calculateSavings(state), [state]);
  const result = serverResult ?? localResult;

  useEffect(() => {
    saveState(state);
    document.documentElement.lang = state.language;
  }, [state]);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [screen]);

  useEffect(() => {
    const scenarioId = new URLSearchParams(window.location.search).get("scenario");
    if (!scenarioId) return;
    let isActive = true;
    loadScenario(scenarioId)
      .then((scenario) => {
        if (!isActive) return;
        setState({
          ...scenario.state,
          tariffBlocks: normalizeTariffBlocksForEditing(scenario.state.tariffBlocks),
        });
        setServerResult(scenario.result);
        setShareLink(window.location.href);
        setApiStatus(getCopy(scenario.state.language).scenarioLoaded);
        setScreen("result");
      })
      .catch(() => {
        setApiStatus(copy.scenarioLoadFailed);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const patchState = (patch: Partial<CalculatorState>) => {
    setState((current) => ({ ...current, ...patch }));
  };

  const updateTariffBlocks = (tariffBlocks: TariffBlock[]) => {
    patchState({ tariffBlocks: normalizeTariffBlocksForEditing(tariffBlocks) });
  };

  const updateAsset = (key: AssetKey, patch: Partial<CalculatorState["assets"][AssetKey]>) => {
    setState((current) => ({
      ...current,
      assets: {
        ...current.assets,
        [key]: {
          ...current.assets[key],
          ...patch,
        },
      },
    }));
  };

  const updateAdvanced = (patch: Partial<CalculatorState["advanced"]>) => {
    setState((current) => ({
      ...current,
      advanced: { ...current.advanced, ...patch },
    }));
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    setShareLink("");
    try {
      const remoteResult = await calculateOnServer(state);
      setServerResult(remoteResult);
      setApiStatus(copy.backendOnline);
    } catch {
      setServerResult(localResult);
      setApiStatus(copy.backendOffline);
    } finally {
      setIsCalculating(false);
      setScreen("result");
    }
  };

  const handleShare = async () => {
    try {
      setShareStatus(copy.savingScenario);
      const scenario = await saveScenario(state, result);
      const url = new URL(window.location.href);
      url.searchParams.set("scenario", scenario.id);
      const nextLink = url.toString();
      setShareLink(nextLink);
      await copyText(nextLink).catch(() => undefined);
      await downloadShareImage(state, result);
      setShareStatus(copy.linkCopied);
    } catch {
      try {
        await downloadShareImage(state, result);
        setShareStatus(copy.backendOffline);
      } catch {
        setShareStatus(copy.downloadFailed);
      }
    }
    window.setTimeout(() => setShareStatus(""), 2400);
  };

  return (
    <main className="app-shell">
      <div className="phone-stage" data-screen={screen}>
        <TopControls state={state} patchState={patchState} />
        <AnimatePresence mode="wait" initial={false}>
          {screen === "input" ? (
            <InputScreen
              key="input"
              state={state}
              advancedOpen={advancedOpen}
              setAdvancedOpen={setAdvancedOpen}
              updateTariffBlocks={updateTariffBlocks}
              updateAsset={updateAsset}
              updateAdvanced={updateAdvanced}
              setTotalCost={(totalCost) => patchState({ totalCost })}
              onCalculate={handleCalculate}
              isCalculating={isCalculating}
            />
          ) : (
            <ResultScreen
              key="result"
              state={state}
              result={result}
              apiStatus={apiStatus}
              shareLink={shareLink}
              shareStatus={shareStatus}
              onShare={handleShare}
              setScreen={setScreen}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function TopControls({
  state,
  patchState,
}: {
  state: CalculatorState;
  patchState: (patch: Partial<CalculatorState>) => void;
}) {
  const copy = getCopy(state.language);
  return (
    <div className="top-controls" aria-label={`${copy.language} / ${copy.currency}`}>
      <label className="select-shell">
        <Languages size={16} aria-hidden="true" />
        <select
          value={state.language}
          aria-label={copy.language}
          onChange={(event) => patchState({ language: event.target.value as Language })}
        >
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.nativeName}
            </option>
          ))}
        </select>
      </label>
      <label className="select-shell">
        <span aria-hidden="true" className="currency-dot">
          ¤
        </span>
        <select
          value={state.currency}
          aria-label={copy.currency}
          onChange={(event) => patchState({ currency: event.target.value as CurrencyCode })}
        >
          {currencies.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function InputScreen({
  state,
  advancedOpen,
  setAdvancedOpen,
  updateTariffBlocks,
  updateAsset,
  updateAdvanced,
  setTotalCost,
  onCalculate,
  isCalculating,
}: {
  state: CalculatorState;
  advancedOpen: boolean;
  setAdvancedOpen: (open: boolean) => void;
  updateTariffBlocks: (blocks: TariffBlock[]) => void;
  updateAsset: (key: AssetKey, patch: Partial<CalculatorState["assets"][AssetKey]>) => void;
  updateAdvanced: (patch: Partial<CalculatorState["advanced"]>) => void;
  setTotalCost: (totalCost: number) => void;
  onCalculate: () => void;
  isCalculating: boolean;
}) {
  const copy = getCopy(state.language);
  return (
    <motion.section
      className="screen screen-input"
      aria-labelledby="input-title"
      variants={pageMotion}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={softSpring}
    >
      <header className="hero-copy">
        <div className="timer-mark" aria-hidden="true">
          <TimerReset size={22} />
        </div>
        <div>
          <h1 id="input-title">{copy.appTitle}</h1>
          <p>{copy.appSubtitle}</p>
        </div>
      </header>
      <TariffEditor
        state={state}
        blocks={state.tariffBlocks}
        onChange={updateTariffBlocks}
      />
      <AssetSelector state={state} updateAsset={updateAsset} />
      <CostPanel state={state} patchTotalCost={setTotalCost} />
      <motion.button
        className="primary-action"
        type="button"
        onClick={onCalculate}
        disabled={isCalculating}
        whileTap={{ scale: 0.97 }}
        whileHover={{ y: -1 }}
      >
        {isCalculating ? copy.calculating : copy.calculate}
      </motion.button>
      <AdvancedPanel
        state={state}
        open={advancedOpen}
        setOpen={setAdvancedOpen}
        updateAsset={updateAsset}
        updateAdvanced={updateAdvanced}
      />
    </motion.section>
  );
}

function TariffEditor({
  state,
  blocks,
  onChange,
}: {
  state: CalculatorState;
  blocks: TariffBlock[];
  onChange: (blocks: TariffBlock[]) => void;
}) {
  const [drawerDraft, setDrawerDraft] = useState<TariffDrawerDraft | null>(null);
  const [activeBlockId, setActiveBlockId] = useState("");
  const [flashRange, setFlashRange] = useState<FlashRange | null>(null);
  const [notice, setNotice] = useState("");
  const reducedMotion = useReducedMotion();
  const copy = getCopy(state.language);
  const normalizedBlocks = useMemo(() => normalizeTariffBlocksForEditing(blocks), [blocks]);
  const isFull = isTariffFullySplit(normalizedBlocks);

  const openEdit = (block: TariffBlock) => {
    setActiveBlockId(block.id);
    setDrawerDraft({
      mode: "edit",
      blockId: block.id,
      startHour: block.startHour,
      endHour: block.endHour,
      priceText: String(block.pricePerKwh),
    });
  };

  const openAdd = () => {
    if (isFull) {
      setNotice(copy.tariffFull);
      window.setTimeout(() => setNotice(""), 2200);
      return;
    }
    const suggestion = getSuggestedTariffRange(normalizedBlocks, activeBlockId);
    setActiveBlockId("");
    setDrawerDraft({
      mode: "add",
      startHour: suggestion.startHour,
      endHour: suggestion.endHour,
      priceText: String(suggestion.pricePerKwh),
    });
  };

  const saveDraft = () => {
    if (!drawerDraft) return;
    const pricePerKwh = Number(drawerDraft.priceText);
    if (!Number.isFinite(pricePerKwh)) return;
    const nextBlocks =
      drawerDraft.mode === "edit"
        ? updateTariffBlockRange(
            normalizedBlocks,
            drawerDraft.blockId ?? "",
            drawerDraft.startHour,
            drawerDraft.endHour,
            pricePerKwh,
          )
        : coverTariffRange(
            normalizedBlocks,
            drawerDraft.startHour,
            drawerDraft.endHour,
            pricePerKwh,
          );

    onChange(nextBlocks);
    setDrawerDraft(null);
    setActiveBlockId("");
    setFlashRange({
      key: Date.now(),
      startHour: drawerDraft.startHour,
      endHour: drawerDraft.endHour,
    });
    setNotice(copy.tariffUpdated);
    window.setTimeout(() => setFlashRange(null), 1200);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const removeActiveBlock = () => {
    if (!drawerDraft?.blockId) return;
    onChange(deleteTariffBlock(normalizedBlocks, drawerDraft.blockId));
    setDrawerDraft(null);
    setActiveBlockId("");
    setNotice(copy.tariffUpdated);
    window.setTimeout(() => setNotice(""), 2200);
  };

  return (
    <section className="panel tariff-panel" aria-labelledby="tariff-title">
      <SectionTitle
        index={1}
        title={copy.tariffTitle}
        subtitle={copy.tariffHint}
        helper={copy.price}
      />
      <motion.div className="tariff-segment-timeline" role="group" aria-label={copy.tariffTitle} layout>
        {normalizedBlocks.map((block) => {
          const duration = block.endHour - block.startHour;
          const isActive = activeBlockId === block.id;
          const isFlashing =
            flashRange !== null &&
            block.startHour < flashRange.endHour &&
            block.endHour > flashRange.startHour;
          return (
          <motion.button
            key={block.id}
            type="button"
            className={`tariff-segment ${priceClass(block.pricePerKwh)} ${
              isActive ? "is-active" : ""
            } ${isFlashing ? "is-flashing" : ""} ${duration < 3 ? "is-narrow" : ""}`}
            style={{ flexGrow: duration } as CSSProperties}
            aria-label={`${formatHour(block.startHour)}-${formatHour(block.endHour)} ${copy.price} ${formatNumber(block.pricePerKwh, state.language, 2)}`}
            onClick={() => openEdit(block)}
            layout
            layoutId={`tariff-${block.startHour}-${block.endHour}-${block.pricePerKwh}`}
            transition={reducedMotion ? quick : spring}
            whileTap={{ scale: 0.96 }}
          >
            <span>{`${formatHour(block.startHour)}-${formatHour(block.endHour)}`}</span>
            <strong>{formatNumber(block.pricePerKwh, state.language, 2)}</strong>
          </motion.button>
        );
        })}
      </motion.div>
      <div className="hour-labels" aria-hidden="true">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
      <div className="legend">
        <LegendDot color="#2f80ed" label={`${copy.negative} (< 0)`} />
        <LegendDot color="#f5b400" label={`${copy.cheap} (0 - 0.6)`} />
        <LegendDot color="#ef4444" label={`${copy.high} (> 0.6)`} />
      </div>
      <div className="tariff-actions">
        <motion.button
          type="button"
          className="add-block"
          onClick={openAdd}
          disabled={isFull}
          whileTap={{ scale: isFull ? 1 : 0.97 }}
          whileHover={{ y: isFull ? 0 : -1 }}
        >
          <Plus size={20} aria-hidden="true" />
          {copy.addBlock}
        </motion.button>
      </div>
      <AnimatePresence>
        {notice ? (
          <motion.div
            className="tariff-notice"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={quick}
          >
            {notice}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {drawerDraft ? (
          <TariffDrawer
            key={`${drawerDraft.mode}-${drawerDraft.blockId ?? "new"}`}
            copy={copy}
            state={state}
            draft={drawerDraft}
            canRemove={drawerDraft.mode === "edit" && normalizedBlocks.length > 1}
            onDraftChange={setDrawerDraft}
            onClose={() => {
              setDrawerDraft(null);
              setActiveBlockId("");
            }}
            onSave={saveDraft}
            onRemove={removeActiveBlock}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

type TariffDrawerDraft = {
  mode: "edit" | "add";
  blockId?: string;
  startHour: number;
  endHour: number;
  priceText: string;
};

type FlashRange = {
  key: number;
  startHour: number;
  endHour: number;
};

function TariffDrawer({
  copy,
  state,
  draft,
  canRemove,
  onDraftChange,
  onClose,
  onSave,
  onRemove,
}: {
  copy: ReturnType<typeof getCopy>;
  state: CalculatorState;
  draft: TariffDrawerDraft;
  canRemove: boolean;
  onDraftChange: (draft: TariffDrawerDraft) => void;
  onClose: () => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const parsedPrice = Number(draft.priceText);
  const priceInvalid = draft.priceText.trim() === "" || !Number.isFinite(parsedPrice);

  const updateStart = (nextHour: number) => {
    onDraftChange({
      ...draft,
      startHour: Math.max(0, Math.min(draft.endHour - 1, nextHour)),
    });
  };

  const updateEnd = (nextHour: number) => {
    onDraftChange({
      ...draft,
      endHour: Math.max(draft.startHour + 1, Math.min(24, nextHour)),
    });
  };

  return (
    <motion.div
      className="drawer-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={quick}
      role="presentation"
    >
      <button className="drawer-scrim" type="button" aria-label={copy.cancel} onClick={onClose} />
      <motion.form
        className="tariff-drawer"
        initial={{ y: "105%", opacity: 0.9 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "105%", opacity: 0.9 }}
        transition={reducedMotion ? quick : drawerTransition}
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <header className="drawer-header">
          <div>
            <span>{draft.mode === "edit" ? copy.editPeriod : copy.newPeriod}</span>
            <h3>{`${formatHour(draft.startHour)}-${formatHour(draft.endHour)}`}</h3>
          </div>
          <motion.button
            type="button"
            className="drawer-close"
            onClick={onClose}
            whileTap={{ scale: 0.92 }}
            aria-label={copy.cancel}
          >
            ×
          </motion.button>
        </header>
        <StepperRow
          label={copy.startTime}
          value={draft.startHour}
          min={0}
          max={draft.endHour - 1}
          onChange={updateStart}
        />
        <StepperRow
          label={copy.endTime}
          value={draft.endHour}
          min={draft.startHour + 1}
          max={24}
          onChange={updateEnd}
        />
        <label className="drawer-price-field">
          <span>{copy.pricePerKwh}</span>
          <div>
            <b>{state.currency}</b>
            <input
              type="number"
              aria-label={copy.pricePerKwh}
              inputMode="decimal"
              step="0.01"
              value={draft.priceText}
              onChange={(event) => onDraftChange({ ...draft, priceText: event.target.value })}
            />
            <em>/kWh</em>
          </div>
        </label>
        <div className="drawer-actions">
          {canRemove ? (
            <motion.button
              type="button"
              className="text-button danger"
              onClick={onRemove}
              whileTap={{ scale: 0.97 }}
            >
              {copy.remove}
            </motion.button>
          ) : null}
          <motion.button
            type="button"
            className="secondary-action"
            onClick={onClose}
            whileTap={{ scale: 0.97 }}
          >
            {copy.cancel}
          </motion.button>
          <motion.button
            type="submit"
            className="primary-action"
            disabled={priceInvalid}
            whileTap={{ scale: priceInvalid ? 1 : 0.97 }}
          >
            {copy.save}
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function StepperRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const canDecrease = value > min;
  const canIncrease = value < max;
  return (
    <div className="stepper-row">
      <span>{label}</span>
      <div className="stepper-controls">
        <motion.button
          type="button"
          aria-label={`${label} -`}
          disabled={!canDecrease}
          onClick={() => onChange(value - 1)}
          whileTap={{ scale: canDecrease ? 0.9 : 1 }}
        >
          -
        </motion.button>
        <strong>{formatHour(value)}</strong>
        <motion.button
          type="button"
          aria-label={`${label} +`}
          disabled={!canIncrease}
          onClick={() => onChange(value + 1)}
          whileTap={{ scale: canIncrease ? 0.9 : 1 }}
        >
          +
        </motion.button>
      </div>
    </div>
  );
}

function SectionTitle({
  index,
  title,
  subtitle,
  helper,
}: {
  index: number;
  title: string;
  subtitle?: string;
  helper?: string;
}) {
  return (
    <div className="section-title">
      <span className="step-number">{index}</span>
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {helper ? (
        <CircleHelp className="section-help" size={18} aria-hidden="true" />
      ) : null}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span>
      <i style={{ background: color }} />
      {label}
    </span>
  );
}

function AssetSelector({
  state,
  updateAsset,
}: {
  state: CalculatorState;
  updateAsset: (key: AssetKey, patch: Partial<CalculatorState["assets"][AssetKey]>) => void;
}) {
  const copy = getCopy(state.language);
  return (
    <section className="panel asset-panel" aria-labelledby="asset-title">
      <SectionTitle index={2} title={copy.devicesTitle} subtitle={copy.selectedHint} />
      <motion.div className="asset-grid" variants={listMotion} initial="initial" animate="animate">
        {assetMetas.map((meta) => {
          const asset = state.assets[meta.key];
          const Icon = assetIcons[meta.key];
          return (
            <motion.article
              className={`asset-tile ${asset.enabled ? "is-enabled" : ""}`}
              key={meta.key}
              style={{ "--asset-color": meta.color } as CSSProperties}
              variants={itemMotion}
              layout
              transition={softSpring}
            >
              <motion.button
                type="button"
                className="asset-toggle"
                aria-pressed={asset.enabled}
                onClick={() => updateAsset(meta.key, { enabled: !asset.enabled })}
                whileTap={{ scale: 0.97 }}
              >
                <span className="asset-illustration" aria-hidden="true">
                  <Icon size={28} />
                </span>
                <span className="asset-name">{copy[meta.key]}</span>
                <span className="switch-track" aria-hidden="true">
                  <span />
                </span>
              </motion.button>
              <p className="asset-help">{copy[`${meta.key}Help` as keyof typeof copy]}</p>
              <AnimatePresence initial={false}>
                {asset.enabled ? (
                  <motion.label
                    className="range-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={quick}
                  >
                    <span>
                      {copy[`${meta.key}Metric` as keyof typeof copy]}{" "}
                      <strong>
                        {formatNumber(asset.value, state.language, 1)} {copy.kwh}
                        {meta.period ? copy[meta.period] : ""}
                      </strong>
                    </span>
                    <input
                      type="range"
                      min={meta.min}
                      max={meta.max}
                      step={meta.step}
                      value={asset.value}
                      onChange={(event) =>
                        updateAsset(meta.key, { value: Number(event.target.value) })
                      }
                    />
                  </motion.label>
                ) : null}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}

function CostPanel({
  state,
  patchTotalCost,
}: {
  state: CalculatorState;
  patchTotalCost: (totalCost: number) => void;
}) {
  const copy = getCopy(state.language);
  const [value, setValue] = useState(state.totalCost.toString());

  useEffect(() => {
    setValue(state.totalCost.toString());
  }, [state.totalCost]);

  return (
    <section className="panel cost-panel" aria-labelledby="cost-title">
      <SectionTitle index={3} title={copy.totalCost} />
      <div className="cost-input-row">
        <span>{state.currency}</span>
        <input
          value={value}
          inputMode="decimal"
          onChange={(event) => {
            setValue(event.target.value);
            patchTotalCost(Number(event.target.value));
          }}
          aria-label={copy.totalCost}
        />
      </div>
    </section>
  );
}

function AdvancedPanel({
  state,
  open,
  setOpen,
  updateAsset,
  updateAdvanced,
}: {
  state: CalculatorState;
  open: boolean;
  setOpen: (open: boolean) => void;
  updateAsset: (key: AssetKey, patch: Partial<CalculatorState["assets"][AssetKey]>) => void;
  updateAdvanced: (patch: Partial<CalculatorState["advanced"]>) => void;
}) {
  const copy = getCopy(state.language);
  return (
    <section className="advanced-wrap">
      <motion.button
        className="advanced-toggle"
        type="button"
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.97 }}
      >
        {open ? copy.hideAdvanced : copy.advanced}
        <ChevronDown size={18} aria-hidden="true" className={open ? "is-open" : ""} />
      </motion.button>
      <AnimatePresence initial={false}>
        {open ? (
        <motion.div
          className="advanced-panel"
          initial={{ opacity: 0, height: 0, y: -6 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -6 }}
          transition={softSpring}
        >
          <label className="range-field">
            <span>
              {copy.batteryEfficiency}{" "}
              <strong>{formatNumber(state.advanced.batteryEfficiency * 100, state.language, 0)}%</strong>
            </span>
            <input
              type="range"
              min={0.5}
              max={0.98}
              step={0.01}
              value={state.advanced.batteryEfficiency}
              onChange={(event) =>
                updateAdvanced({ batteryEfficiency: Number(event.target.value) })
              }
            />
          </label>
          <label className="range-field">
            <span>
              {copy.batteryCycles}{" "}
              <strong>{formatNumber(state.advanced.batteryCyclesPerDay, state.language, 1)}</strong>
            </span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={state.advanced.batteryCyclesPerDay}
              onChange={(event) =>
                updateAdvanced({ batteryCyclesPerDay: Number(event.target.value) })
              }
            />
            <small className="range-note">{copy.batteryCyclesHint}</small>
          </label>
          <label className="range-field">
            <span>
              {copy.heatCop}{" "}
              <strong>{formatNumber(state.advanced.heatPumpCop, state.language, 1)}</strong>
            </span>
            <input
              type="range"
              min={1}
              max={6}
              step={0.1}
              value={state.advanced.heatPumpCop}
              onChange={(event) => updateAdvanced({ heatPumpCop: Number(event.target.value) })}
            />
          </label>
          <div className="split-costs">
            <h3>{copy.splitCosts}</h3>
            <p>{copy.splitCostsHint}</p>
            <div className="split-grid">
              {assetKeys.map((key) => (
                <label key={key}>
                  {copy[key]}
                  <input
                    inputMode="decimal"
                    value={state.assets[key].cost || ""}
                    placeholder="0"
                    onChange={(event) =>
                      updateAsset(key, { cost: Number(event.target.value) })
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function ResultScreen({
  state,
  result,
  apiStatus,
  shareLink,
  shareStatus,
  onShare,
  setScreen,
}: {
  state: CalculatorState;
  result: ReturnType<typeof calculateSavings>;
  apiStatus: string;
  shareLink: string;
  shareStatus: string;
  onShare: () => void;
  setScreen: (screen: Screen) => void;
}) {
  const copy = getCopy(state.language);

  return (
    <motion.section
      className="screen screen-result"
      aria-labelledby="result-title"
      variants={pageMotion}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={softSpring}
    >
      <header className="result-header">
        <h1 id="result-title">{copy.resultTitle}</h1>
        <p>{copy.resultSubtitle}</p>
        <AnimatePresence>
          {apiStatus ? (
            <motion.span
              className="api-status"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={quick}
            >
              {apiStatus}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </header>
      <motion.section
        className="payback-gauge"
        aria-label={copy.paybackMain}
        initial={{ opacity: 0, scale: 0.86, rotate: -3 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={spring}
      >
        <span className="confetti one" />
        <span className="confetti two" />
        <span className="confetti three" />
        <span>{copy.approx}</span>
        <strong>
          {result.paybackYears === null ? (
            copy.noPayback
          ) : (
            <>
              <AnimatedValue
                value={result.paybackYears}
                formatter={(value) => formatNumber(value, state.language, 1)}
              />{" "}
              {copy.years}
            </>
          )}
        </strong>
        <b>
          {copy.annualSavings}{" "}
          <AnimatedValue
            value={result.annualSavings}
            formatter={(value) => formatMoney(value, state.language, state.currency)}
          />
        </b>
      </motion.section>
      <SavingsBuckets state={state} result={result} />
      <PlanPanel state={state} result={result} />
      <div className="result-actions">
        <motion.button
          type="button"
          className="secondary-action"
          onClick={onShare}
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -1 }}
        >
          <Share2 size={20} aria-hidden="true" />
          {copy.share}
        </motion.button>
        <motion.button
          type="button"
          className="primary-action"
          onClick={() => setScreen("input")}
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -1 }}
        >
          <Pencil size={20} aria-hidden="true" />
          {copy.edit}
        </motion.button>
      </div>
      <AnimatePresence>
        {shareLink ? (
          <motion.label
            className="share-link-box"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={quick}
          >
            <span>{copy.shareLink}</span>
            <input value={shareLink} readOnly onFocus={(event) => event.currentTarget.select()} />
          </motion.label>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {shareStatus ? (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 16, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 16, x: "-50%" }}
            transition={quick}
          >
            {shareStatus}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <p className="estimate-note">💡 {copy.estimateNote}</p>
    </motion.section>
  );
}

function AnimatedValue({
  value,
  formatter,
}: {
  value: number;
  formatter: (value: number) => string;
}) {
  const reducedMotion = useReducedMotion();
  const motionValue = useMotionValue(reducedMotion ? value : 0);
  const springValue = useSpring(motionValue, {
    stiffness: 160,
    damping: 24,
    mass: 0.8,
  });
  const [display, setDisplay] = useState(formatter(value));

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(formatter(value));
      return;
    }
    motionValue.set(value);
  }, [formatter, motionValue, reducedMotion, value]);

  useMotionValueEvent(springValue, "change", (latest) => {
    setDisplay(formatter(latest));
  });

  return <>{display}</>;
}

function SavingsBuckets({
  state,
  result,
}: {
  state: CalculatorState;
  result: ReturnType<typeof calculateSavings>;
}) {
  const copy = getCopy(state.language);
  return (
    <section className="panel savings-panel" aria-labelledby="savings-title">
      <h2 id="savings-title">{copy.savingsFrom}</h2>
      <motion.div className="bucket-grid" variants={listMotion} initial="initial" animate="animate">
        {assetMetas.map((meta) => {
          const Icon = assetIcons[meta.key];
          const contribution = result.contributions[meta.key];
          const percent = result.annualSavings
            ? Math.max(10, (contribution.annualSavings / result.annualSavings) * 100)
            : 0;
          return (
            <motion.article
              className="bucket"
              key={meta.key}
              style={{ "--asset-color": meta.color, "--fill": `${percent}%` } as CSSProperties}
              variants={itemMotion}
              transition={softSpring}
            >
              <div className="bucket-art" aria-hidden="true">
                <Icon size={28} />
              </div>
              <h3>{copy[meta.key]}</h3>
              <strong>
                <AnimatedValue
                  value={contribution.annualSavings}
                  formatter={(value) => formatMoney(value, state.language, state.currency)}
                />
              </strong>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}

function PlanPanel({
  state,
  result,
}: {
  state: CalculatorState;
  result: ReturnType<typeof calculateSavings>;
}) {
  const copy = getCopy(state.language);
  return (
    <section className="panel plan-panel" aria-labelledby="plan-title">
      <h2 id="plan-title">{copy.planTitle}</h2>
      <motion.div className="mini-timeline" layout>
        {result.hourlyPrices.map((price, hour) => (
          <motion.span
            key={hour}
            className={priceClass(price)}
            title={`${formatHour(hour)} ${price}`}
            initial={{ scaleY: 0.2, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ ...quick, delay: Math.min(hour * 0.012, 0.22) }}
          />
        ))}
      </motion.div>
      <div className="hour-labels compact" aria-hidden="true">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
      <motion.div className="plan-cards" variants={listMotion} initial="initial" animate="animate">
        <motion.div className="plan-card cheap-card" variants={itemMotion} transition={softSpring}>
          <h3>{copy.cheapUse}</h3>
          <p>○ {copy.cheapUseA}</p>
          <p>○ {copy.cheapUseB}</p>
        </motion.div>
        <motion.div className="plan-card peak-card" variants={itemMotion} transition={softSpring}>
          <h3>{copy.peakAvoid}</h3>
          <p>○ {copy.peakAvoidA}</p>
          <p>○ {copy.peakAvoidB}</p>
        </motion.div>
      </motion.div>
    </section>
  );
}

function priceClass(price: number): string {
  if (price < 0) return "negative-price";
  if (price <= 0.6) return "cheap-price";
  return "high-price";
}
