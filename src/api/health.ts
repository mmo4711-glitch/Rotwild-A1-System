/**
 * Jagdhandbuch Merschbach — Health Check Endpoint
 * 
 * GET /api/health
 * 
 * Prüft:
 * - Server-Status
 * - Datenbank-Verbindung
 * - BM25-Index-Abdeckung
 * - Service-Verfügbarkeit
 * - Speicherverbrauch
 */

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime_seconds: number;
  version: string;
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
    value?: number | string;
  }[];
  memory: {
    used_mb: number;
    total_mb: number;
    usage_percent: number;
  };
}

const startTime = Date.now();

/**
 * Generiere Health-Status
 * 
 * In der echten Implementierung: DB-Connection und Service-Checks hinzufügen
 */
export function getHealthStatus(options: {
  totalFacts?: number;
  indexedFacts?: number;
  dbConnected?: boolean;
  retrievalApiOk?: boolean;
  embeddingServiceOk?: boolean;
  pipelineOk?: boolean;
} = {}): HealthStatus {
  const {
    totalFacts = 41583,
    indexedFacts = 8000,
    dbConnected = true,
    retrievalApiOk = false, // Bekanntes Problem
    embeddingServiceOk = true,
    pipelineOk = true,
  } = options;
  
  const checks: HealthStatus['checks'] = [];
  
  // DB Check
  checks.push({
    name: 'database',
    status: dbConnected ? 'pass' : 'fail',
    message: dbConnected ? 'PostgreSQL verbunden' : 'Datenbankverbindung fehlgeschlagen',
  });
  
  // BM25 Index Coverage
  const indexCoverage = indexedFacts / totalFacts;
  checks.push({
    name: 'bm25_index',
    status: indexCoverage > 0.95 ? 'pass' : indexCoverage > 0.5 ? 'warn' : 'fail',
    message: `${indexedFacts}/${totalFacts} Fakten indexiert (${Math.round(indexCoverage * 100)}%)`,
    value: `${Math.round(indexCoverage * 100)}%`,
  });
  
  // Retrieval API
  checks.push({
    name: 'retrieval_api',
    status: retrievalApiOk ? 'pass' : 'fail',
    message: retrievalApiOk ? '/api/v13/retrieve funktionsfähig' : 'POST-Route gibt Fehler zurück',
  });
  
  // Embedding Service
  checks.push({
    name: 'embedding_service',
    status: embeddingServiceOk ? 'pass' : 'fail',
    message: embeddingServiceOk ? 'Feature-Hashing (1536-dim) aktiv' : 'Embedding-Service nicht erreichbar',
  });
  
  // Pipeline
  checks.push({
    name: 'pipeline',
    status: pipelineOk ? 'pass' : 'warn',
    message: pipelineOk ? '3-Agent Pipeline (MASTER/QA/CROSS-CHECK) läuft' : 'Pipeline instabil',
  });
  
  // Speicher
  const memUsage = process.memoryUsage();
  const usedMb = Math.round(memUsage.heapUsed / 1024 / 1024);
  const totalMb = Math.round(memUsage.heapTotal / 1024 / 1024);
  
  checks.push({
    name: 'memory',
    status: usedMb < totalMb * 0.85 ? 'pass' : usedMb < totalMb * 0.95 ? 'warn' : 'fail',
    message: `${usedMb}MB / ${totalMb}MB Heap (${Math.round(usedMb/totalMb*100)}%)`,
    value: `${usedMb}MB`,
  });
  
  // Gesamtstatus
  const hasFailure = checks.some(c => c.status === 'fail');
  const hasWarning = checks.some(c => c.status === 'warn');
  
  return {
    status: hasFailure ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round((Date.now() - startTime) / 1000),
    version: '2.0.0-merschbach',
    checks,
    memory: {
      used_mb: usedMb,
      total_mb: totalMb,
      usage_percent: Math.round(usedMb / totalMb * 100),
    },
  };
}
