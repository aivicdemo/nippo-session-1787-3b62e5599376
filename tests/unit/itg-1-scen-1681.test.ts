import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析レポート生成', () => {
  // SCEN-1681: [error] 週次課題傾向分析レポート生成 - データ品質スコアが null のとき分析を中止し品質不足警告を返す
  test('should return QUALITY_INSUFFICIENT status when data quality score is null', async () => {
    // TextAnalysisServiceAdapterのモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'パフォーマンス問題', frequency: 3 },
          { keyword: 'API連携エラー', frequency: 2 },
          { keyword: 'DB応答遅延', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(null), // データ品質スコアがnullを返すよう設定
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    // 分析対象期間（過去7日間）の日報データを複数件用意
    const analysisStartDate = '2024-01-08';
    const analysisEndDate = '2024-01-14';

    const extractedIssuesData = [
      {
        keyword: 'パフォーマンス問題',
        occurrenceCount: 3,
        impactScore: 85,
        severity: 'high',
      },
      {
        keyword: 'API連携エラー',
        occurrenceCount: 2,
        impactScore: 75,
        severity: 'high',
      },
      {
        keyword: 'DB応答遅延',
        occurrenceCount: 2,
        impactScore: 65,
        severity: 'medium',
      },
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: analysisStartDate,
      aggregationEndDate: analysisEndDate,
      extractedIssues: extractedIssuesData,
      teamId: 'team-001',
    };

    // 分析実行メソッドを呼び出す
    const result = await generateWeeklyAnalysisReport(
      input,
      mockTextAnalysisServiceAdapter
    );

    // 戻り値のレスポンスオブジェクトを検査
    // (1) status が 'QUALITY_INSUFFICIENT' である
    expect(result.status).toBe('QUALITY_INSUFFICIENT');

    // (2) errorCode が 'NULL_DATA_QUALITY_SCORE' である
    expect(result.errorCode).toBe('NULL_DATA_QUALITY_SCORE');

    // (3) message に「データ品質スコアが取得できないため、分析を中止しました」と明記されている
    expect(result.message).toMatch(/データ品質スコア/);
    expect(result.message).toMatch(/中止/);

    // (4) analysisResult は null または空オブジェクトである
    expect(result.analysisResult).toBeNull();

    // (5) warningLevel が 'HIGH' である
    expect(result.warningLevel).toBe('HIGH');

    // 分析処理は途中で打ち切られていることを確認
    // assessImpactScoreが呼ばれていないことで、後続のロジックが実行されていないことを確認
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
  });
});