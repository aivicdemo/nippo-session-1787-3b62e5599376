import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析レポート生成 - データ品質不足時のタイムアウト処理', () => {
  // SCEN-1691: [error] 週次課題傾向分析レポート生成 - レコード件数は閾値以上でもデータ品質が不足し extractKeywords がタイムアウトしたとき分析を中止しエラーを返す
  test('should stop analysis and return ANALYSIS_TIMEOUT error when extractKeywords times out due to insufficient data quality', async () => {
    const aggregationStartDate = '2024-01-08';
    const aggregationEndDate = '2024-01-14';
    const teamId = 'team-001';

    const extractedIssuesData = Array.from({ length: 150 }, (_, index) => ({
      keyword: `issue-keyword-${index}`,
      occurrenceCount: 1,
      impactScore: 30,
    }));

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('ETIMEDOUT'));
            }, 31000);
          })
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportInput: WeeklyAnalysisReportInput = {
      aggregationStartDate,
      aggregationEndDate,
      extractedIssues: extractedIssuesData,
      teamId,
    };

    let caughtError: any;
    try {
      await generateWeeklyAnalysisReport(reportInput, mockTextAnalysisServiceAdapter);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.code).toBe('ANALYSIS_TIMEOUT');
    expect(caughtError.message).toBe('課題分析がタイムアウトしました。データ品質が不十分なため処理を中止します');
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(3);
  });
});