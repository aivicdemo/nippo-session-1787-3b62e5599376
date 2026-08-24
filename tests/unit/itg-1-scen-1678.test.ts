import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析レポート生成 - 分析対象日報レコード件数が 0 のとき', () => {
  // SCEN-1678
  test('分析対象期間内に日報が存在しない場合、分析を中止して警告を返す', () => {
    const analysisStartDate = '2024-01-08';
    const analysisEndDate = '2024-01-14';
    const teamId = 'team-001';

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: analysisStartDate,
      aggregationEndDate: analysisEndDate,
      extractedIssues: [],
      teamId: teamId,
    };

    const textAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const result = generateWeeklyAnalysisReport(input, textAnalysisServiceAdapter);

    expect(result).toEqual({
      reportId: expect.any(String),
      aggregationPeriod: {
        startDate: analysisStartDate,
        endDate: analysisEndDate,
      },
      issueRanking: [],
      priorityScores: [],
      recommendedCountermeasures: [],
      generatedAt: expect.any(String),
      warningMessage: '分析対象期間内に日報レコードが存在しません。分析を中止しました',
      warningStatus: 'WARN_NO_DATA',
    });

    expect(textAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});