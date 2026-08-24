import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成 - AIエージェント自動実行', () => {
  // SCEN-1852
  test('再試行回数が負の数のときエラーになる', async () => {
    const input: Tx7Imp1AgentInput = {
      triggerTimestamp: new Date('2024-01-01T09:00:00Z'),
      targetMonth: '2023-12',
      managerUserId: 'manager-001',
      includeDetailedAnalysis: true,
    };

    const mockAiClient: Tx7Imp1AiClient = {
      callAction01: jest.fn().mockResolvedValue({
        extractedReports: [],
        totalCount: 0,
      }),
      callAction02: jest.fn().mockResolvedValue({
        extractedKeywords: [],
      }),
      callAction03: jest.fn().mockResolvedValue({
        classifiedIssues: [],
      }),
      callAction04: jest.fn().mockResolvedValue({
        prioritizedChallenges: [],
      }),
      callAction05: jest.fn().mockResolvedValue({
        bottleneckAnalysis: {
          timeSeriesData: [],
          improvementTrend: 'stable' as const,
          recurringIssuePattern: [],
        },
      }),
      callAction06: jest.fn().mockResolvedValue({
        performanceMetrics: {
          issueResolutionSpeedDays: 0,
          reportSubmissionRate: 0,
          issueRecurrenceRate: 0,
        },
      }),
      callAction07: jest.fn().mockResolvedValue({
        reportContent: 'test report',
      }),
      callAction08: jest.fn().mockResolvedValue({
        deliveryStatus: 'sent',
      }),
      retryConfig: {
        maxRetries: -1,
        initialDelayMs: 3000,
        backoffMultiplier: 2,
      },
    };

    await expect(
      runTx7Imp1Agent(input, mockAiClient)
    ).rejects.toThrow(/再試行回数/);
  });
});