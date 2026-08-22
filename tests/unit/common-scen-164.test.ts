import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { getDashboardData } from '../../src/logic/dashboard-display';

describe('getDashboardData - SCEN-164', () => {
  test('SCEN-164: getDashboardData detects recurring issue patterns with high confidence and passes to next action', async () => {
    const mockReportData = [
      {
        date: '2024-01-10',
        memberId: 'member-001',
        teamId: 'team-a',
        issues: [
          {
            title: 'API応答遅延',
            severity: 'high',
            description: 'Database query timeout',
            detectedAt: '2024-01-10T09:30:00Z',
          },
        ],
      },
      {
        date: '2024-01-17',
        memberId: 'member-002',
        teamId: 'team-a',
        issues: [
          {
            title: 'API応答遅延',
            severity: 'high',
            description: 'Cache layer performance degradation',
            detectedAt: '2024-01-17T10:15:00Z',
          },
        ],
      },
      {
        date: '2024-01-24',
        memberId: 'member-001',
        teamId: 'team-a',
        issues: [
          {
            title: 'API応答遅延',
            severity: 'high',
            description: 'Load balancer routing issue',
            detectedAt: '2024-01-24T11:45:00Z',
          },
        ],
      },
      {
        date: '2024-01-25',
        memberId: 'member-003',
        teamId: 'team-b',
        issues: [
          {
            title: 'Database connection pool exhausted',
            severity: 'medium',
            description: 'Connection limit reached',
            detectedAt: '2024-01-25T14:20:00Z',
          },
        ],
      },
    ];

    const mockAiResponse = {
      recurrencePatterns: [
        {
          issueTitle: 'API応答遅延',
          detectionDates: ['2024-01-10', '2024-01-17', '2024-01-24'],
          frequency: 'weekly',
          rootCauseHypothesis: 'キャッシュリセット周期と連動',
          riskLevel: 'high',
        },
      ],
      confidenceScore: 0.92,
    };

    const mockAiClient = {
      analyzeRecurrencePatterns: jest.fn().mockResolvedValue(mockAiResponse),
    };

    const contextWithPreviousActions = {
      aggregatedReportData: mockReportData,
      extractedIssues: mockReportData.flatMap((report) =>
        report.issues.map((issue) => ({
          ...issue,
          reportDate: report.date,
          memberId: report.memberId,
          teamId: report.teamId,
        }))
      ),
      prioritizedIssues: [
        {
          issueTitle: 'API応答遅延',
          priority: 1,
          affectedTeams: ['team-a'],
          frequencyCount: 3,
        },
        {
          issueTitle: 'Database connection pool exhausted',
          priority: 2,
          affectedTeams: ['team-b'],
          frequencyCount: 1,
        },
      ],
      proposedMeasures: [],
      analysisReport: null,
      recurrencePatterns: null,
      auditEvents: [
        {
          actionId: 'action-01',
          timestamp: '2024-01-25T15:00:00Z',
          description: 'Aggregated report data from all members',
        },
        {
          actionId: 'action-02',
          timestamp: '2024-01-25T15:05:00Z',
          description: 'Extracted issues from aggregated reports',
        },
        {
          actionId: 'action-03',
          timestamp: '2024-01-25T15:10:00Z',
          description: 'Prioritized issues by severity and impact',
        },
        {
          actionId: 'action-04',
          timestamp: '2024-01-25T15:15:00Z',
          description: 'Analyzed issue trends over time',
        },
      ],
    };

    const result = await getDashboardData(
      contextWithPreviousActions,
      mockAiClient as any
    );

    expect(result).toBeDefined();
    expect(result.recurrencePatterns).toBeDefined();
    expect(Array.isArray(result.recurrencePatterns)).toBe(true);
    expect(result.recurrencePatterns.length).toBe(1);

    const detectedPattern = result.recurrencePatterns[0];

    expect(detectedPattern.issueTitle).toBe('API応答遅延');
    expect(Array.isArray(detectedPattern.detectionDates)).toBe(true);
    expect(detectedPattern.detectionDates).toEqual([
      '2024-01-10',
      '2024-01-17',
      '2024-01-24',
    ]);
    expect(detectedPattern.detectionDates.length).toBe(3);

    expect(detectedPattern.frequency).toBe('weekly');
    expect(['daily', 'weekly', 'monthly']).toContain(detectedPattern.frequency);

    expect(detectedPattern.rootCauseHypothesis).toBe('キャッシュリセット周期と連動');
    expect(typeof detectedPattern.rootCauseHypothesis).toBe('string');
    expect(detectedPattern.rootCauseHypothesis.length).toBeGreaterThan(0);

    expect(detectedPattern.riskLevel).toBe('high');
    expect(['low', 'medium', 'high']).toContain(detectedPattern.riskLevel);

    expect(detectedPattern.confidenceScore).toBe(0.92);
    expect(typeof detectedPattern.confidenceScore).toBe('number');
    expect(detectedPattern.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(detectedPattern.confidenceScore).toBeLessThanOrEqual(1);

    const action05AuditEntry = result.auditEvents.find(
      (event) => event.actionId === 'action-05'
    );
    expect(action05AuditEntry).toBeDefined();
    expect(action05AuditEntry.timestamp).toBeDefined();
    expect(typeof action05AuditEntry.timestamp).toBe('string');

    expect(action05AuditEntry.detectedPatternCount).toBe(1);
    expect(typeof action05AuditEntry.inputDataHash).toBe('string');

    expect(
      action05AuditEntry.description || ''
    ).toMatch(/initial confirmation required by division head/);

    expect(result.recurrencePatterns).toBeDefined();
    expect(result.proposedMeasures).toBeDefined();
    expect(Array.isArray(result.proposedMeasures)).toBe(true);
  });
});