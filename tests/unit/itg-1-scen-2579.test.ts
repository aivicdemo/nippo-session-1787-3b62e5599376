import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1: 初回報告データ評価と本格運用移行判定', () => {
  // SCEN-2579: [normal] 初回報告データ評価機能 - 提出率90%以上・データ品質スコア80点以上・形式統一度85%以上で1件の報告がある場合、本格運用への移行判定が真になる
  test('should set migration_readiness to true when submission_rate >= 90% AND dataQualityScore >= 80 AND formatUniformityScore >= 85', async () => {
    // Arrange: テストデータの構成
    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportingDeadlineTime = '09:00';
    
    const participants = [
      { userId: 'eng_001', role: 'Engineer', email: 'eng001@example.com' },
      { userId: 'eng_002', role: 'Engineer', email: 'eng002@example.com' },
      { userId: 'eng_003', role: 'Engineer', email: 'eng003@example.com' },
      { userId: 'eng_004', role: 'Engineer', email: 'eng004@example.com' },
      { userId: 'eng_005', role: 'Engineer', email: 'eng005@example.com' },
      { userId: 'eng_006', role: 'Engineer', email: 'eng006@example.com' },
      { userId: 'eng_007', role: 'Engineer', email: 'eng007@example.com' },
      { userId: 'eng_008', role: 'Engineer', email: 'eng008@example.com' },
      { userId: 'eng_009', role: 'Engineer', email: 'eng009@example.com' },
      { userId: 'eng_010', role: 'Engineer', email: 'eng010@example.com' },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList: participants,
      preparationDaysRequired: 5,
      reportingDeadlineTime,
    };

    // TextAnalysisServiceAdapterのスタブを注入
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'database_issue', frequency: 2, confidence: 0.95 },
          { keyword: 'performance_degradation', frequency: 1, confidence: 0.85 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 82, // 80点以上を満たす
        teamWaveRange: 'medium',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium',
        confidenceScore: 0.88,
      }),
    };

    // 初回テスト報告データの構造化入力（完全性90%以上を満たす）
    const initialReportData = {
      yesterdayAccomplishment: 'Completed database migration testing and documentation review',
      todayPlan: 'Run performance tests and identify optimization opportunities',
      currentIssues: 'Database query timeout on high-load scenarios needs investigation',
    };

    // Act: runTx10Imp1Agentを実行
    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, mockTextAnalysisAdapter);

    // Assert: 期待値を確認
    // 1. initialReportAnalysisが存在することを確認
    expect(output.initialReportAnalysis).toBeDefined();

    // 2. 提出率が90%以上であることを確認
    expect(output.initialReportAnalysis.submissionRate).toBeGreaterThanOrEqual(90);

    // 3. データ品質スコアが80点以上であることを確認
    expect(output.initialReportAnalysis.dataQualityScore).toBeGreaterThanOrEqual(80);

    // 4. 形式統一度スコアが85%以上であることを確認
    expect(output.initialReportAnalysis.formatUniformityScore).toBeGreaterThanOrEqual(85);

    // 5. onboardingApprovalStatusが存在することを確認
    expect(output.onboardingApprovalStatus).toBeDefined();

    // 6. migration_readinessが真（true）であることを確認
    expect(output.onboardingApprovalStatus.canProceedToProductionMigration).toBe(true);

    // 7. deploymentScheduleが存在し、本運用開始予定日が設定されていることを確認
    expect(output.deploymentSchedule).toBeDefined();
    expect(output.deploymentSchedule.productionStartDate).toBeDefined();

    // 8. trainingMaterialsが配列で存在することを確認
    expect(Array.isArray(output.trainingMaterials)).toBe(true);
    expect(output.trainingMaterials.length).toBeGreaterThan(0);

    // 9. フィードバックアイテムが空配列であることを確認（すべての条件を満たしているため）
    expect(Array.isArray(output.initialReportAnalysis.feedbackItems)).toBe(true);
    expect(output.initialReportAnalysis.feedbackItems.length).toBe(0);

    // 10. 具体的な数値チェック：
    //     - 提出率: 90%以上（1名/10名の場合、条件を満たす報告の完全性評価で90%判定）
    expect(output.initialReportAnalysis.submissionRate).toBe(90);
    
    //     - データ品質スコア: 80点以上（スタブから82を返す）
    expect(output.initialReportAnalysis.dataQualityScore).toBe(82);
    
    //     - 形式統一度: 85%以上（標準形式を満たす報告）
    expect(output.initialReportAnalysis.formatUniformityScore).toBeGreaterThanOrEqual(85);

    // 11. onboardingApprovalStatus.approvalStatus が存在することを確認
    expect(output.onboardingApprovalStatus.approvalStatus).toBeDefined();
  });
});