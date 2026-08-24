import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1680
  test('週次課題傾向分析レポート生成 - 分析対象日報レコード件数が最小閾値未満のとき分析を中止し警告を返す', () => {
    const stubTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-15',
      aggregationEndDate: '2024-01-21',
      extractedIssues: [],
      teamId: 'team-001',
    };

    const sourceReportData = [
      {
        reportDate: new Date('2024-01-15T09:00:00Z'),
        reportContent: 'テスト報告1',
      },
      {
        reportDate: new Date('2024-01-16T09:00:00Z'),
        reportContent: 'テスト報告2',
      },
      {
        reportDate: new Date('2024-01-17T09:00:00Z'),
        reportContent: 'テスト報告3',
      },
      {
        reportDate: new Date('2024-01-18T09:00:00Z'),
        reportContent: 'テスト報告4',
      },
    ];

    const result = generateWeeklyAnalysisReport(
      input,
      sourceReportData,
      stubTextAnalysisServiceAdapter
    );

    expect(result).toEqual({
      code: 'INSUFFICIENT_RECORDS',
      message: '分析対象レコード件数が最小閾値（5件）未満です。現在のレコード件数：4件。分析を中止しました。',
      recordCount: 4,
      requiredMinimum: 5,
    });

    expect(stubTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(stubTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(stubTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});