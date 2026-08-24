import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { Tx6AgentInput, Tx6AgentOutput } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('tx-6-imp-1 orchestrator', () => {
  // SCEN-3172
  test('escalation_required flag triggers human review gate before stakeholder delivery', async () => {
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const analysisStartDate = '2024-01-08';
    const analysisEndDate = '2024-01-14';
    const teamId = 'team-001';

    const input: Tx6AgentInput = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    const mockReports = [
      {
        reporterId: 'engineer-001',
        submittedAt: new Date('2024-01-12T08:15:00Z'),
        challenges: 'API performance degradation affecting customer requests',
      },
      {
        reporterId: 'engineer-002',
        submittedAt: new Date('2024-01-12T08:20:00Z'),
        challenges: 'Database connection timeout recurring since yesterday',
      },
      {
        reporterId: 'engineer-003',
        submittedAt: new Date('2024-01-12T08:25:00Z'),
        challenges: 'Memory leak in production environment',
      },
      {
        reporterId: 'engineer-004',
        submittedAt: new Date('2024-01-12T08:30:00Z'),
        challenges: 'API performance degradation affecting customer requests',
      },
      {
        reporterId: 'engineer-005',
        submittedAt: new Date('2024-01-12T08:35:00Z'),
        challenges: 'Production outage risk',
      },
      {
        reporterId: 'engineer-006',
        submittedAt: new Date('2024-01-12T08:40:00Z'),
        challenges: 'Database connection timeout recurring since yesterday',
      },
      {
        reporterId: 'engineer-007',
        submittedAt: new Date('2024-01-12T08:45:00Z'),
        challenges: 'API response time exceeds SLA',
      },
      {
        reporterId: 'engineer-008',
        submittedAt: new Date('2024-01-12T08:50:00Z'),
        challenges: 'Memory leak in production environment',
      },
      {
        reporterId: 'engineer-009',
        submittedAt: new Date('2024-01-12T08:55:00Z'),
        challenges: 'Data inconsistency issue in analytics pipeline',
      },
      {
        reporterId: 'engineer-010',
        submittedAt: new Date('2024-01-12T09:00:00Z'),
        challenges: 'Production outage risk',
      },
    ];

    const notUnsubmittedReporters: string[] = [];

    const mockExtractedKeywords = [
      { keyword: 'API performance degradation', frequency: 2 },
      { keyword: 'Database connection timeout', frequency: 2 },
      { keyword: 'Memory leak', frequency: 2 },
      { keyword: 'Production outage risk', frequency: 2 },
      { keyword: 'Data inconsistency', frequency: 1 },
    ];

    const mockImpactScores = [
      { keyword: 'API performance degradation', impactScore: 78 },
      { keyword: 'Database connection timeout', impactScore: 75 },
      { keyword: 'Memory leak', impactScore: 88 },
      { keyword: 'Production outage risk', impactScore: 92 },
      { keyword: 'Data inconsistency', impactScore: 55 },
    ];

    const mockSeverityClassifications = [
      { keyword: 'API performance degradation', severity: 'high' as const },
      { keyword: 'Database connection timeout', severity: 'high' as const },
      { keyword: 'Memory leak', severity: 'high' as const },
      { keyword: 'Production outage risk', severity: 'high' as const },
      { keyword: 'Data inconsistency', severity: 'medium' as const },
    ];

    const mockAiClient: Tx6Imp1AiClient = {
      action01_collectReports: jest.fn().mockResolvedValue({
        reports: mockReports,
        unsubmittedReporters: notUnsubmittedReporters,
      }),
      action02_sendReminders: jest.fn().mockResolvedValue({
        sentCount: 0,
        failedCount: 0,
      }),
      action03_extractChallenges: jest.fn().mockResolvedValue({
        extractedKeywords: mockExtractedKeywords,
      }),
      action04_analyzeTrends: jest.fn().mockResolvedValue({
        trendAnalysis: {
          topIssues: mockExtractedKeywords.slice(0, 3),
          categoryDistribution: {
            production: 4,
            dataQuality: 1,
          },
        },
      }),
      action05_scorePriority: jest.fn().mockResolvedValue({
        priorityScores: mockImpactScores,
        severityClassifications: mockSeverityClassifications,
        escalationDetected: true,
        escalationReason: 'High-impact production issues requiring executive review',
      }),
      action06_generateReport: jest.fn().mockResolvedValue({
        reportId: 'report-20240115-001',
        reportContent: {
          period: `${analysisStartDate} to ${analysisEndDate}`,
          topIssues: [
            {
              keyword: 'Production outage risk',
              frequency: 2,
              impactScore: 92,
              severity: 'high',
            },
            {
              keyword: 'Memory leak',
              frequency: 2,
              impactScore: 88,
              severity: 'high',
            },
            {
              keyword: 'API performance degradation',
              frequency: 2,
              impactScore: 78,
              severity: 'high',
            },
          ],
        },
        generatedAt: new Date('2024-01-15T09:30:00Z'),
        status: 'generated_pending_delivery',
      }),
      action07_deliverReport: jest.fn().mockResolvedValue({
        sentAt: null,
        status: 'queued_for_approval',
        approvalRequiredMessage:
          'Executive review required for high-impact production issues',
      }),
    };

    const result: Tx6AgentOutput = await runTx6Imp1Agent(input, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.reportId).toBe('report-20240115-001');
    expect(result.extractedIssueCount).toBe(5);
    expect(result.reportGeneratedAt).toEqual(new Date('2024-01-15T09:30:00Z'));

    expect(result.topPriorityIssues).toHaveLength(3);
    expect(result.topPriorityIssues[0]).toMatchObject({
      issueKeyword: 'Production outage risk',
      occurrenceCount: 2,
      priorityScore: 92,
      priorityRank: 'high',
    });
    expect(result.topPriorityIssues[1]).toMatchObject({
      issueKeyword: 'Memory leak',
      occurrenceCount: 2,
      priorityScore: 88,
      priorityRank: 'high',
    });
    expect(result.topPriorityIssues[2]).toMatchObject({
      issueKeyword: 'API performance degradation',
      occurrenceCount: 2,
      priorityScore: 78,
      priorityRank: 'high',
    });

    expect(result.emailSentAt).toBeNull();

    expect(mockAiClient.action01_collectReports).toHaveBeenCalledWith({
      analysisStartDate,
      analysisEndDate,
      teamId,
    });

    expect(mockAiClient.action02_sendReminders).toHaveBeenCalledWith({
      unsubmittedReporters: notUnsubmittedReporters,
      teamId,
    });

    expect(mockAiClient.action03_extractChallenges).toHaveBeenCalledWith({
      reports: mockReports,
    });

    expect(mockAiClient.action04_analyzeTrends).toHaveBeenCalledWith({
      extractedKeywords: mockExtractedKeywords,
      analysisStartDate,
      analysisEndDate,
    });

    expect(mockAiClient.action05_scorePriority).toHaveBeenCalledWith({
      trendAnalysis: {
        topIssues: mockExtractedKeywords.slice(0, 3),
        categoryDistribution: {
          production: 4,
          dataQuality: 1,
        },
      },
    });

    expect(mockAiClient.action06_generateReport).toHaveBeenCalledWith({
      teamId,
      analysisStartDate,
      analysisEndDate,
      priorityScores: mockImpactScores,
      severityClassifications: mockSeverityClassifications,
      escalationDetected: true,
    });

    expect(mockAiClient.action07_deliverReport).toHaveBeenCalledWith({
      reportId: 'report-20240115-001',
      escalationDetected: true,
      escalationReason: 'High-impact production issues requiring executive review',
      requiresApproval: true,
    });

    expect(result).toHaveProperty('reportId', 'report-20240115-001');
    expect(result).toHaveProperty('executionStatus', 'success');
    expect(result.emailSentAt).toBeNull();
  });
});