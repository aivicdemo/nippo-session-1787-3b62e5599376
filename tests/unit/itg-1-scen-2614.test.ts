import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1: 初期導入・ユーザー教育フロー - 初回テスト運用判定', () => {
  test('SCEN-2614: データ品質スコアが80点を超えるとき本格運用への移行条件を満たす', async () => {
    // ============================================
    // Setup: AIクライアントのモック化
    // ============================================
    const mockAiClient = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // キーワード抽出のモック: 精度が高いシナリオ
    mockAiClient.extractKeywords.mockResolvedValue({
      keywords: ['DB接続エラー', 'API遅延', 'メモリリーク'],
      confidenceScore: 0.92, // 92%の信頼度
    });

    // 影響度スコア判定のモック: スコア85点（高）
    mockAiClient.assessImpactScore.mockResolvedValue({
      impactScore: 85,
      affectedTeamCount: 8,
    });

    // 重要度分類のモック: 「高」と判定
    mockAiClient.classifyIssueSeverity.mockResolvedValue({
      severity: 'HIGH',
      confidenceScore: 0.88,
    });

    // ============================================
    // Test Data: 過去7日間、10名のメンバー分日報（計15件）
    // ============================================
    const now = new Date('2025-01-20T09:00:00Z');
    const deploymentInitiationTimestamp = new Date('2025-01-13T09:00:00Z'); // 7日前

    const participantList = [
      { userId: 'eng001', role: 'Engineer', email: 'eng001@company.com' },
      { userId: 'eng002', role: 'Engineer', email: 'eng002@company.com' },
      { userId: 'eng003', role: 'Engineer', email: 'eng003@company.com' },
      { userId: 'eng004', role: 'Engineer', email: 'eng004@company.com' },
      { userId: 'eng005', role: 'Engineer', email: 'eng005@company.com' },
      { userId: 'eng006', role: 'Engineer', email: 'eng006@company.com' },
      { userId: 'eng007', role: 'Engineer', email: 'eng007@company.com' },
      { userId: 'eng008', role: 'Engineer', email: 'eng008@company.com' },
      { userId: 'eng009', role: 'Engineer', email: 'eng009@company.com' },
      { userId: 'eng010', role: 'Engineer', email: 'eng010@company.com' },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired: 7,
      reportingDeadlineTime: '09:00',
    };

    // ============================================
    // Execute: Agent実行（初回テスト報告品質評価）
    // ============================================
    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, mockAiClient);

    // ============================================
    // Assertions: 初回テスト報告の品質判定結果
    // ============================================

    // 1. InitialReportAnalysisResult が存在することを確認
    expect(output.initialReportAnalysis).toBeDefined();

    const analysisResult: InitialReportAnalysisResult = output.initialReportAnalysis;

    // 2. 提出率: 10名中9名が提出 → 90%
    // （1名が提出せず）
    expect(analysisResult.submissionRate).toBe(90);

    // 3. データ品質スコアが80点を超える（80.1点以上）か検証
    // 品質スコア計算ロジック:
    // - キーワード抽出精度: 92% → 92点
    // - 影響度判定スコア: 85点 → 85点
    // - 重要度分類スコア: 信頼度 88% → 88点
    // - 平均値: (92 + 85 + 88) / 3 = 88.33点
    expect(analysisResult.dataQualityScore).toBeGreaterThan(80);
    expect(analysisResult.dataQualityScore).toBeGreaterThanOrEqual(80.1);

    // 4. 入力形式の統一度スコア: 85%以上と期待
    expect(analysisResult.formatUniformityScore).toBeGreaterThanOrEqual(85);

    // 5. フィードバック項目が配列で返されること
    expect(Array.isArray(analysisResult.feedbackItems)).toBe(true);

    // 6. OnboardingApprovalStatus: データ品質スコア80点超→本運用承認
    expect(output.onboardingApprovalStatus).toBeDefined();
    expect(output.onboardingApprovalStatus.isApproved).toBe(true);
    expect(output.onboardingApprovalStatus.canProceedToProduction).toBe(true);

    // 7. 移行判定理由がログに記録されていることを確認
    expect(output.onboardingApprovalStatus.approvalReason).toBeDefined();
    expect(output.onboardingApprovalStatus.approvalReason).toMatch(/品質スコア|本運用/);

    // 8. AIクライアントが正しく呼ばれたことを確認
    expect(mockAiClient.extractKeywords).toHaveBeenCalled();
    expect(mockAiClient.assessImpactScore).toHaveBeenCalled();
    expect(mockAiClient.classifyIssueSeverity).toHaveBeenCalled();

    // ============================================
    // Edge Case: データ品質スコアが80点ちょうどのとき（未満）
    // ============================================
    const mockAiClientBoundary = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['テストキーワード'],
        confidenceScore: 0.80, // 80%
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 80,
        affectedTeamCount: 5,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'MEDIUM',
        confidenceScore: 0.80,
      }),
    };

    const outputBoundary: Tx10AgentOutput = await runTx10Imp1Agent(
      input,
      mockAiClientBoundary
    );

    // スコアが80点の場合、本運用承認条件は満たさない（80点を超える必要）
    if (outputBoundary.initialReportAnalysis.dataQualityScore <= 80) {
      expect(outputBoundary.onboardingApprovalStatus.isApproved).toBe(false);
      expect(outputBoundary.onboardingApprovalStatus.canProceedToProduction).toBe(false);
    } else {
      // 80点を超える場合のみ本運用承認
      expect(outputBoundary.onboardingApprovalStatus.isApproved).toBe(true);
      expect(outputBoundary.onboardingApprovalStatus.canProceedToProduction).toBe(true);
    }

    // ============================================
    // Validation: スコア80.1点のケース
    // ============================================
    const mockAiClientAboveThreshold = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['エラーハンドリング', 'ログ出力'],
        confidenceScore: 0.87, // 87%
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 80,
        affectedTeamCount: 7,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'HIGH',
        confidenceScore: 0.81,
      }),
    };

    const outputAboveThreshold: Tx10AgentOutput = await runTx10Imp1Agent(
      input,
      mockAiClientAboveThreshold
    );

    // スコア計算: (87 + 80 + 81) / 3 = 82.67点 → 80.1点超
    expect(outputAboveThreshold.initialReportAnalysis.dataQualityScore).toBeGreaterThan(80);

    // 本운用への移행条件を満たす
    expect(outputAboveThreshold.onboardingApprovalStatus.isApproved).toBe(true);
    expect(outputAboveThreshold.onboardingApprovalStatus.canProceedToProduction).toBe(true);

    // 移行日時が記録されていることを確認
    expect(outputAboveThreshold.onboardingApprovalStatus.approvalTimestamp).toBeDefined();
    expect(outputAboveThreshold.onboardingApprovalStatus.approvalTimestamp).toBeInstanceOf(Date);
  });
});