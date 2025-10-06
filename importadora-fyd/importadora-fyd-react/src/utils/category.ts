export const normalizeCategoryValue = (value?: string | null): string => {
  if (!value) return '';
  return value
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

export const collectCategoryStrings = (value: unknown): string[] => {
  if (!value) return [];

  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectCategoryStrings);
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const preferredKeys = ['slug', 'id', 'value', 'name', 'nombre', 'categoria', 'category', 'title'];
    const directMatches = preferredKeys
      .map((key) => obj[key])
      .filter((entry): entry is string => typeof entry === 'string');

    if (directMatches.length > 0) {
      return directMatches;
    }

    // When categories are stored as maps { moda: true, ... }
    return Object.keys(obj);
  }

  return [];
};

const dedupeStrings = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of values) {
    const trimmed = entry?.toString().trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
};

export const getProductCategoryCandidates = (product: { categoria?: unknown; categorias?: unknown }): string[] => {
  const raw = dedupeStrings([
    ...collectCategoryStrings(product.categoria),
    ...collectCategoryStrings(product.categorias),
  ]);

  const expanded = dedupeStrings([
    ...raw,
    ...raw.flatMap((value) => (value.includes('-') ? value.split('-') : [])),
  ]);

  return expanded;
};

export const getProductSubcategoryCandidates = (product: { subcategoria?: unknown; categorias?: unknown }): string[] => {
  const raw = dedupeStrings([
    ...collectCategoryStrings(product.subcategoria),
    ...collectCategoryStrings(product.categorias),
  ]);

  const expanded = dedupeStrings([
    ...raw,
    ...raw.flatMap((value) => (value.includes('-') ? value.split('-') : [])),
  ]);

  return expanded;
};

const normalizedEquals = (a?: string | null, b?: string | null): boolean => {
  if (!a || !b) return false;
  return normalizeCategoryValue(a) === normalizeCategoryValue(b);
};

export const productMatchesCategory = (
  product: { categoria?: unknown; categorias?: unknown },
  targetCategory: string,
): boolean => {
  const normalizedTarget = normalizeCategoryValue(targetCategory);
  if (!normalizedTarget) {
    return false;
  }

  const candidates = getProductCategoryCandidates(product);

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeCategoryValue(candidate);
    if (!normalizedCandidate) continue;
    if (normalizedCandidate === normalizedTarget) return true;
    if (normalizedCandidate.startsWith(normalizedTarget)) return true;
  }

  return false;
};

export const productMatchesSubcategory = (
  product: { subcategoria?: unknown; categorias?: unknown },
  targetSubcategory: string,
): boolean => {
  const normalizedTarget = normalizeCategoryValue(targetSubcategory);
  if (!normalizedTarget) {
    return false;
  }

  const directMatches = collectCategoryStrings(product.subcategoria);
  if (directMatches.some((candidate) => normalizedEquals(candidate, targetSubcategory))) {
    return true;
  }

  const categoryEntries = collectCategoryStrings(product.categorias);
  return categoryEntries.some((entry) => {
    const normalizedEntry = normalizeCategoryValue(entry);
    if (!normalizedEntry) return false;
    return (
      normalizedEntry.endsWith(normalizedTarget) ||
      normalizedEntry.includes(normalizedTarget)
    );
  });
};

export const formatCategoryLabel = (value: string): string => {
  const cleaned = value.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return value;
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const buildCategorySlug = (value: string): string => normalizeCategoryValue(value);
