import { submitDailyReport } from '../../src/logic/report-submission';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/report-submission';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2022
  test('対策案の必須項目検証 - 同一の対策案と実行計画を複数回検証しても、毎回同じ検証結果が返される', () => {
    // テストデータの準備
    const countermeasureId = 'CTR-001';
    const issue = 'サーバー応答遅延';
    const countermeasureContent = 'キャッシュ層を追加';
    const executionPlanStart = '2026-08-25';
    const executionPlanEnd = '2026-09-01';

    // モック化されたTextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['サーバー', '応答', '遅延'],
        frequency: [5, 3, 4],
      }),
      assessImpactScore: jest.fn().mockReturnValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue({
        severity: '中',
        impactScore: 75,
        status: 'VALIDATED',
      }),
    };

    // エンジニアIDなどの必須入力
    const engineerId = 'ENG-001';
    const yesterdayAccomplishment = '日報送信機能のテストコード作成完了';
    const todayPlan = '日報集約機能の実装開始';
    const currentChallenges = 'サーバー応答遅延による朝会開始遅延';

    const submitDailyReportInput: SubmitDailyReportInput = {
      engineerId: engineerId,
      yesterdayAccomplishment: yesterdayAccomplishment,
      todayPlan: todayPlan,
      currentChallenges: currentChallenges,
    };

    // 1回目の検証処理実行
    const firstResult: SubmitDailyReportOutput = submitDailyReport(
      submitDailyReportInput,
      mockTextAnalysisServiceAdapter
    );

    // 2回目の検証処理実行
    const secondResult: SubmitDailyReportOutput = submitDailyReport(
      submitDailyReportInput,
      mockTextAnalysisServiceAdapter
    );

    // 3回目の検証処理実行
    const thirdResult: SubmitDailyReportOutput = submitDailyReport(
      submitDailyReportInput,
      mockTextAnalysisServiceAdapter
    );

    // 検証結果の比較: success フラグ
    expect(firstResult.success).toBe(true);
    expect(secondResult.success).toBe(true);
    expect(thirdResult.success).toBe(true);

    // 検証結果の比較: submissionTimestamp の形式確認（ISO 8601形式）
    expect(firstResult.submissionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(secondResult.submissionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(thirdResult.submissionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 検証結果の比較: reportId（各回で異なる可能性があるため存在確認）
    expect(firstResult.reportId).toBeDefined();
    expect(secondResult.reportId).toBeDefined();
    expect(thirdResult.reportId).toBeDefined();
    expect(typeof firstResult.reportId).toBe('string');
    expect(typeof secondResult.reportId).toBe('string');
    expect(typeof thirdResult.reportId).toBe('string');

    // 検証結果の比較: isWithinDeadline（期限内判定）
    expect(firstResult.isWithinDeadline).toBe(secondResult.isWithinDeadline);
    expect(secondResult.isWithinDeadline).toBe(thirdResult.isWithinDeadline);

    // モックの呼び出し回数確認（正確に3回）
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(3);
  });
});