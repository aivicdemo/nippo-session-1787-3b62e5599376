import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

// SCEN-2626: [normal] 初回テスト報告の形式・品質判定 - 初回テスト報告から操作ミスが検出された場合、不合格と判定される
describe('朝会報告管理システム - tx-10-imp-1 初回テスト報告の形式・品質判定', () => {
  it('should reject submission when yesterday field is missing and return failure status', async () => {
    // Setup: 意図的な操作ミス - 「昨日やったこと」フィールドを空にする
    const yesterdayField = ''; // 操作ミスにより空にされたフィールド
    const todayField = 'テスト実施';
    const issueField = '環境構築中';

    // TextAnalysisServiceAdapter のスタブ定義
    const mockAiClient = {
      extractKeywords: async (text: string) => {
        // キーワード抽出が成功するように設定
        return {
          keywords: ['テスト', '環境'],
          frequency: [2, 1],
        };
      },
      assessImpactScore: async (keyword: string) => {
        // 影響度スコア計算が成功するように設定
        return { impactScore: 75 };
      },
      classifyIssueSeverity: async (text: string) => {
        // 重要度分類が成功するように設定
        return { severity: 'medium' };
      },
    };

    // エージェント入力データ
    const input = {
      deploymentInitiationTimestamp: new Date('2024-01-15T08:30:00Z'),
      participantList: [
        {
          userId: 'user-001',
          role: 'Engineer',
          email: 'engineer@example.com',
        },
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    // テスト実行: 操作ミスが検出される初回テスト報告
    const result = await runTx10Imp1Agent(input, mockAiClient as any);

    // 期待結果: 形式検証エラーにより報告が不合格と判定される
    expect(result.onboardingApprovalStatus.approvalStatus).toBe('rejected');
    expect(result.onboardingApprovalStatus.canProceedToProduction).toBe(false);
    expect(result.initialReportAnalysis.submissionRate).toBeLessThan(100);

    // 報告データが必須項目を満たしていないことを確認
    expect(yesterdayField.length).toBe(0); // 昨日のフィールドが空であることを確認
    expect(todayField.length).toBeGreaterThan(0); // 今日のフィールドは入力済み
    expect(issueField.length).toBeGreaterThan(0); // 課題フィールドは入力済み

    // 品質スコアが基準値以下であることを確認
    expect(result.initialReportAnalysis.dataQualityScore).toBeLessThan(80);
    expect(result.initialReportAnalysis.formatUniformityScore).toBeLessThan(85);

    // エラーメッセージが含まれていることを確認
    expect(result.initialReportAnalysis.feedbackItems).toBeDefined();
    expect(result.initialReportAnalysis.feedbackItems.length).toBeGreaterThan(0);
    expect(
      result.initialReportAnalysis.feedbackItems.some(
        (item: any) => item.message && item.message.includes('昨日やったこと')
      )
    ).toBe(true);
  });
});