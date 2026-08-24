import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('weekly-issue-analysis', () => {
  // SCEN-2386: [edge] 分析レポート生成 - 集約期間内のデータが0件のとき、空の分析結果を返す
  test('should return empty analysis result when no report data exists within aggregation period', () => {
    const aggregationStartDate = '2026-08-19';
    const aggregationEndDate = '2026-08-19';
    const extractedIssues = [];
    const teamId = 'team-001';

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate,
      aggregationEndDate,
      extractedIssues,
      teamId,
    };

    const result: WeeklyAnalysisReport = generateWeeklyAnalysisReport(input);

    expect(result.aggregationPeriod.startDate).toBe('2026-08-19');
    expect(result.aggregationPeriod.endDate).toBe('2026-08-19');
    expect(result.issueRanking).toEqual([]);
    expect(result.priorityScores).toEqual([]);
    expect(result.recommendedCountermeasures).toEqual([]);
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.generatedAt).toBeDefined();
  });
});