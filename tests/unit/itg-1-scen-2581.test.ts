import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type {
  Tx10AgentInput,
  Tx10AgentOutput,
  DeploymentParticipant,
  InitialReportAnalysisResult,
} from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1: 初回報告データ評価機能', () => {
  // SCEN-2581: [normal] 初回報告データ評価機能 - 提出率90%以上・データ品質スコア80点以上・形式統一度85%未満の場合、改善フェーズへの戻し判定が真になる
  test('should return needsImprovement true when submission_rate=90%, data_quality_score=80, format_uniformity_score=84%', async () => {
    // Arrange: テスト用入力データを準備
    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    // テストユーザー10名のうち9名が報告を提出（提出率90%）
    const participantList: DeploymentParticipant[] = [
      { userId: 'user_001', role: 'Engineer', email: 'eng001@example.com' },
      { userId: 'user_002', role: 'Engineer', email: 'eng002@example.com' },
      { userId: 'user_003', role: 'Engineer', email: 'eng003@example.com' },
      { userId: 'user_004', role: 'Engineer', email: 'eng004@example.com' },
      { userId: 'user_005', role: 'Engineer', email: 'eng005@example.com' },
      { userId: 'user_006', role: 'Engineer', email: 'eng006@example.com' },
      { userId: 'user_007', role: 'Engineer', email: 'eng007@example.com' },
      { userId: 'user_008', role: 'Engineer', email: 'eng008@example.com' },
      { userId: 'user_009', role: 'Engineer', email: 'eng009@example.com' },
      { userId: 'user_010', role: 'Engineer', email: 'eng010@example.com' },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    // TextAnalysisServiceAdapterをスタブ化
    // データ品質スコア80点、形式統一度84%を返す
    const stubTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['課題A', '課題B'],
        frequency: [3, 2],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('中'),
    };

    const stubNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveredAt: new Date('2024-01-15T09:05:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduledId: 'sched_001' }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
        failureCount: 0,
      }),
    };

    // Act: runTx10Imp1Agentを呼び出し
    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, {
      textAnalysisServiceAdapter: stubTextAnalysisServiceAdapter,
      notificationServiceAdapter: stubNotificationServiceAdapter,
    });

    // Assert: 改善フェーズへの戻し判定が真になることを確認
    // 提出率90% ≧ 90%、データ品質スコア80点 ≧ 80点、形式統一度84% < 85%
    // すべての条件を満たすため、needsImprovement = true
    const analysisResult: InitialReportAnalysisResult = output.initialReportAnalysis;

    expect(analysisResult.submissionRate).toBe(90);
    expect(analysisResult.dataQualityScore).toBe(80);
    expect(analysisResult.formatUniformityScore).toBe(84);

    // 改善フェーズへの戻し判定: 3つの条件をすべて評価
    // 条件1: 提出率 90% ≧ 90% → true
    // 条件2: データ品質スコア 80点 ≧ 80点 → true
    // 条件3: 形式統一度 84% < 85% → true（改善が必要）
    const needsImprovement =
      analysisResult.submissionRate >= 90 &&
      analysisResult.dataQualityScore >= 80 &&
      analysisResult.formatUniformityScore < 85;

    expect(needsImprovement).toBe(true);

    // onboardingApprovalStatus が改善フェーズへの戻しを示す状態であること
    expect(output.onboardingApprovalStatus.requiresImprovementPhase).toBe(true);
    expect(output.onboardingApprovalStatus.readyForProduction).toBe(false);
  });
});