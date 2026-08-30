import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { evaluateInitialReportSubmission } from '../../src/logic/adoption-training-management';
import type { InitialReportSubmissionInput, InitialReportEvaluationResult } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 初回テスト報告評価', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-583: [normal] エンジニアの初回テスト報告データを検証し、必須項目・形式・品質基準を満たしているか判定して、合格なら受理、不合格なら修正指示を返す
  test('初回テスト報告が形式・品質基準をすべて満たす場合、合格判定と評価結果を返すこと', async () => {
    const input: InitialReportSubmissionInput = {
      reportId: 'RPT-20250819-001',
      engineerId: 'ENG-12345',
      yesterdayAccomplishment: '昨日は新規機能の単体テスト設計と初期実装を行い、テストケース30件を作成しました。',
      todayPlan: '本日はテスト実装を継続し、統合テスト環境へのデプロイ前の検証を完了予定です。',
      issuesAndConcerns: 'APIの応答遅延が時々発生しており、キャッシュレイヤーの設計見直しが必要な状況です。',
      submissionTimestamp: new Date('2025-01-20T08:00:00Z'),
      trainingPhaseId: 'PHASE-INITIAL-2025',
    };

    const result: InitialReportEvaluationResult = await evaluateInitialReportSubmission(input);

    expect(result.reportId).toBe('RPT-20250819-001');
    expect(result.evaluationStatus).toBe('PASSED');
    expect(result.qualityScore).toBe(85);
    expect(result.formatUnificationDegree).toBe(90);
    expect(result.feedbackItems).toEqual([]);
    expect(result.evaluationTimestamp).toBeInstanceOf(Date);
    expect(result.evaluationTimestamp.getTime()).toBeGreaterThanOrEqual(new Date('2025-01-20T08:00:00Z').getTime());
  });
});