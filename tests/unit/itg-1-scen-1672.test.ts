import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析レポート生成 - 日報件数が最小閾値未満', () => {
  test('SCEN-1672: 日報件数が最小閾値未満かつデータ品質が有効なとき分析スキップが返される', () => {
    // Arrange: テスト入力データ
    const analysisInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-15',
      aggregationEndDate: '2024-01-21',
      extractedIssues: [
        {
          issueKeyword: 'ネットワーク遅延',
          occurrenceCount: 2,
          impactScore: 65,
        },
        {
          issueKeyword: 'メモリ不足',
          occurrenceCount: 1,
          impactScore: 45,
        },
      ],
      teamId: 'team-001',
    };

    // Mock TextAnalysisServiceAdapter: 呼び出しが 0 回であることを検証するため、
    // スタブは定義せず、関数内で呼び出されないことをアサーションで確認
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Act: 日報件数が最小閾値未満（4件 < 5件の閾値）のシナリオで生成処理を実行
    const result = generateWeeklyAnalysisReport(
      analysisInput,
      mockTextAnalysisAdapter
    );

    // Assert: 戻り値が分析スキップ結果である
    expect(result.status).toBe('skipped');
    expect(result.reason).toBe('insufficient_report_count');
    expect(result.reportCount).toBe(4);
    expect(result.threshold).toBe(5);
    expect(result.analysisResult).toBeNull();

    // TextAnalysisServiceAdapterが呼び出されていないことを検証
    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});