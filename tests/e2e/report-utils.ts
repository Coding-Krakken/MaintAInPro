// This file is used for comparing previous and current feature/component discovery reports.
// It can be extended to support HTML report generation and trend analysis.

// Types for route and component reports
export interface RouteInfo {
  href: string;
  text: string;
  status: string;
  hasContent: boolean;
  hasPlaceholder: boolean;
  loadTime: number;
  httpStatus?: number;
  redirectedTo?: string;
  screenshotPath?: string;
  accessibilityIssues?: string[];
}

export interface FeatureDiscoveryReport {
  timestamp: string;
  totalRoutes: number;
  implementedRoutes: number;
  placeholderRoutes: number;
  routes: RouteInfo[];
  mobileCompatible: boolean;
  offlineCapable: boolean;
}

export interface ComponentMeta {
  selector: string;
  index: number;
  ariaLabel: string | null;
  role: string | null;
  dataTestId: string | null;
  screenshot: string;
}

export interface ComponentDiscoveryReport {
  details: Record<string, ComponentMeta[]>;
  counts: Record<string, number>;
  missing: string[];
}

export interface CompareReportChanges {
  newRoutes: string[];
  removedRoutes: string[];
  changedRoutes: string[];
  newComponents: string[];
  removedComponents: string[];
  changedComponents: string[];
}

export function compareReports(
  prev: FeatureDiscoveryReport | null,
  curr: FeatureDiscoveryReport
): CompareReportChanges {
  const changes: CompareReportChanges = {
    newRoutes: [],
    removedRoutes: [],
    changedRoutes: [],
    newComponents: [],
    removedComponents: [],
    changedComponents: [],
  };
  if (prev && curr) {
    // Compare routes
    const prevRoutes = new Set<string>(prev.routes?.map(r => r.href));
    const currRoutes = new Set<string>(curr.routes?.map(r => r.href));
    for (const href of Array.from(currRoutes)) {
      if (!prevRoutes.has(href)) changes.newRoutes.push(href);
    }
    for (const href of Array.from(prevRoutes)) {
      if (!currRoutes.has(href)) changes.removedRoutes.push(href);
    }
    // Compare components (by category and selector)
    // Not comparing details here, as FeatureDiscoveryReport does not have component details
  }
  return changes;
}

export function generateHTMLReport(report, changes) {
  // Placeholder for HTML report generation
  // This can be expanded to create a full HTML summary
  return `<html><body><h1>Feature Discovery Report</h1><pre>${JSON.stringify(report, null, 2)}</pre><h2>Changes</h2><pre>${JSON.stringify(changes, null, 2)}</pre></body></html>`;
}
