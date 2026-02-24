import type { LicenseManager } from './license';

export type Feature =
  | 'timeline-view'
  | 'session-persistence'
  | 'export-json'
  | 'export-csv'
  | 'issue-detail'
  | 'search'
  | 'category-filter';

const FREE_FEATURES: Set<Feature> = new Set([
  'issue-detail',
  'search',
]);

const PRO_FEATURES: Set<Feature> = new Set([
  'timeline-view',
  'session-persistence',
  'export-json',
  'export-csv',
  'category-filter',
]);

export interface FeatureGate {
  isEnabled(feature: Feature): boolean;
  getFreeFeatures(): Feature[];
  getProFeatures(): Feature[];
  getAllFeatures(): Feature[];
}

export function createFeatureGate(license: LicenseManager): FeatureGate {
  function isEnabled(feature: Feature): boolean {
    if (FREE_FEATURES.has(feature)) return true;
    if (PRO_FEATURES.has(feature)) return license.isPro();
    return false;
  }

  function getFreeFeatures(): Feature[] {
    return [...FREE_FEATURES];
  }

  function getProFeatures(): Feature[] {
    return [...PRO_FEATURES];
  }

  function getAllFeatures(): Feature[] {
    return [...FREE_FEATURES, ...PRO_FEATURES];
  }

  return { isEnabled, getFreeFeatures, getProFeatures, getAllFeatures };
}
