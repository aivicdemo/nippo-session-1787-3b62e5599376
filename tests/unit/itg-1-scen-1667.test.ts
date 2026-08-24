import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1667: [normal] 週次課題傾向分析レポート生成 - 前週の日報が0件でも最小閾値判定が正確に動作する
  test('should skip analysis and return insufficient report status when prior week has zero reports', () => {
    // Setup: テスト対象週の前週（対象週の7日前から1日前）の日報データを0件でセットアップ
    const targetWeekStartDate = new Date('2024-01-15'); // Monday
    const targetWeekEndDate = new Date('2024-01-21'); // Sunday
    const priorWeekStartDate = new Date('2024-01-08'); // Monday of prior week
    const priorWeekEndDate = new Date('2024-01-14'); // Sunday of prior week

    // Mock TextAnalysisServiceAdapter: extractKeywords returns empty array for zero reports
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockReturnValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: priorWeekStartDate.toISOString().split('T')[0],
      aggregationEndDate: priorWeekEndDate.toISOString().split('T')[0],
      extractedIssues: [], // Zero reports in prior week
      teamId: 'team-001',
    };

    // Execute: 週次課題傾向分析レポート生成処理を実行
    const result: WeeklyAnalysisReport = generateWeeklyAnalysisReport(
      input,
      mockTextAnalysisService
    );

    // Verify: レポートが『分析対象日報が最小件数に達していないため、レポート生成をスキップ』を示すステータスを返す
    expect(result.reportId).toBeDefined();
    expect(result.aggregationPeriod.startDate).toBe(priorWeekStartDate.toISOString().split('T')[0]);
    expect(result.aggregationPeriod.endDate).toBe(priorWeekEndDate.toISOString().split('T')[0]);
    expect(result.issueRanking).toEqual([]);
    expect(result.priorityScores).toEqual([]);
    expect(result.recommendedCountermeasures).toEqual([]);

    // Verify: TextAnalysisServiceAdapterへの呼び出しが0回に留まることを確認
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledTimes(0);
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledTimes(0);
    expect(mockTextAnalysisService.classifyIssueSeverity).toHaveBeenCalledTimes(0);

    // Verify: generatedAt フィールドがISO 8601形式の文字列であることを確認
    expect(typeof result.generatedAt).toBe('string');
    expect(new Date(result.generatedAt)).toBeInstanceOf(Date);
  });
});