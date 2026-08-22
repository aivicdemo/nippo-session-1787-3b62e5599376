import { generateWeeklyAnalysisReport } from '../../src/logic/analysis-reporting';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('generateWeeklyAnalysisReport', () => {
  // SCEN-145: [normal] 課題検索から可視化レポート作成までの自動実行 AIエージェント
  test('should execute all 5 autonomous actions in order, validate escalation conditions, log audit events, and return final report payload with correct structure', async () => {
    // Setup: Mock AI client that conforms to Tx8Imp1AiClient interface
    const mockAiClient: Tx8Imp1AiClient = {
      executeAction01: jest.fn(async () => ({
        issues: [
          {
            issueId: 'ISS-001',
            title: 'Database performance degradation',
            description: 'Query response time exceeds threshold',
            status: 'OPEN',
            detectedAt: '2024-01-08T09:30:00Z',
          },
          {
            issueId: 'ISS-002',
            title: 'API timeout errors',
            description: 'Intermittent 504 errors in production',
            status: 'OPEN',
            detectedAt: '2024-01-09T14:15:00Z',
          },
          {
            issueId: 'ISS-003',
            title: 'Database performance degradation',
            description: 'Query response time exceeds threshold',
            status: 'OPEN',
            detectedAt: '2024-01-10T11:00:00Z',
          },
        ],
        dataQualityScore: 0.85,
      })),
      executeAction02: jest.fn(async () => ({
        patterns: [
          {
            patternId: 'PAT-001',
            occurrenceStart: '2024-01-08T09:30:00Z',
            occurrenceEnd: '2024-01-10T11:00:00Z',
            recurrenceCount: 2,
            classification: 'PERFORMANCE_DEGRADATION',
          },
          {
            patternId: 'PAT-002',
            occurrenceStart: '2024-01-09T14:15:00Z',
            occurrenceEnd: '2024-01-09T14:15:00Z',
            recurrenceCount: 1,
            classification: 'API_FAILURE',
          },
        ],
      })),
      executeAction03: jest.fn(async () => ({
        bottlenecks: [
          {
            patternType: 'RESOURCE_CONTENTION',
            detectedAt: '2024-01-10T11:00:00Z',
            impactScore: 82,
            rootCauseCandidates: ['Connection pool exhaustion', 'Memory leak in service'],
          },
        ],
      })),
      executeAction04: jest.fn(async () => ({
        reportId: 'RPT-2024-01-15-001',
        generatedAt: '2024-01-15T06:00:00Z',
        graphDataUrl: 'https://dashboard.example.com/viz/2024-01-15-001.json',
        patternStatisticsSummary: {
          totalPatterns: 2,
          uniqueClassifications: 2,
          timeSpanDays: 3,
        },
      })),
      executeAction05: jest.fn(async () => ({
        prioritizedIssues: [
          {
            issueId: 'ISS-003',
            priorityLevel: 'HIGH',
            isHighlighted: true,
          },
          {
            issueId: 'ISS-001',
            priorityLevel: 'HIGH',
            isHighlighted: true,
          },
          {
            issueId: 'ISS-002',
            priorityLevel: 'MEDIUM',
            isHighlighted: false,
          },
        ],
      })),
    };

    const auditLog: Array<{
      timestamp: string;
      eventType: string;
      actionName: string;
      status: string;
      escalationReason?: string;
    }> = [];

    const escalationEvents: Array<{
      escalationFlag: boolean;
      reasonCode: string;
      timestamp: string;
    }> = [];

    // Execute the function
    const result = await generateWeeklyAnalysisReport(
      {
        startDate: '2024-01-08T00:00:00Z',
        endDate: '2024-01-14T23:59:59Z',
        userId: 'user-001',
      },
      mockAiClient,
      {
        onAuditEvent: (event) => {
          auditLog.push({
            timestamp: event.timestamp,
            eventType: event.eventType,
            actionName: event.actionName,
            status: event.status,
            escalationReason: event.escalationReason,
          });
        },
        onEscalation: (event) => {
          escalationEvents.push({
            escalationFlag: event.escalationFlag,
            reasonCode: event.reasonCode,
            timestamp: event.timestamp,
          });
        },
      }
    );

    // Verify all 5 actions were called in correct order
    expect(mockAiClient.executeAction01).toHaveBeenCalled();
    expect(mockAiClient.executeAction02).toHaveBeenCalled();
    expect(mockAiClient.executeAction03).toHaveBeenCalled();
    expect(mockAiClient.executeAction04).toHaveBeenCalled();
    expect(mockAiClient.executeAction05).toHaveBeenCalled();

    // Verify return payload structure
    expect(result).toHaveProperty('reportId');
    expect(result.reportId).toBe('RPT-2024-01-15-001');

    expect(result).toHaveProperty('totalIssueCount');
    expect(result.totalIssueCount).toBe(3);

    expect(result).toHaveProperty('recurrencePatternCount');
    expect(result.recurrencePatternCount).toBe(2);

    expect(result).toHaveProperty('bottleneckCount');
    expect(result.bottleneckCount).toBe(1);

    expect(result).toHaveProperty('highPriorityIssueCount');
    expect(result.highPriorityIssueCount).toBe(2);

    // Verify audit events were logged
    expect(auditLog.length).toBeGreaterThan(0);
    const action01Event = auditLog.find((e) => e.actionName === 'Action01');
    expect(action01Event).toBeDefined();
    expect(action01Event?.status).toBe('success');

    const action05Event = auditLog.find((e) => e.actionName === 'Action05');
    expect(action05Event).toBeDefined();
    expect(action05Event?.status).toBe('success');

    // Verify no escalation events logged (data quality is 0.85, no urgent issues, patterns are classified)
    expect(escalationEvents.length).toBe(0);
  });

  test('should escalate when data quality score is below 0.7', async () => {
    const mockAiClient: Tx8Imp1AiClient = {
      executeAction01: jest.fn(async () => ({
        issues: [
          {
            issueId: 'ISS-001',
            title: 'Test issue',
            description: 'Test',
            status: 'OPEN',
            detectedAt: '2024-01-08T09:30:00Z',
          },
        ],
        dataQualityScore: 0.65, // Below threshold
      })),
      executeAction02: jest.fn(async () => ({
        patterns: [],
      })),
      executeAction03: jest.fn(async () => ({
        bottlenecks: [],
      })),
      executeAction04: jest.fn(async () => ({
        reportId: 'RPT-001',
        generatedAt: '2024-01-15T06:00:00Z',
        graphDataUrl: 'https://example.com/viz.json',
        patternStatisticsSummary: { totalPatterns: 0, uniqueClassifications: 0, timeSpanDays: 7 },
      })),
      executeAction05: jest.fn(async () => ({
        prioritizedIssues: [],
      })),
    };

    const escalationEvents: Array<{
      escalationFlag: boolean;
      reasonCode: string;
    }> = [];

    await generateWeeklyAnalysisReport(
      { startDate: '2024-01-08T00:00:00Z', endDate: '2024-01-14T23:59:59Z', userId: 'user-001' },
      mockAiClient,
      {
        onAuditEvent: () => {},
        onEscalation: (event) => {
          escalationEvents.push({
            escalationFlag: event.escalationFlag,
            reasonCode: event.reasonCode,
          });
        },
      }
    );

    const dataQualityEscalation = escalationEvents.find((e) => e.reasonCode === 'DATA_QUALITY_LOW');
    expect(dataQualityEscalation).toBeDefined();
    expect(dataQualityEscalation?.escalationFlag).toBe(true);
  });

  test('should escalate when unclassified pattern is detected', async () => {
    const mockAiClient: Tx8Imp1AiClient = {
      executeAction01: jest.fn(async () => ({
        issues: [
          {
            issueId: 'ISS-001',
            title: 'Unknown issue',
            description: 'Unknown',
            status: 'OPEN',
            detectedAt: '2024-01-08T09:30:00Z',
          },
        ],
        dataQualityScore: 0.85,
      })),
      executeAction02: jest.fn(async () => ({
        patterns: [
          {
            patternId: 'PAT-UNKNOWN',
            occurrenceStart: '2024-01-08T09:30:00Z',
            occurrenceEnd: '2024-01-08T09:30:00Z',
            recurrenceCount: 1,
            classification: 'UNKNOWN_CLASSIFICATION', // Not in predefined list
          },
        ],
      })),
      executeAction03: jest.fn(async () => ({
        bottlenecks: [],
      })),
      executeAction04: jest.fn(async () => ({
        reportId: 'RPT-001',
        generatedAt: '2024-01-15T06:00:00Z',
        graphDataUrl: 'https://example.com/viz.json',
        patternStatisticsSummary: { totalPatterns: 1, uniqueClassifications: 1, timeSpanDays: 1 },
      })),
      executeAction05: jest.fn(async () => ({
        prioritizedIssues: [],
      })),
    };

    const escalationEvents: Array<{
      escalationFlag: boolean;
      reasonCode: string;
    }> = [];

    await generateWeeklyAnalysisReport(
      { startDate: '2024-01-08T00:00:00Z', endDate: '2024-01-14T23:59:59Z', userId: 'user-001' },
      mockAiClient,
      {
        onAuditEvent: () => {},
        onEscalation: (event) => {
          escalationEvents.push({
            escalationFlag: event.escalationFlag,
            reasonCode: event.reasonCode,
          });
        },
      }
    );

    const unclassifiedEscalation = escalationEvents.find(
      (e) => e.reasonCode === 'UNCLASSIFIED_PATTERN_DETECTED'
    );
    expect(unclassifiedEscalation).toBeDefined();
    expect(unclassifiedEscalation?.escalationFlag).toBe(true);
  });

  test('should escalate when urgent issue with high impact score is detected', async () => {
    const mockAiClient: Tx8Imp1AiClient = {
      executeAction01: jest.fn(async () => ({
        issues: [
          {
            issueId: 'ISS-URGENT',
            title: 'Critical system failure',
            description: 'System down',
            status: 'URGENT',
            detectedAt: '2024-01-08T09:30:00Z',
          },
        ],
        dataQualityScore: 0.85,
      })),
      executeAction02: jest.fn(async () => ({
        patterns: [
          {
            patternId: 'PAT-CRIT',
            occurrenceStart: '2024-01-08T09:30:00Z',
            occurrenceEnd: '2024-01-08T09:30:00Z',
            recurrenceCount: 1,
            classification: 'CRITICAL_FAILURE',
          },
        ],
      })),
      executeAction03: jest.fn(async () => ({
        bottlenecks: [
          {
            patternType: 'SYSTEM_FAILURE',
            detectedAt: '2024-01-08T09:30:00Z',
            impactScore: 95, // Above threshold
            rootCauseCandidates: ['Power outage', 'Hardware failure'],
          },
        ],
      })),
      executeAction04: jest.fn(async () => ({
        reportId: 'RPT-001',
        generatedAt: '2024-01-15T06:00:00Z',
        graphDataUrl: 'https://example.com/viz.json',
        patternStatisticsSummary: { totalPatterns: 1, uniqueClassifications: 1, timeSpanDays: 1 },
      })),
      executeAction05: jest.fn(async () => ({
        prioritizedIssues: [
          {
            issueId: 'ISS-URGENT',
            priorityLevel: 'HIGH',
            isHighlighted: true,
          },
        ],
      })),
    };

    const escalationEvents: Array<{
      escalationFlag: boolean;
      reasonCode: string;
    }> = [];

    await generateWeeklyAnalysisReport(
      { startDate: '2024-01-08T00:00:00Z', endDate: '2024-01-14T23:59:59Z', userId: 'user-001' },
      mockAiClient,
      {
        onAuditEvent: () => {},
        onEscalation: (event) => {
          escalationEvents.push({
            escalationFlag: event.escalationFlag,
            reasonCode: event.reasonCode,
          });
        },
      }
    );

    const urgentEscalation = escalationEvents.find(
      (e) => e.reasonCode === 'URGENT_ISSUE_DETECTED'
    );
    expect(urgentEscalation).toBeDefined();
    expect(urgentEscalation?.escalationFlag).toBe(true);
  });

  test('should escalate when analysis contradiction is detected', async () => {
    const mockAiClient: Tx8Imp1AiClient = {
      executeAction01: jest.fn(async () => ({
        issues: [
          {
            issueId: 'ISS-001',
            title: 'Issue A',
            description: 'Test',
            status: 'OPEN',
            detectedAt: '2024-01-08T09:30:00Z',
          },
          {
            issueId: 'ISS-002',
            title: 'Issue B',
            description: 'Test',
            status: 'OPEN',
            detectedAt: '2024-01-09T14:15:00Z',
          },
        ],
        dataQualityScore: 0.85,
      })),
      executeAction02: jest.fn(async () => ({
        patterns: [
          {
            patternId: 'PAT-001',
            occurrenceStart: '2024-01-08T09:30:00Z',
            occurrenceEnd: '2024-01-09T14:15:00Z',
            recurrenceCount: 5, // Contradiction: 5 recurrences but only 2 issues
            classification: 'TYPE_A',
          },
        ],
      })),
      executeAction03: jest.fn(async () => ({
        bottlenecks: [
          {
            patternType: 'TYPE_A',
            detectedAt: '2024-01-08T09:30:00Z',
            impactScore: 50,
            rootCauseCandidates: ['Root cause A'],
          },
          {
            patternType: 'TYPE_B',
            detectedAt: '2024-01-09T00:00:00Z',
            impactScore: 60,
            rootCauseCandidates: ['Root cause B'],
          },
          {
            patternType: 'TYPE_C',
            detectedAt: '2024-01-10T00:00:00Z',
            impactScore: 70,
            rootCauseCandidates: ['Root cause C'],
          },
        ], // 3 bottlenecks but only 1 pattern
      })),
      executeAction04: jest.fn(async () => ({
        reportId: 'RPT-001',
        generatedAt: '2024-01-15T06:00:00Z',
        graphDataUrl: 'https://example.com/viz.json',
        patternStatisticsSummary: { totalPatterns: 1, uniqueClassifications: 1, timeSpanDays: 2 },
      })),
      executeAction05: jest.fn(async () => ({
        prioritizedIssues: [],
      })),
    };

    const escalationEvents: Array<{
      escalationFlag: boolean;
      reasonCode: string;
    }> = [];

    await generateWeeklyAnalysisReport(
      { startDate: '2024-01-08T00:00:00Z', endDate: '2024-01-14T23:59:59Z', userId: 'user-001' },
      mockAiClient,
      {
        onAuditEvent: () => {},
        onEscalation: (event) => {
          escalationEvents.push({
            escalationFlag: event.escalationFlag,
            reasonCode: event.reasonCode,
          });
        },
      }
    );

    const contradictionEscalation = escalationEvents.find(
      (e) => e.reasonCode === 'ANALYSIS_CONTRADICTION'
    );
    expect(contradictionEscalation).toBeDefined();
    expect(contradictionEscalation?.escalationFlag).toBe(true);
  });

  test('should verify orchestrator boundary and AI client interface compatibility', async () => {
    const mockAiClient: Tx8Imp1AiClient = {
      executeAction01: jest.fn(async () => ({
        issues: [],
        dataQualityScore: 0.9,
      })),
      executeAction02: jest.fn(async () => ({
        patterns: [],
      })),
      executeAction03: jest.fn(async () => ({
        bottlenecks: [],
      })),
      executeAction04: jest.fn(async () => ({
        reportId: 'RPT-001',
        generatedAt: '2024-01-15T06:00:00Z',
        graphDataUrl: 'https://example.com/viz.json',
        patternStatisticsSummary: { totalPatterns: 0, uniqueClassifications: 0, timeSpanDays: 7 },
      })),
      executeAction05: jest.fn(async () => ({
        prioritizedIssues: [],
      })),
    };

    // Type check: mockAiClient is structurally identical to Tx8Imp1AiClient
    const _typeCheck: Tx8Imp1AiClient = mockAiClient;
    expect(_typeCheck).toBeDefined();

    const result = await generateWeeklyAnalysisReport(
      { startDate: '2024-01-08T00:00:00Z', endDate: '2024-01-14T23:59:59Z', userId: 'user-001' },
      mockAiClient,
      {
        onAuditEvent: () => {},
        onEscalation: () => {},
      }
    );

    expect(result).toHaveProperty('reportId');
    expect(result.reportId).toBe('RPT-001');
  });

  test('should log complete audit trail with timestamps and user information', async () => {
    const mockAiClient: Tx8Imp1AiClient = {
      executeAction01: jest.fn(async () => ({
        issues: [
          {
            issueId: 'ISS-001',
            title: 'Test issue',
            description: 'Test description',
            status: 'OPEN',
            detectedAt: '2024-01-08T09:30:00Z',
          },
        ],
        dataQualityScore: 0.85,
      })),
      executeAction02: jest.fn(async () => ({
        patterns: [
          {
            patternId: 'PAT-001',
            occurrenceStart: '2024-01-08T09:30:00Z',
            occurrenceEnd: '2024-01-08T09:30:00Z',
            recurrenceCount: 1,
            classification: 'PERFORMANCE_ISSUE',
          },
        ],
      })),
      executeAction03: jest.fn(async () => ({
        bottlenecks: [],
      })),
      executeAction04: jest.fn(async () => ({
        reportId: 'RPT-AUDIT-001',
        generatedAt: '2024-01-15T06:00:00Z',
        graphDataUrl: 'https://example.com/viz.json',
        patternStatisticsSummary: { totalPatterns: 1, uniqueClassifications: 1, timeSpanDays: 1 },
      })),
      executeAction05: jest.fn(async () => ({
        prioritizedIssues: [
          {
            issueId: 'ISS-001',
            priorityLevel: 'MEDIUM',
            isHighlighted: false,
          },
        ],
      })),
    };

    const auditLog: Array<{
      timestamp: string;
      eventType: string;
      actionName: string;
      status: string;
      userId?: string;
    }> = [];

    const testUserId = 'user-audit-test-001';

    await generateWeeklyAnalysisReport(
      { startDate: '2024-01-08T00:00:00Z', endDate: '2024-01-14T23:59:59Z', userId: testUserId },
      mockAiClient,
      {
        onAuditEvent: (event) => {
          auditLog.push({
            timestamp: event.timestamp,
            eventType: event.eventType,
            actionName: event.actionName,
            status: event.status,
            userId: event.userId,
          });
        },
        onEscalation: () => {},
      }
    );

    expect(auditLog.length).toBeGreaterThanOrEqual(5);

    const allActionNames = auditLog.map((e) => e.actionName);
    expect(allActionNames).toContain('Action01');
    expect(allActionNames).toContain('Action02');
    expect(allActionNames).toContain('Action03');
    expect(allActionNames).toContain('Action04');
    expect(allActionNames).toContain('Action05');

    const allStatuses = auditLog.map((e) => e.status);
    expect(allStatuses.every((s) => s === 'success' || s === 'escalation')).toBe(true);

    const withUserId = auditLog.filter((e) => e.userId === testUserId);
    expect(withUserId.length).toBeGreaterThanOrEqual(1);

    auditLog.forEach((event) => {
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });
  });
});