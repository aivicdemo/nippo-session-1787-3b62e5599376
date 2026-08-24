import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析レポート生成 - TextAnalysisServiceAdapter エラーハンドリング', () => {
  // SCEN-1689
  test('extractKeywords が失敗したとき分析を中止しエラーを返す', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(new Error('API呼び出し失敗')),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          issueKeyword: 'データベース接続エラー',
          occurrenceCount: 3,
          impactScore: 85,
        },
        {
          issueKeyword: 'メモリ不足',
          occurrenceCount: 2,
          impactScore: 70,
        },
      ],
      teamId: 'team-001',
    };

    try {
      await generateWeeklyAnalysisReport(input, mockTextAnalysisServiceAdapter);
      fail('エラーが発生すべきでしたが、正常終了しました');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/課題分析が一時的に利用できません/);
      expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
      expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
      expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
    }
  });
});