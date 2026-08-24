import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('朝会報告管理システム - 月次課題傾向分析レポート生成', () => {
  test('SCEN-1844: 失敗原因の分類コードが null のときエラーになる', async () => {
    // Arrange
    const triggerTimestamp = new Date('2024-02-01T09:00:00Z');
    const targetMonth = '2024-01';
    const managerUserId = 'user-001';

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    // TextAnalysisServiceAdapter のスタブ化
    // classifyIssueSeverity が分類コード (issueClassificationCode) として null を返す
    const mockAiClient: Tx7Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'performance_issue', frequency: 5 },
          { keyword: 'api_timeout', frequency: 3 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'performance_issue',
        impactScore: 85,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: 'performance_issue',
        issueClassificationCode: null, // 失敗シナリオ: 分類コードが null
        severity: 'high',
      }),
      generateMonthlyReport: jest.fn().mockResolvedValue({
        reportId: 'report-001',
        generatedAt: new Date('2024-02-01T10:00:00Z'),
        topPriorityChallenges: [],
        bottleneckTrend: {
          timeSeriesData: [],
          improvementTrend: 'stable',
          recurringIssuePattern: [],
        },
        teamPerformanceMetrics: {
          teamId: 'team-001',
          issueResolutionSpeed: 0,
          reportSubmissionRate: 0,
          issueRecurrenceRate: 0,
        },
        emailSentTo: [],
        status: 'failed',
      }),
      notifyOnFailure: jest.fn().mockResolvedValue({
        notificationId: 'notif-001',
        sent: true,
      }),
    };

    // Act & Assert
    // 分類コードが null のため、バリデーションエラーがスローされることを期待
    await expect(runTx7Imp1Agent(agentInput, mockAiClient))
      .rejects
      .toThrow(/分類コード/);

    // Verify: classifyIssueSeverity が呼ばれたことを確認
    expect(mockAiClient.classifyIssueSeverity).toHaveBeenCalled();

    // Verify: 失敗通知が記録されたことを確認
    expect(mockAiClient.notifyOnFailure).toHaveBeenCalled();

    // Verify: レポートが生成されないことを確認
    // 例外がスローされたため、generateMonthlyReport は呼ばれないはず
    expect(mockAiClient.generateMonthlyReport).not.toHaveBeenCalled();
  });
});