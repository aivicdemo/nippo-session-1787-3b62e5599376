import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析レポート生成 - データ品質チェック', () => {
  test('SCEN-1683: データ品質スコアが閾値を下回るとき分析を中止し品質不足警告を返す', () => {
    // Arrange: テスト用の入力データを準備
    const analysisStartDate = new Date('2024-01-08T00:00:00Z'); // 月曜日
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');   // 日曜日
    
    const testInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          issueKeyword: 'データベース接続エラー',
          occurrenceCount: 5,
          impactScore: 75,
          affectedTeamMembers: ['user001', 'user002', 'user003'],
        },
        {
          issueKeyword: 'テスト環境デプロイ遅延',
          occurrenceCount: 3,
          impactScore: 60,
          affectedTeamMembers: ['user004', 'user005'],
        },
      ],
      teamId: 'team-dev-001',
    };

    // モック化した TextAnalysisServiceAdapter のスタブ
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['データベース接続エラー', 'テスト環境デプロイ遅延'],
        confidenceScores: [0.92, 0.78],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        qualityScore: 45, // 品質スコア 45（閾値 60 以下）
        impactScores: [75, 60],
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classifications: ['high', 'medium'],
      }),
    };

    // Act: レポート生成を実行
    const result = generateWeeklyAnalysisReport(testInput, mockTextAnalysisService);

    // Assert: 品質スコアが閾値を下回るため処理が中止されることを検証
    expect(result).toEqual({
      status: 'QUALITY_THRESHOLD_FAILED',
      qualityScore: 45,
      threshold: 60,
      message: 'データ品質スコアが閾値を下回っているため分析を中止しました',
      reportData: null,
    });

    // 外部サービスが不要に呼ばれていないことを確認
    expect(mockTextAnalysisService.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisService.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});