'use client';

import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  LayoutPatternsConfig,
  LayoutPatternRule,
  LayoutPatternSpan,
  LayoutPatternVariant,
} from '@/types';

const VARIANT_ORDER: LayoutPatternVariant[] = ['large', 'horizontal', 'vertical', 'small'];

const VARIANT_DEFAULTS: Record<LayoutPatternVariant, LayoutPatternRule> = {
  large: { variant: 'large', enabled: true, interval: 12, span: '2x2' },
  horizontal: { variant: 'horizontal', enabled: true, interval: 6, span: '2x1' },
  vertical: { variant: 'vertical', enabled: false, interval: 8, span: '1x2' },
  small: { variant: 'small', enabled: false, interval: 3, span: '1x1' },
};

const SPAN_FALLBACK: Record<LayoutPatternVariant, LayoutPatternSpan> = {
  large: '2x2',
  horizontal: '2x1',
  vertical: '1x2',
  small: '1x1',
};

const LEGACY_HEIGHT_MAP: Record<LayoutPatternSpan, string> = {
  '1x1': 'h-32',
  '2x1': 'h-32',
  '1x2': 'h-48',
  '2x2': 'h-64',
};

export const DEFAULT_LAYOUT_PATTERNS: LayoutPatternsConfig = {
  rules: VARIANT_ORDER.map((variant) => ({ ...VARIANT_DEFAULTS[variant] })),
  updatedAt: undefined,
};

const isValidSpan = (value: unknown): value is LayoutPatternSpan =>
  value === '1x1' || value === '2x1' || value === '1x2' || value === '2x2';

const normalizeRule = (
  variant: LayoutPatternVariant,
  incoming?: Partial<LayoutPatternRule> | null,
): LayoutPatternRule => {
  const defaults = VARIANT_DEFAULTS[variant];
  const interval = Number(incoming?.interval);
  let span: LayoutPatternSpan = defaults.span;
  if (isValidSpan(incoming?.span)) {
    span = incoming?.span as LayoutPatternSpan;
  }
  return {
    variant,
    enabled: typeof incoming?.enabled === 'boolean' ? incoming.enabled : defaults.enabled,
    interval: Number.isFinite(interval) && interval > 0 ? Math.round(interval) : defaults.interval,
    span,
  };
};

const normalizeFromLegacyRecord = (data: Record<string, unknown>): LayoutPatternRule[] => {
  return VARIANT_ORDER.map((variant) => {
    const legacyEntry = data?.[variant];
    const legacy = (legacyEntry && typeof legacyEntry === 'object') ? legacyEntry as Record<string, unknown> : {};
    const spanFromLegacy = (() => {
      if (isValidSpan(legacy?.span)) return legacy.span as LayoutPatternSpan;
      const height = legacy?.height as string | undefined;
      if (height) {
        const match = (Object.entries(LEGACY_HEIGHT_MAP) as Array<[LayoutPatternSpan, string]>).find(
          ([, value]) => value === height,
        );
        if (match) return match[0];
      }
      if (variant === 'horizontal') return '2x1';
      if (variant === 'vertical') return '1x2';
      if (variant === 'large') return '2x2';
      return '1x1';
    })();

    return normalizeRule(variant, {
      enabled: typeof legacy.enabled === 'boolean' ? (legacy.enabled as boolean) : undefined,
      interval: legacy.interval as number | undefined,
      span: spanFromLegacy,
    });
  });
};

const normalizeLayoutPatterns = (raw: unknown): LayoutPatternsConfig => {
  if (!raw || typeof raw !== 'object') {
    return {
      rules: VARIANT_ORDER.map((variant) => ({ ...VARIANT_DEFAULTS[variant] })),
      updatedAt: undefined,
    };
  }

  const record = raw as Record<string, unknown>;

  if (Array.isArray(record.rules)) {
    const incomingMap = new Map<LayoutPatternVariant, LayoutPatternRule>();
    (record.rules as unknown[]).forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      const rule = entry as Partial<LayoutPatternRule> & { variant?: LayoutPatternVariant };
      if (rule.variant && VARIANT_ORDER.includes(rule.variant)) {
        incomingMap.set(rule.variant, normalizeRule(rule.variant, rule));
      }
    });

    return {
      rules: VARIANT_ORDER.map((variant) =>
        incomingMap.has(variant)
          ? incomingMap.get(variant)!
          : { ...VARIANT_DEFAULTS[variant] },
      ),
      updatedAt: typeof record.updatedAt === 'string' ? (record.updatedAt as string) : undefined,
    };
  }

  if (record.patterns && typeof record.patterns === 'object') {
    return {
      rules: normalizeFromLegacyRecord(record.patterns as Record<string, unknown>),
      updatedAt: typeof record.updatedAt === 'string' ? (record.updatedAt as string) : undefined,
    };
  }

  return {
    rules: VARIANT_ORDER.map((variant) => ({ ...VARIANT_DEFAULTS[variant] })),
    updatedAt: typeof record.updatedAt === 'string' ? (record.updatedAt as string) : undefined,
  };
};

const buildLegacySnapshot = (config: LayoutPatternsConfig) => {
  const snapshot: Record<string, unknown> = {};
  config.rules.forEach((rule) => {
    snapshot[rule.variant] = {
      enabled: rule.enabled,
      interval: rule.interval,
      height: LEGACY_HEIGHT_MAP[rule.span] || LEGACY_HEIGHT_MAP[SPAN_FALLBACK[rule.variant]],
    };
  });
  return snapshot;
};

export function useLayoutPatterns() {
  const [patterns, setPatterns] = useState<LayoutPatternsConfig>(DEFAULT_LAYOUT_PATTERNS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatterns = useCallback(async () => {
    setLoading(true);
    try {
      const ref = doc(db, 'config', 'layoutPatterns');
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        const data = snapshot.data();
        const normalized = normalizeLayoutPatterns(data);
        setPatterns(normalized);
      } else {
        setPatterns(DEFAULT_LAYOUT_PATTERNS);
      }
      setError(null);
    } catch (err) {
      console.error('Error loading layout patterns:', err);
      setPatterns(DEFAULT_LAYOUT_PATTERNS);
      setError('No se pudo cargar la configuración de layout. Se usan valores predeterminados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatterns();
  }, [loadPatterns]);

  const savePatterns = useCallback(async (next: LayoutPatternsConfig) => {
    const normalized = normalizeLayoutPatterns(next);
    setPatterns(normalized);

    const ref = doc(db, 'config', 'layoutPatterns');
    const payload = {
      rules: normalized.rules,
      patterns: buildLegacySnapshot(normalized),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(ref, payload, { merge: true });
  }, []);

  const resetPatterns = useCallback(async () => {
    await savePatterns(DEFAULT_LAYOUT_PATTERNS);
  }, [savePatterns]);

  return {
    patterns,
    loading,
    error,
    savePatterns,
    reloadPatterns: loadPatterns,
    resetPatterns,
  } as const;
}
