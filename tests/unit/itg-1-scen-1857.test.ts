import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AgentInput, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('月次課題傾向分析レポート生成 - データ抽出エラー時の再試行ロジック', () => {
  // SCEN-1857
  test('再試行フラグがfalseの場合、extractKeywordsエラー時に即座にエラーをスローする', async () => {
    const managerUserId = 'manager-001';
    const targetMonth = '2024-01';
    const triggerTimestamp = new Date('2024-02-01T09:00:00Z');
    const includeDetailedAnalysis = true;

    const input: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis,
    };

    const mockAiClient: Tx7Imp1AiClient = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error('API接続エラー: テキスト解析サービスに接続できません')
      ),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 75 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' }),
      generateBottleneckAnalysis: jest.fn().mockResolvedValue({
        timeSeriesData: [],
        improvementTrend: 'stable',
        recurringIssuePattern: [],
      }),
      calculateTeamMetrics: jest.fn().mockResolvedValue({
        resolutionSpeed: 2.5,
        submissionRate: 0.92,
        recurrenceRate: 0.08,
      }),
      compileMonthlyReport: jest.fn().mockResolvedValue({
        reportId: 'report-20240201-001',
        analysisResultSummary: {
          topPriorityChallenges: [],
          performanceMetrics: {
            resolutionSpeed: 2.5,
            submissionRate: 0.92,
            recurrenceRate: 0.08,
          },
          bottleneckTrend: {
            timeSeriesData: [],
            improvementTrend: 'stable',
            recurringIssuePattern: [],
          },
        },
      }),
      sendReportToManager: jest.fn().mockResolvedValue({
        emailSentTo: ['manager@example.com'],
        deliveryStatus: 'success',
      }),
    };

    await expect(() =>
      runTx7Imp1Agent(input, mockAiClient, { retryEnabled: false })
    ).rejects.toThrow(/課題キーワード抽出失敗/);
  });
});