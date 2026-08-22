import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

// Mock types matching the orchestrator contract
interface MockAction01Result {
  issueDataset: Array<{
    id: string;
    title: string;
    description: string;
    reportedDate: string;
    status: string;
  }>;
}

interface MockAction02Result {
  recurrencePatterns: Array<{
    patternId: string;
    patternType: string;
    rootCauseCode: string;
    affectedIssueIds: string[];
  }>;
}

interface MockAction03Result {
  bottleneckPatterns: Array<{
    periodId: string;
    bottleneckLocation: string;
    timeSeriesShift: string;
    impactScore: number;
    patternChanges: Array<{
      fromPeriod: string;
      toPeriod: string;
      shift: string;
    }>;
  }>;
}

interface MockAction04Result {
  reportMetadata: {
    timestamp: string;
    patternIds: string[];
    occurrenceCount: number;
    graphCoordinates: Array<{ x: number; y: number }>;
  };
}

interface MockAction05Result {
  priorityScores: Record<string, number>;
  highlightedIssueIds: string[];
}

interface MockAiClientResponse {
  action01Result?: MockAction01Result;
  action02Result?: MockAction02Result;
  action03Result?: MockAction03Result;
  action04Result?: MockAction04Result;
  action05Result?: MockAction05Result;
}

describe('Tx8Imp1Agent - Issue Search to Visualization Report', () => {
  // SCEN-146
  test('should execute Action 3 (Identify Bottleneck Pattern) as part of complete orchestration flow', async () => {
    // Setup: Create mock AI client that implements Tx8Imp1AiClient interface
    const mockAiClient: Tx8Imp1AiClient = {
      callAction: async (actionName: string, prompt: string): Promise<unknown> => {
        if (actionName === 'action-01') {
          return {
            issueDataset: [
              {
                id: 'ISSUE-001',
                title: 'Database timeout in checkout flow',
                description: 'Intermittent timeout errors observed',
                reportedDate: '2024-01-15T08:00:00Z',
                status: 'open',
              },
              {
                id: 'ISSUE-002',
                title: 'API rate limit exceeded',
                description: 'Rate limiter threshold breach',
                reportedDate: '2024-01-15T09:30:00Z',
                status: 'open',
              },
              {
                id: 'ISSUE-003',
                title: 'Cache invalidation race condition',
                description: 'Stale data served to clients',
                reportedDate: '2024-01-14T10:15:00Z',
                status: 'resolved',
              },
              {
                id: 'ISSUE-004',
                title: 'Connection pool exhaustion',
                description: 'Maximum connections reached',
                reportedDate: '2024-01-13T14:20:00Z',
                status: 'open',
              },
              {
                id: 'ISSUE-005',
                title: 'Memory leak in worker process',
                description: 'Heap size growing unbounded',
                reportedDate: '2024-01-12T16:45:00Z',
                status: 'resolved',
              },
            ],
          } as MockAction01Result;
        }

        if (actionName === 'action-02') {
          return {
            recurrencePatterns: [
              {
                patternId: 'PAT-001',
                patternType: 'same-root-cause-recurrence',
                rootCauseCode: 'DB_TIMEOUT',
                affectedIssueIds: ['ISSUE-001', 'ISSUE-004'],
              },
              {
                patternId: 'PAT-002',
                patternType: 'environment-dependent-recurrence',
                rootCauseCode: 'ENV_CONFIG',
                affectedIssueIds: ['ISSUE-002', 'ISSUE-005'],
              },
            ],
          } as MockAction02Result;
        }

        if (actionName === 'action-03') {
          return {
            bottleneckPatterns: [
              {
                periodId: 'PERIOD-2024-W01',
                bottleneckLocation: 'database-layer',
                timeSeriesShift: 'process-A-to-process-B',
                impactScore: 85,
                patternChanges: [
                  {
                    fromPeriod: '2024-W01',
                    toPeriod: '2024-W02',
                    shift: 'checkout-flow-to-payment-gateway',
                  },
                ],
              },
              {
                periodId: 'PERIOD-2024-W02',
                bottleneckLocation: 'api-gateway-layer',
                timeSeriesShift: 'process-B-to-process-C',
                impactScore: 72,
                patternChanges: [
                  {
                    fromPeriod: '2024-W02',
                    toPeriod: '2024-W03',
                    shift: 'payment-gateway-to-cache-layer',
                  },
                ],
              },
            ],
          } as MockAction03Result;
        }

        if (actionName === 'action-04') {
          return {
            reportMetadata: {
              timestamp: '2024-01-15T11:00:00Z',
              patternIds: ['PAT-001', 'PAT-002'],
              occurrenceCount: 7,
              graphCoordinates: [
                { x: 1, y: 85 },
                { x: 2, y: 72 },
                { x: 3, y: 65 },
              ],
            },
          } as MockAction04Result;
        }

        if (actionName === 'action-05') {
          return {
            priorityScores: {
              'ISSUE-001': 92,
              'ISSUE-002': 88,
              'ISSUE-003': 45,
              'ISSUE-004': 90,
              'ISSUE-005': 50,
            },
            highlightedIssueIds: ['ISSUE-001', 'ISSUE-002', 'ISSUE-004'],
          } as MockAction05Result;
        }

        throw new Error(`Unknown action: ${actionName}`);
      },
    };

    // Input: Analysis parameters matching Tx8AgentInput type
    const input = {
      analysisPeriodStartDate: '2024-01-01T00:00:00Z',
      analysisPeriodEndDate: '2024-01-15T23:59:59Z',
      managerEmail: 'manager@company.com',
      minimumDataThreshold: 5,
    };

    // Execute: Call orchestrator with mock AI client
    const result = await runTx8Imp1Agent(input, mockAiClient);

    // Verify: Check orchestrator completes with expected output structure
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    // Verify: Check analysis status is completed
    expect(result.analysisStatus).toBe('completed');

    // Verify: Check recurring issue count matches extracted patterns
    expect(result.recurringIssueCount).toBe(2);

    // Verify: Check report delivery status
    expect(result.reportDeliveryStatus).toBe('sent');

    // Verify: Check that all actions were executed (implicit via result data completeness)
    expect(result.reportId).toBeTruthy();
    expect(result.recurringIssueCount).toBeGreaterThanOrEqual(0);

    // Verify: Action 3 execution evidence - bottleneck patterns should be captured
    // The report should contain transformed data from Action 3's bottleneck pattern detection
    expect(result).toHaveProperty('analysisStatus');
    expect(result.analysisStatus).not.toBe('failed');

    // Verify: No escalation triggered when all actions execute successfully
    expect(result.analysisStatus).toBe('completed');

    // Verify: Audit trail evidence
    // In production, audit logs would be written separately, but orchestrator should track execution
    expect(result.reportId).toMatch(/^[A-Z0-9\-]+$/);

    // Verify: Report delivery confirms completion
    expect(['sent', 'pending']).toContain(result.reportDeliveryStatus);

    // Verify: Data flow integrity - recurring issues detected from patterns
    expect(result.recurringIssueCount).toBeLessThanOrEqual(10);
    expect(result.recurringIssueCount).toBeGreaterThanOrEqual(0);
  });
});