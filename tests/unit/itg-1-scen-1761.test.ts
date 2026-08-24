import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis', () => {
  // SCEN-1761: [normal] 月次レポート生成データ抽出機能 - 同じ月次レポート生成トリガーで2回実行しても、同じデータセットが確定される
  test('should produce identical dataset when extracting monthly report data twice for the same trigger', async () => {
    // Arrange: 月次レポート生成のための入力パラメータ
    const targetYear = 2026;
    const targetMonth = 1;
    const requestedByUserId = 'user-dept-head-001';

    // 第1回目の抽出
    const firstExtractionResult = await extractMonthlyReportData({
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter: undefined
    });

    // 第2回目の抽出
    const secondExtractionResult = await extractMonthlyReportData({
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter: undefined
    });

    // Assert: レコード件数の比較
    expect(firstExtractionResult.totalReportCount).toBe(10);
    expect(secondExtractionResult.totalReportCount).toBe(10);
    expect(firstExtractionResult.totalReportCount).toBe(secondExtractionResult.totalReportCount);

    // Assert: チーム別報告数の一致確認
    expect(firstExtractionResult.reportsByTeam.length).toBe(secondExtractionResult.reportsByTeam.length);

    // Assert: 各チームのレコード数の一致確認
    firstExtractionResult.reportsByTeam.forEach((firstTeamSummary, index) => {
      const secondTeamSummary = secondExtractionResult.reportsByTeam[index];
      expect(firstTeamSummary.teamId).toBe(secondTeamSummary.teamId);
      expect(firstTeamSummary.reportCount).toBe(secondTeamSummary.reportCount);
      expect(firstTeamSummary.submissionRate).toBe(secondTeamSummary.submissionRate);
    });

    // Assert: 日報IDリストの一致確認
    firstExtractionResult.reportsByTeam.forEach((firstTeamSummary, index) => {
      const secondTeamSummary = secondExtractionResult.reportsByTeam[index];
      expect(firstTeamSummary.reportIds.length).toBe(secondTeamSummary.reportIds.length);
      firstTeamSummary.reportIds.forEach((reportId, reportIndex) => {
        expect(reportId).toBe(secondTeamSummary.reportIds[reportIndex]);
      });
    });

    // Assert: 抽出期間の同一性確認
    expect(firstExtractionResult.extractionPeriodStart).toBe(secondExtractionResult.extractionPeriodStart);
    expect(firstExtractionResult.extractionPeriodEnd).toBe(secondExtractionResult.extractionPeriodEnd);

    // Assert: データ品質スコアの一致確認
    expect(firstExtractionResult.dataQualityScore).toBe(secondExtractionResult.dataQualityScore);

    // Assert: 抽出データセットの内容的一致（タイムスタンプは異なっても許容）
    expect(firstExtractionResult.totalReportCount).toBe(secondExtractionResult.totalReportCount);
    expect(firstExtractionResult.reportsByTeam).toEqual(secondExtractionResult.reportsByTeam);
  });
});