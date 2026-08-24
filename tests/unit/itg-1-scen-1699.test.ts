import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type TextAnalysisServiceAdapter } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析レポート生成 - データ品質スコア下限エラーハンドリング', () => {
  // SCEN-1699: [edge] 週次課題傾向分析フロー - データ品質スコアが許容下限より1ポイント低い場合、分析をスキップして警告を発行する
  test('データ品質スコア59（許容下限60より1ポイント低い）の場合、分析処理をスキップし警告ログを記録', async () => {
    // Arrange
    const mockAnalysisStartDate = new Date('2024-01-08T00:00:00Z');
    const mockAnalysisEndDate = new Date('2024-01-14T23:59:59Z');
    const mockTargetTeamIds = ['team-001', 'team-002'];
    const mockMinimumQualityScore = 60;
    const mockActualQualityScore = 59;

    const mockTextAnalysisAdapter: Partial<TextAnalysisServiceAdapter> = {
      assessImpactScore: jest.fn().mockResolvedValue(mockActualQualityScore),
      extractKeywords: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockLogRecords: Array<{ message: string; severity: string }> = [];

    const mockLoggerFn = jest.fn((message: string, severity: string = 'warning') => {
      mockLogRecords.push({ message, severity });
    });

    const mockWeeklyExtractionRequest: WeeklyExtractionRequest = {
      weekStartDate: mockAnalysisStartDate,
      weekEndDate: mockAnalysisEndDate,
      teamIds: mockTargetTeamIds,
      requestedByUserId: 'user-001',
    };

    const mockAggregatedReports = [
      {
        reportDate: new Date('2024-01-08T09:00:00Z'),
        reportCount: 5,
        submittedByUserIds: ['user-a', 'user-b', 'user-c', 'user-d', 'user-e'],
        challengeItems: ['データ抽出の遅延', '検証バグ発生', 'API 連携エラー'],
      },
      {
        reportDate: new Date('2024-01-09T09:00:00Z'),
        reportCount: 5,
        submittedByUserIds: ['user-a', 'user-b', 'user-c', 'user-d', 'user-e'],
        challengeItems: ['検証バグ発生', 'パフォーマンス問題'],
      },
    ];

    // Act
    const result = await extractWeeklyReportData(
      mockWeeklyExtractionRequest,
      mockTextAnalysisAdapter as TextAnalysisServiceAdapter,
      mockAggregatedReports,
      mockMinimumQualityScore,
      mockLoggerFn
    );

    // Assert
    // 1. 分析のスキップ判定が true になっていることを検証
    expect(result.analysisSkipped).toBe(true);

    // 2. システム内部ログに警告レコードが記録されていることを確認
    const qualityErrorLog = mockLogRecords.find((log) =>
      /データ品質スコア下限エラー/.test(log.message)
    );
    expect(qualityErrorLog).toBeDefined();
    expect(qualityErrorLog?.message).toMatch(/スコア 59 < 許容値 60/);
    expect(qualityErrorLog?.severity).toBe('warning');

    // 3. 後続処理（extractKeywords、classifyIssueSeverity など）が呼び出されていないことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();

    // 4. 分析フロー内の後続処理が実行されていないことを確認
    // 期待出力内に課題リストが空またはプレースホルダーになっていることを検証
    expect(result.extractedChallenges).toEqual([]);
    expect(result.reportsByDate).toEqual(mockAggregatedReports);
    expect(result.dataQualityScore).toBe(mockActualQualityScore);

    // 5. assessImpactScore は品質スコア取得のため呼び出されるが、それ以上の処理は無い
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(1);
  });
});