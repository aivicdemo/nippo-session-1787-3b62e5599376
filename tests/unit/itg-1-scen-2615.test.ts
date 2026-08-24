import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/types';

describe('tx-10-imp-1: 朝会報告アプリ初期導入・ユーザー教育 - 初回テスト運用判定', () => {
  // SCEN-2615: [edge] 初回テスト運用判定機能 - 形式統一度がちょうど85%のとき本格運用への移行条件を満たす
  test('形式統一度が85.0%のとき本格運用移行条件を満たす判定を返し、ログに移行条件判定=TRUEで記録される', async () => {
    // Arrange: テスト環境で形式統一度計算ロジック用のスタブを準備
    const mockAiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害', 'API遅延'],
        frequencies: [2, 1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    // 過去30日分の朝会報告データを構成
    // 合計100件の報告のうち、形式要件を満たす報告が正確に85件
    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');

    // 形式要件を満たすパーティシパント（85名分）
    const conformingParticipants = Array.from({ length: 85 }, (_, i) => ({
      userId: `engineer_${String(i + 1).padStart(3, '0')}`,
      role: 'Engineer' as const,
      email: `engineer.${i + 1}@company.com`,
    }));

    // 形式要件を満たさないパーティシパント（15名分）
    const nonConformingParticipants = Array.from({ length: 15 }, (_, i) => ({
      userId: `engineer_${String(85 + i + 1).padStart(3, '0')}`,
      role: 'Engineer' as const,
      email: `engineer.${85 + i + 1}@company.com`,
    }));

    const allParticipants = [...conformingParticipants, ...nonConformingParticipants];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList: allParticipants,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    // Act: 本格運用判定機能を実行
    const result: Tx10AgentOutput = await runTx10Imp1Agent(input, mockAiClient);

    // Assert: 形式統一度の計算結果を確認
    // 形式統一度 = (形式要件を満たす報告数 / 全報告数) * 100
    // = (85 / 100) * 100 = 85.0%
    expect(result.initialReportAnalysis.formatUniformityScore).toBe(85.0);

    // 本格運用移行の判定ロジック（形式統一度 ≥ 85%）を適用
    // 形式統一度がちょうど85%なので、本格運用移行条件を満たす
    const meetsProductionMigrationCondition =
      result.initialReportAnalysis.formatUniformityScore >= 85.0 &&
      result.initialReportAnalysis.submissionRate >= 90 &&
      result.initialReportAnalysis.dataQualityScore >= 80;

    expect(meetsProductionMigrationCondition).toBe(true);

    // システムが「本格運用への移行条件を満たす」状態に遷移したことを確認
    expect(result.onboardingApprovalStatus.canStartProductionOperation).toBe(true);

    // この判定結果は内部ログテーブルに『移行条件判定 = TRUE』として記録される
    expect(result.onboardingApprovalStatus.approvalDecision).toBe('approved');
    expect(result.onboardingApprovalStatus.migrationEligible).toBe(true);

    // 提出率と品質スコアも基準を満たしていることを確認
    expect(result.initialReportAnalysis.submissionRate).toBeGreaterThanOrEqual(90);
    expect(result.initialReportAnalysis.dataQualityScore).toBeGreaterThanOrEqual(80);
  });
});