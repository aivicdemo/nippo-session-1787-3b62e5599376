import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type DeploymentParticipant, type InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/types';

describe('tx-10-imp-1 orchestrator: Initial Report Data Evaluation for Production Migration', () => {
  // SCEN-2580: [normal] 初回報告データ評価機能 - 提出率90%以上・データ品質スコア80点以上・形式統一度85%以上で複数件の報告がある場合、本格運用への移行判定が真になる
  test('should evaluate initial report data and determine production migration eligibility when all three criteria are met (submission rate >= 90%, data quality >= 80, format uniformity >= 85)', async () => {
    // Arrange: テストデータを準備する
    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    // 10名の参加者を定義
    const participantList: DeploymentParticipant[] = [
      { userId: 'eng-001', role: 'Engineer', email: 'eng001@example.com' },
      { userId: 'eng-002', role: 'Engineer', email: 'eng002@example.com' },
      { userId: 'eng-003', role: 'Engineer', email: 'eng003@example.com' },
      { userId: 'eng-004', role: 'Engineer', email: 'eng004@example.com' },
      { userId: 'eng-005', role: 'Engineer', email: 'eng005@example.com' },
      { userId: 'eng-006', role: 'Engineer', email: 'eng006@example.com' },
      { userId: 'eng-007', role: 'Engineer', email: 'eng007@example.com' },
      { userId: 'eng-008', role: 'Engineer', email: 'eng008@example.com' },
      { userId: 'eng-009', role: 'Engineer', email: 'eng009@example.com' },
      { userId: 'mgr-001', role: 'Manager', email: 'mgr001@example.com' },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    // モック AI クライアントを作成
    const mockAiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'performance', frequency: 3 },
          { keyword: 'integration', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium',
      }),
    };

    // 初回テスト報告データを準備
    // 報告件数: 9件（提出率 9/10 = 90%）
    // 各報告にデータ品質スコア: 80点以上を付与
    // 各報告に形式統一度: 85%以上を付与
    const testReportData = [
      {
        submittedBy: 'eng-001',
        content: 'Yesterday: completed API integration. Today: unit testing. Issues: deployment timing',
        submittedAt: new Date('2024-01-15T08:45:00Z'),
        dataQualityScore: 85,
        formatUniformityScore: 90,
      },
      {
        submittedBy: 'eng-002',
        content: 'Yesterday: database optimization. Today: performance testing. Issues: query performance',
        submittedAt: new Date('2024-01-15T08:50:00Z'),
        dataQualityScore: 82,
        formatUniformityScore: 88,
      },
      {
        submittedBy: 'eng-003',
        content: 'Yesterday: feature development. Today: code review. Issues: none reported',
        submittedAt: new Date('2024-01-15T08:55:00Z'),
        dataQualityScore: 88,
        formatUniformityScore: 92,
      },
      {
        submittedBy: 'eng-004',
        content: 'Yesterday: bug fixes. Today: integration testing. Issues: regression risk',
        submittedAt: new Date('2024-01-15T08:40:00Z'),
        dataQualityScore: 80,
        formatUniformityScore: 85,
      },
      {
        submittedBy: 'eng-005',
        content: 'Yesterday: documentation. Today: API endpoint implementation. Issues: schema validation',
        submittedAt: new Date('2024-01-15T08:52:00Z'),
        dataQualityScore: 84,
        formatUniformityScore: 89,
      },
      {
        submittedBy: 'eng-006',
        content: 'Yesterday: security review. Today: patch deployment. Issues: none',
        submittedAt: new Date('2024-01-15T08:48:00Z'),
        dataQualityScore: 86,
        formatUniformityScore: 91,
      },
      {
        submittedBy: 'eng-007',
        content: 'Yesterday: monitoring setup. Today: log analysis. Issues: disk space alert',
        submittedAt: new Date('2024-01-15T08:53:00Z'),
        dataQualityScore: 81,
        formatUniformityScore: 87,
      },
      {
        submittedBy: 'eng-008',
        content: 'Yesterday: infrastructure review. Today: scaling preparation. Issues: load testing',
        submittedAt: new Date('2024-01-15T08:47:00Z'),
        dataQualityScore: 83,
        formatUniformityScore: 86,
      },
      {
        submittedBy: 'eng-009',
        content: 'Yesterday: stakeholder communication. Today: requirement clarification. Issues: unclear specifications',
        submittedAt: new Date('2024-01-15T08:51:00Z'),
        dataQualityScore: 82,
        formatUniformityScore: 88,
      },
    ];

    // Act: 初回報告データ評価機能を呼び出す
    const result: Tx10AgentOutput = await runTx10Imp1Agent(input, mockAiClient);

    // Assert: 3つの評価指標がすべて満たされていることを確認
    // 1. 提出率が90%以上であることを確認
    const submissionCount = testReportData.length;
    const totalParticipants = participantList.length;
    const submissionRate = (submissionCount / totalParticipants) * 100;
    expect(submissionRate).toBe(90);
    expect(result.initialReportAnalysis.submissionRate).toBe(90);

    // 2. データ品質スコアの平均値が80点以上であることを確認
    const dataQualityScores = testReportData.map((r) => r.dataQualityScore);
    const averageDataQualityScore = dataQualityScores.reduce((sum, score) => sum + score, 0) / dataQualityScores.length;
    expect(averageDataQualityScore).toBe(83.44444444444444);
    expect(result.initialReportAnalysis.dataQualityScore).toBeGreaterThanOrEqual(80);
    expect(result.initialReportAnalysis.dataQualityScore).toBe(83.44444444444444);

    // 3. 形式統一度の平均値が85%以上であることを確認
    const formatUniformityScores = testReportData.map((r) => r.formatUniformityScore);
    const averageFormatUniformityScore = formatUniformityScores.reduce((sum, score) => sum + score, 0) / formatUniformityScores.length;
    expect(averageFormatUniformityScore).toBe(88.66666666666667);
    expect(result.initialReportAnalysis.formatUniformityScore).toBeGreaterThanOrEqual(85);
    expect(result.initialReportAnalysis.formatUniformityScore).toBe(88.66666666666667);

    // 4. 本格運用への移行判定が真になることを確認
    expect(result.onboardingApprovalStatus.isApproved).toBe(true);
    expect(result.onboardingApprovalStatus.canProceedToProductionDeployment).toBe(true);

    // 5. 訓練資料が生成されていることを確認
    expect(result.trainingMaterials).toBeDefined();
    expect(Array.isArray(result.trainingMaterials)).toBe(true);
    expect(result.trainingMaterials.length).toBeGreaterThan(0);

    // 6. 導入スケジュールが生成されていることを確認
    expect(result.deploymentSchedule).toBeDefined();
    expect(result.deploymentSchedule.startDate).toBeDefined();
    expect(result.deploymentSchedule.productionStartDate).toBeDefined();

    // 7. AI クライアントの呼び出しが適切に行われたことを確認
    expect(mockAiClient.extractKeywords).toHaveBeenCalled();
    expect(mockAiClient.assessImpactScore).toHaveBeenCalled();
  });
});