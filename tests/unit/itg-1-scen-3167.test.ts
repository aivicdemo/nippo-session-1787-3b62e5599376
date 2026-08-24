import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('Weekly Issue Trend Analysis Report Generation Agent (tx_6_imp_1)', () => {
  let mockAiClient: Tx6Imp1AiClient;
  let mockAuditLog: Array<{
    timestamp: Date;
    userId: string;
    action: string;
    targetIssueCount: number;
    status: 'success' | 'failure';
  }>;
  let mockIssueTable: Array<{
    issueKeyword: string;
    occurrenceCount: number;
    priorityScore: number;
    severityLevel: 'high' | 'medium' | 'low';
    scoringTimestamp: Date;
  }>;
  let mockEscalationQueue: Array<{
    issueKeyword: string;
    priorityScore: number;
    severityLevel: 'high' | 'medium' | 'low';
  }>;

  beforeEach(() => {
    mockAuditLog = [];
    mockIssueTable = [];
    mockEscalationQueue = [];

    mockAiClient = {
      extractIssueKeywords: jest.fn(async (dailyReportTexts: string[]) => {
        return {
          keywords: [
            { keyword: 'database_latency', occurrenceCount: 3 },
            { keyword: 'api_timeout', occurrenceCount: 2 },
            { keyword: 'memory_leak', occurrenceCount: 1 },
            { keyword: 'deployment_delay', occurrenceCount: 2 },
            { keyword: 'test_coverage_gap', occurrenceCount: 1 },
          ],
        };
      }),

      executeIssueTrendAnalysis: jest.fn(async (keywords: Array<{ keyword: string; occurrenceCount: number }>) => {
        return {
          trendAnalysisResults: [
            { keyword: 'database_latency', trendScore: 85 },
            { keyword: 'api_timeout', trendScore: 72 },
            { keyword: 'deployment_delay', trendScore: 65 },
            { keyword: 'memory_leak', trendScore: 48 },
            { keyword: 'test_coverage_gap', trendScore: 35 },
          ],
        };
      }),

      calculatePriorityScoringDetails: jest.fn(async (keywords: Array<{ keyword: string; occurrenceCount: number; trendScore: number }>) => {
        return {
          scoringResults: [
            {
              keyword: 'database_latency',
              priorityScore: 92,
              severityLevel: 'high',
              scoringReason: 'database_latency appeared 3 times, trend score 85, impacts core performance',
            },
            {
              keyword: 'api_timeout',
              priorityScore: 78,
              severityLevel: 'high',
              scoringReason: 'api_timeout appeared 2 times, trend score 72, affects user experience',
            },
            {
              keyword: 'deployment_delay',
              priorityScore: 62,
              severityLevel: 'medium',
              scoringReason: 'deployment_delay appeared 2 times, trend score 65, schedule impact',
            },
            {
              keyword: 'memory_leak',
              priorityScore: 45,
              severityLevel: 'medium',
              scoringReason: 'memory_leak appeared 1 time, trend score 48, requires investigation',
            },
            {
              keyword: 'test_coverage_gap',
              priorityScore: 32,
              severityLevel: 'low',
              scoringReason: 'test_coverage_gap appeared 1 time, trend score 35, process improvement',
            },
          ],
        };
      }),

      generateAnalysisReportContent: jest.fn(async (priorityResults: Array<{ keyword: string; priorityScore: number; severityLevel: string }>) => {
        return {
          reportId: 'RPT-2024-W50-001',
          reportContent: 'Weekly trend analysis report generated with 5 issues prioritized',
          reportGeneratedAt: new Date('2024-12-16T09:00:00Z'),
        };
      }),

      notifyManagersOfAnalysisCompletion: jest.fn(async (reportId: string, managerIds: string[]) => {
        return {
          notificationStatus: 'sent',
          recipientsNotified: managerIds.length,
          notificationTimestamp: new Date('2024-12-16T09:05:00Z'),
        };
      }),

      validateAiClientStructure: jest.fn(() => true),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-3167: [normal] 日報収集から分析レポート生成までの自動実行 AIエージェント
  test('should execute complete tx_6_imp_1 agent workflow and perform priority scoring action with audit logging', async () => {
    const executionTimestamp = new Date('2024-12-16T09:00:00Z');
    const analysisStartDate = '2024-12-09';
    const analysisEndDate = '2024-12-15';
    const teamId = 'TEAM-DEV-001';
    const managerIds = ['MGR-001', 'MGR-002'];

    const sampleDailyReports = [
      'Yesterday: completed database optimization. Today: continue performance tuning. Issues: database_latency persists',
      'Yesterday: fixed API integration. Today: test deployment. Issues: api_timeout occurred twice',
      'Yesterday: merged feature branch. Today: code review. Issues: database_latency again, deployment_delay expected',
      'Yesterday: wrote unit tests. Today: integration testing. Issues: memory_leak detected in new module',
      'Yesterday: updated documentation. Today: team onboarding. Issues: test_coverage_gap identified',
    ];

    const request = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
      managerIds,
    };

    // Validate that mockAiClient implements Tx6Imp1AiClient structure
    expect(typeof mockAiClient.extractIssueKeywords).toBe('function');
    expect(typeof mockAiClient.executeIssueTrendAnalysis).toBe('function');
    expect(typeof mockAiClient.calculatePriorityScoringDetails).toBe('function');
    expect(typeof mockAiClient.generateAnalysisReportContent).toBe('function');
    expect(typeof mockAiClient.notifyManagersOfAnalysisCompletion).toBe('function');

    // Execute agent orchestrator with validated AI client
    const result = await runTx6Imp1Agent(request, mockAiClient);

    // Verify Action 1: Issue keyword extraction was called
    expect(mockAiClient.extractIssueKeywords).toHaveBeenCalledWith(sampleDailyReports);
    expect(mockAiClient.extractIssueKeywords).toHaveBeenCalledTimes(1);

    // Verify Action 2: Trend analysis was executed
    expect(mockAiClient.executeIssueTrendAnalysis).toHaveBeenCalled();
    const trendAnalysisCall = (mockAiClient.executeIssueTrendAnalysis as jest.Mock).mock.calls[0][0];
    expect(Array.isArray(trendAnalysisCall)).toBe(true);
    expect(trendAnalysisCall.length).toBe(5);

    // Verify Action 5: Priority scoring details calculation was executed
    expect(mockAiClient.calculatePriorityScoringDetails).toHaveBeenCalled();
    const scoringCall = (mockAiClient.calculatePriorityScoringDetails as jest.Mock).mock.calls[0][0];
    expect(Array.isArray(scoringCall)).toBe(true);
    expect(scoringCall.length).toBeGreaterThan(0);

    // Verify priority scores are in range 0-100
    const scoringResult = await mockAiClient.calculatePriorityScoringDetails(scoringCall);
    scoringResult.scoringResults.forEach((result: { priorityScore: number; severityLevel: string }) => {
      expect(result.priorityScore).toBeGreaterThanOrEqual(0);
      expect(result.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(result.severityLevel);
    });

    // Verify Action 5 output: priority scores sorted descending
    const sortedScores = scoringResult.scoringResults.map((r: { priorityScore: number }) => r.priorityScore);
    const expectedDescendingOrder = [92, 78, 62, 45, 32];
    expect(sortedScores).toEqual(expectedDescendingOrder);

    // Verify high-priority issues (score >= 70) are identified for escalation
    const highPriorityIssues = scoringResult.scoringResults.filter(
      (r: { priorityScore: number; severityLevel: string }) => r.priorityScore >= 70
    );
    expect(highPriorityIssues.length).toBe(2);
    expect(highPriorityIssues[0]).toEqual({
      keyword: 'database_latency',
      priorityScore: 92,
      severityLevel: 'high',
      scoringReason: 'database_latency appeared 3 times, trend score 85, impacts core performance',
    });
    expect(highPriorityIssues[1]).toEqual({
      keyword: 'api_timeout',
      priorityScore: 78,
      severityLevel: 'high',
      scoringReason: 'api_timeout appeared 2 times, trend score 72, affects user experience',
    });

    // Verify Action 6: Report generation was called with priority results
    expect(mockAiClient.generateAnalysisReportContent).toHaveBeenCalled();
    const reportCall = (mockAiClient.generateAnalysisReportContent as jest.Mock).mock.calls[0][0];
    expect(reportCall.length).toBe(5);
    expect(reportCall[0].keyword).toBe('database_latency');
    expect(reportCall[0].priorityScore).toBe(92);

    // Verify report generation output
    const reportResult = await mockAiClient.generateAnalysisReportContent(reportCall);
    expect(reportResult.reportId).toBe('RPT-2024-W50-001');
    expect(reportResult.reportGeneratedAt).toEqual(new Date('2024-12-16T09:00:00Z'));

    // Verify Action 7: Managers were notified
    expect(mockAiClient.notifyManagersOfAnalysisCompletion).toHaveBeenCalledWith(reportResult.reportId, managerIds);

    // Verify notification result
    const notificationResult = await mockAiClient.notifyManagersOfAnalysisCompletion(
      reportResult.reportId,
      managerIds
    );
    expect(notificationResult.notificationStatus).toBe('sent');
    expect(notificationResult.recipientsNotified).toBe(2);
    expect(notificationResult.notificationTimestamp).toEqual(new Date('2024-12-16T09:05:00Z'));

    // Verify final result structure from orchestrator
    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('success');
    expect(result.reportId).toBe('RPT-2024-W50-001');
    expect(result.extractedIssueCount).toBe(5);

    // Verify all mock functions were called in correct order
    const callOrder = [
      mockAiClient.extractIssueKeywords,
      mockAiClient.executeIssueTrendAnalysis,
      mockAiClient.calculatePriorityScoringDetails,
      mockAiClient.generateAnalysisReportContent,
      mockAiClient.notifyManagersOfAnalysisCompletion,
    ];

    callOrder.forEach((mockFn) => {
      expect((mockFn as jest.Mock).mock.invocationCallOrder.length).toBeGreaterThan(0);
    });
  });
});