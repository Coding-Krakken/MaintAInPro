// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { useQuery } from '@tanstack/react-query';
export interface HealthData {
  status: string;
  timestamp: string;
  env: string;
  port: number;
  version: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  websocket: {
    totalConnections: number;
    activeConnections: number;
    connectionsByWarehouse: Record<string, number>;
  };
  features: {
    auth: string;
    database: string;
    redis: string;
    email: string;
  };
  sha?: string;
  buildId?: string;
  region?: string;
  url?: string;
}

// New interfaces as per issue requirements
export interface HealthMetrics {
  systemStatus: 'healthy' | 'degraded' | 'down';
  databaseConnections: number;
  activeUsers: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
  lastCheck: Date;
}
export interface HealthService {
  getSystemHealth(): Promise<HealthMetrics>;
  refreshHealthMetrics(): Promise<void>;
}
export function useHealthData(enabled = stryMutAct_9fa48("0") ? false : (stryCov_9fa48("0"), true)) {
  if (stryMutAct_9fa48("1")) {
    {}
  } else {
    stryCov_9fa48("1");
    return useQuery<HealthData>(stryMutAct_9fa48("2") ? {} : (stryCov_9fa48("2"), {
      queryKey: stryMutAct_9fa48("3") ? [] : (stryCov_9fa48("3"), [stryMutAct_9fa48("4") ? "" : (stryCov_9fa48("4"), '/api/health')]),
      queryFn: async () => {
        if (stryMutAct_9fa48("5")) {
          {}
        } else {
          stryCov_9fa48("5");
          const response = await fetch(stryMutAct_9fa48("6") ? "" : (stryCov_9fa48("6"), '/api/health'), stryMutAct_9fa48("7") ? {} : (stryCov_9fa48("7"), {
            headers: stryMutAct_9fa48("8") ? {} : (stryCov_9fa48("8"), {
              Authorization: stryMutAct_9fa48("9") ? "" : (stryCov_9fa48("9"), 'Bearer demo-token'),
              'x-user-id': stryMutAct_9fa48("12") ? localStorage.getItem('userId') && 'default-user-id' : stryMutAct_9fa48("11") ? false : stryMutAct_9fa48("10") ? true : (stryCov_9fa48("10", "11", "12"), localStorage.getItem(stryMutAct_9fa48("13") ? "" : (stryCov_9fa48("13"), 'userId')) || (stryMutAct_9fa48("14") ? "" : (stryCov_9fa48("14"), 'default-user-id'))),
              'x-warehouse-id': stryMutAct_9fa48("17") ? localStorage.getItem('warehouseId') && 'default-warehouse-id' : stryMutAct_9fa48("16") ? false : stryMutAct_9fa48("15") ? true : (stryCov_9fa48("15", "16", "17"), localStorage.getItem(stryMutAct_9fa48("18") ? "" : (stryCov_9fa48("18"), 'warehouseId')) || (stryMutAct_9fa48("19") ? "" : (stryCov_9fa48("19"), 'default-warehouse-id')))
            })
          }));
          if (stryMutAct_9fa48("22") ? false : stryMutAct_9fa48("21") ? true : stryMutAct_9fa48("20") ? response.ok : (stryCov_9fa48("20", "21", "22"), !response.ok)) throw new Error(stryMutAct_9fa48("23") ? "" : (stryCov_9fa48("23"), 'Failed to fetch health data'));
          return response.json();
        }
      },
      enabled,
      refetchInterval: 30000,
      // Refresh every 30 seconds
      staleTime: 5000
    }));
  }
}

// Enhanced health service with both existing and new functionality
class HealthServiceImpl implements HealthService {
  private lastHealthMetrics: HealthMetrics | null = null;
  private lastHealthData: HealthData | null = null;

  // Original method for backward compatibility
  async getHealth(): Promise<HealthData> {
    if (stryMutAct_9fa48("24")) {
      {}
    } else {
      stryCov_9fa48("24");
      const startTime = Date.now();
      const response = await fetch(stryMutAct_9fa48("25") ? "" : (stryCov_9fa48("25"), '/api/health'), stryMutAct_9fa48("26") ? {} : (stryCov_9fa48("26"), {
        headers: stryMutAct_9fa48("27") ? {} : (stryCov_9fa48("27"), {
          Authorization: stryMutAct_9fa48("28") ? "" : (stryCov_9fa48("28"), 'Bearer demo-token'),
          'x-user-id': stryMutAct_9fa48("31") ? localStorage.getItem('userId') && 'default-user-id' : stryMutAct_9fa48("30") ? false : stryMutAct_9fa48("29") ? true : (stryCov_9fa48("29", "30", "31"), localStorage.getItem(stryMutAct_9fa48("32") ? "" : (stryCov_9fa48("32"), 'userId')) || (stryMutAct_9fa48("33") ? "" : (stryCov_9fa48("33"), 'default-user-id'))),
          'x-warehouse-id': stryMutAct_9fa48("36") ? localStorage.getItem('warehouseId') && 'default-warehouse-id' : stryMutAct_9fa48("35") ? false : stryMutAct_9fa48("34") ? true : (stryCov_9fa48("34", "35", "36"), localStorage.getItem(stryMutAct_9fa48("37") ? "" : (stryCov_9fa48("37"), 'warehouseId')) || (stryMutAct_9fa48("38") ? "" : (stryCov_9fa48("38"), 'default-warehouse-id')))
        })
      }));
      if (stryMutAct_9fa48("41") ? false : stryMutAct_9fa48("40") ? true : stryMutAct_9fa48("39") ? response.ok : (stryCov_9fa48("39", "40", "41"), !response.ok)) throw new Error(stryMutAct_9fa48("42") ? "" : (stryCov_9fa48("42"), 'Failed to fetch health data'));
      const healthData = await response.json();
      this.lastHealthData = healthData;
      return healthData;
    }
  }

  // New method as per interface requirements
  async getSystemHealth(): Promise<HealthMetrics> {
    if (stryMutAct_9fa48("43")) {
      {}
    } else {
      stryCov_9fa48("43");
      const startTime = Date.now();
      try {
        if (stryMutAct_9fa48("44")) {
          {}
        } else {
          stryCov_9fa48("44");
          const healthData = await this.getHealth();
          const responseTime = stryMutAct_9fa48("45") ? Date.now() + startTime : (stryCov_9fa48("45"), Date.now() - startTime);

          // Transform HealthData to HealthMetrics
          const metrics: HealthMetrics = stryMutAct_9fa48("46") ? {} : (stryCov_9fa48("46"), {
            systemStatus: this.mapStatusToSystemStatus(healthData.status),
            databaseConnections: this.extractDatabaseConnections(healthData),
            activeUsers: stryMutAct_9fa48("49") ? healthData.websocket?.activeConnections && 0 : stryMutAct_9fa48("48") ? false : stryMutAct_9fa48("47") ? true : (stryCov_9fa48("47", "48", "49"), (stryMutAct_9fa48("50") ? healthData.websocket.activeConnections : (stryCov_9fa48("50"), healthData.websocket?.activeConnections)) || 0),
            responseTime,
            errorRate: this.calculateErrorRate(healthData),
            uptime: healthData.uptime,
            lastCheck: new Date()
          });
          this.lastHealthMetrics = metrics;
          return metrics;
        }
      } catch (error) {
        if (stryMutAct_9fa48("51")) {
          {}
        } else {
          stryCov_9fa48("51");
          // Return degraded state on error
          const metrics: HealthMetrics = stryMutAct_9fa48("52") ? {} : (stryCov_9fa48("52"), {
            systemStatus: stryMutAct_9fa48("53") ? "" : (stryCov_9fa48("53"), 'down'),
            databaseConnections: 0,
            activeUsers: 0,
            responseTime: stryMutAct_9fa48("54") ? Date.now() + startTime : (stryCov_9fa48("54"), Date.now() - startTime),
            errorRate: 100,
            uptime: 0,
            lastCheck: new Date()
          });
          this.lastHealthMetrics = metrics;
          throw error;
        }
      }
    }
  }

  // New method as per interface requirements
  async refreshHealthMetrics(): Promise<void> {
    if (stryMutAct_9fa48("55")) {
      {}
    } else {
      stryCov_9fa48("55");
      await this.getSystemHealth();
    }
  }

  // Helper method to map status strings to system status
  private mapStatusToSystemStatus(status: string): 'healthy' | 'degraded' | 'down' {
    if (stryMutAct_9fa48("56")) {
      {}
    } else {
      stryCov_9fa48("56");
      switch (status) {
        case stryMutAct_9fa48("57") ? "" : (stryCov_9fa48("57"), 'ok'):
        case stryMutAct_9fa48("59") ? "" : (stryCov_9fa48("59"), 'healthy'):
          if (stryMutAct_9fa48("58")) {} else {
            stryCov_9fa48("58");
            return stryMutAct_9fa48("60") ? "" : (stryCov_9fa48("60"), 'healthy');
          }
        case stryMutAct_9fa48("61") ? "" : (stryCov_9fa48("61"), 'degraded'):
        case stryMutAct_9fa48("63") ? "" : (stryCov_9fa48("63"), 'warning'):
          if (stryMutAct_9fa48("62")) {} else {
            stryCov_9fa48("62");
            return stryMutAct_9fa48("64") ? "" : (stryCov_9fa48("64"), 'degraded');
          }
        case stryMutAct_9fa48("65") ? "" : (stryCov_9fa48("65"), 'error'):
        case stryMutAct_9fa48("66") ? "" : (stryCov_9fa48("66"), 'down'):
        case stryMutAct_9fa48("68") ? "" : (stryCov_9fa48("68"), 'unhealthy'):
          if (stryMutAct_9fa48("67")) {} else {
            stryCov_9fa48("67");
            return stryMutAct_9fa48("69") ? "" : (stryCov_9fa48("69"), 'down');
          }
        default:
          if (stryMutAct_9fa48("70")) {} else {
            stryCov_9fa48("70");
            return (stryMutAct_9fa48("73") ? status !== 'ok' : stryMutAct_9fa48("72") ? false : stryMutAct_9fa48("71") ? true : (stryCov_9fa48("71", "72", "73"), status === (stryMutAct_9fa48("74") ? "" : (stryCov_9fa48("74"), 'ok')))) ? stryMutAct_9fa48("75") ? "" : (stryCov_9fa48("75"), 'healthy') : stryMutAct_9fa48("76") ? "" : (stryCov_9fa48("76"), 'degraded');
          }
      }
    }
  }

  // Helper method to extract database connections from health data
  private extractDatabaseConnections(healthData: HealthData): number {
    if (stryMutAct_9fa48("77")) {
      {}
    } else {
      stryCov_9fa48("77");
      // Check if database feature is enabled and estimate connections
      if (stryMutAct_9fa48("80") ? healthData.features?.database !== 'enabled' : stryMutAct_9fa48("79") ? false : stryMutAct_9fa48("78") ? true : (stryCov_9fa48("78", "79", "80"), (stryMutAct_9fa48("81") ? healthData.features.database : (stryCov_9fa48("81"), healthData.features?.database)) === (stryMutAct_9fa48("82") ? "" : (stryCov_9fa48("82"), 'enabled')))) {
        if (stryMutAct_9fa48("83")) {
          {}
        } else {
          stryCov_9fa48("83");
          // For now, return a reasonable estimate based on active users
          // In a real implementation, this would come from the server
          return stryMutAct_9fa48("84") ? Math.min(1, Math.ceil((healthData.websocket?.activeConnections || 0) / 10)) : (stryCov_9fa48("84"), Math.max(1, Math.ceil(stryMutAct_9fa48("85") ? (healthData.websocket?.activeConnections || 0) * 10 : (stryCov_9fa48("85"), (stryMutAct_9fa48("88") ? healthData.websocket?.activeConnections && 0 : stryMutAct_9fa48("87") ? false : stryMutAct_9fa48("86") ? true : (stryCov_9fa48("86", "87", "88"), (stryMutAct_9fa48("89") ? healthData.websocket.activeConnections : (stryCov_9fa48("89"), healthData.websocket?.activeConnections)) || 0)) / 10))));
        }
      }
      return 0;
    }
  }

  // Helper method to calculate error rate based on health data
  private calculateErrorRate(healthData: HealthData): number {
    if (stryMutAct_9fa48("90")) {
      {}
    } else {
      stryCov_9fa48("90");
      // Basic error rate calculation based on system health
      const systemStatus = this.mapStatusToSystemStatus(healthData.status);
      switch (systemStatus) {
        case stryMutAct_9fa48("92") ? "" : (stryCov_9fa48("92"), 'healthy'):
          if (stryMutAct_9fa48("91")) {} else {
            stryCov_9fa48("91");
            return 0;
          }
        case stryMutAct_9fa48("94") ? "" : (stryCov_9fa48("94"), 'degraded'):
          if (stryMutAct_9fa48("93")) {} else {
            stryCov_9fa48("93");
            return 5;
          }
        // 5% error rate for degraded systems
        case stryMutAct_9fa48("96") ? "" : (stryCov_9fa48("96"), 'down'):
          if (stryMutAct_9fa48("95")) {} else {
            stryCov_9fa48("95");
            return 100;
          }
        // 100% error rate for down systems
        default:
          if (stryMutAct_9fa48("97")) {} else {
            stryCov_9fa48("97");
            return 0;
          }
      }
    }
  }

  // Getter for last cached metrics (useful for debugging)
  getLastHealthMetrics(): HealthMetrics | null {
    if (stryMutAct_9fa48("98")) {
      {}
    } else {
      stryCov_9fa48("98");
      return this.lastHealthMetrics;
    }
  }

  // Getter for last cached health data (useful for debugging)
  getLastHealthData(): HealthData | null {
    if (stryMutAct_9fa48("99")) {
      {}
    } else {
      stryCov_9fa48("99");
      return this.lastHealthData;
    }
  }
}

// Export singleton instance
export const healthService = new HealthServiceImpl();