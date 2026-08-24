import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type {
  Tx10AgentInput,
  Tx10AgentOutput,
  DeploymentParticipant,
  InitialReportAnalysisResult,
  OnboardingApprovalStatus,
} from '../../src/agents/tx-10-imp-1/types';

// SCEN-2616: [edge] 初回テスト運用判定機能 - 形式統一度が85%未満のとき本格運用への移行条件を満たさない
describe('tx-10-imp-1: 初回テスト報告データの品質評価と本格運用移行判定', () => {
  test('形式統一度が84.9%の場合、本格運用移行条件を満たさないと判定される', async () => {
    // SCEN-2616
    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');
    const reportingDeadlineTime = '09:00';

    // 10名のエンジニアが参加
    const participantList: DeploymentParticipant[] = [
      { userId: 'eng001', role: 'Engineer', email: 'eng001@example.com' },
      { userId: 'eng002', role: 'Engineer', email: 'eng002@example.com' },
      { userId: 'eng003', role: 'Engineer', email: 'eng003@example.com' },
      { userId: 'eng004', role: 'Engineer', email: 'eng004@example.com' },
      { userId: 'eng005', role: 'Engineer', email: 'eng005@example.com' },
      { userId: 'eng006', role: 'Engineer', email: 'eng006@example.com' },
      { userId: 'eng007', role: 'Engineer', email: 'eng007@example.com' },
      { userId: 'eng008', role: 'Engineer', email: 'eng008@example.com' },
      { userId: 'eng009', role: 'Engineer', email: 'eng009@example.com' },
      { userId: 'eng010', role: 'Engineer', email: 'eng010@example.com' },
    ];

    const preparationDaysRequired = 5;

    // テスト運用判定用の入力
    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    // TextAnalysisServiceAdapterをモック化
    // 形式統一度を84.9%（85%未満）に設定
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['課題A', '課題B', '課題C'],
        frequency: [5, 3, 2],
        confidence: 0.92,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 72,
        waveSpreadScore: 68,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium',
      }),
    };

    // 初回テスト報告データをシミュレート
    // 10名全員が提出（提出率100%）
    // データ品質スコア85点
    // 形式統一度84.9%（85%未満 → 本格運用不可）
    const mockInitialReportAnalysisResult: InitialReportAnalysisResult = {
      submissionRate: 100,
      dataQualityScore: 85,
      formatUniformityScore: 84.9, // 85%未満
      feedbackItems: [
        {
          engineerId: 'eng001',
          feedbackMessage:
            '「昨日やったこと」の記述形式がやや異なります。動詞で始めるようにしてください。',
        },
        {
          engineerId: 'eng003',
          feedbackMessage:
            '「抱えている課題」の記述が曖昧です。具体的な内容を記入してください。',
        },
      ],
    };

    // 初回テスト運用判定機能を実行
    const output: Tx10AgentOutput = await runTx10Imp1Agent(
      input,
      mockTextAnalysisService,
      mockInitialReportAnalysisResult,
    );

    // 期待結果の検証
    // 形式統一度が84.9%（85%未満）なので、本格運用への移行不可と判定される
    expect(output.onboardingApprovalStatus).toEqual({
      approvalStatus: 'rejected',
      reason: '形式統一度が85%未満のため、本格運用への移行条件を満たしていません。',
      continuationMessage:
        '現在テスト運用中です。本格運用移行まで引き続き報告入力にご協力ください。',
      testOperationContinued: true,
    } as OnboardingApprovalStatus);

    // 形式統一度が85%未満の場合、画面に表示されるメッセージを確認
    expect(output.onboardingApprovalStatus.continuationMessage).toContain(
      '現在テスト運用中です',
    );
    expect(output.onboardingApprovalStatus.continuationMessage).toContain(
      '本格運用移行',
    );

    // テスト運用が継続されることを確認
    expect(output.onboardingApprovalStatus.testOperationContinued).toBe(true);

    // 初回報告分析結果が出力に含まれることを確認
    expect(output.initialReportAnalysis).toEqual(mockInitialReportAnalysisResult);

    // 形式統一度がスコア値として正確に記録されていることを確認
    expect(output.initialReportAnalysis.formatUniformityScore).toBe(84.9);

    // 提出率100%、データ品質スコア85点であっても、形式統一度が85%未満なら移行不可
    expect(output.initialReportAnalysis.submissionRate).toBe(100);
    expect(output.initialReportAnalysis.dataQualityScore).toBe(85);

    // フィードバック項目が出力に含まれることを確認
    expect(output.initialReportAnalysis.feedbackItems).toHaveLength(2);
    expect(output.initialReportAnalysis.feedbackItems[0]).toHaveProperty(
      'engineerId',
      'eng001',
    );
    expect(output.initialReportAnalysis.feedbackItems[1]).toHaveProperty(
      'engineerId',
      'eng003',
    );

    // 確認メール送信機能が稼働し続けることを確認
    // （テスト運用継続中は確認メール送信が続く）
    expect(output.onboardingApprovalStatus.testOperationContinued).toBe(true);
  });
});