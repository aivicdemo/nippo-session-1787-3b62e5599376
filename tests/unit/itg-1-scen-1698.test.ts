import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析 - 課題キーワード抽出と優先度付け', () => {
  // SCEN-1698: [edge] 週次課題傾向分析フロー - データ品質スコアがちょうど許容下限に等しい場合、分析を実行する
  test('データ品質スコアが許容下限値（50.0）のとき、課題抽出と優先度付けが正常に完了する', () => {
    // Arrange
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    const teamIds = ['team-001', 'team-002'];
    const requestedByUserId = 'user-dept-head-001';

    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds,
      requestedByUserId,
    };

    // モック化されたTextAnalysisServiceAdapterをシミュレート
    // assessImpactScoreがデータ品質スコア50.0を返す設定
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: 'API連携エラー', frequency: 3 },
          { keyword: 'デプロイ遅延', frequency: 2 },
          { keyword: 'テスト不備', frequency: 1 },
        ],
      }),
      assessImpactScore: jest.fn().mockReturnValue({
        dataQualityScore: 50.0,
        impactScores: [
          { keyword: 'API連携エラー', score: 75 },
          { keyword: 'デプロイ遅延', score: 65 },
          { keyword: 'テスト不備', score: 40 },
        ],
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue({
        classifications: [
          { keyword: 'API連携エラー', severity: 'high' },
          { keyword: 'デプロイ遅延', severity: 'medium' },
          { keyword: 'テスト不備', severity: 'low' },
        ],
      }),
    };

    const mockDailyReportData = [
      {
        reportDate: new Date('2024-01-08T09:00:00Z'),
        reportCount: 10,
        submittedByUserIds: ['user-eng-001', 'user-eng-002', 'user-eng-003', 'user-eng-004', 'user-eng-005',
                             'user-eng-006', 'user-eng-007', 'user-eng-008', 'user-eng-009', 'user-eng-010'],
        challengeItems: ['API連携エラーが発生しました', 'デプロイ予定が遅延'],
      },
      {
        reportDate: new Date('2024-01-09T09:00:00Z'),
        reportCount: 10,
        submittedByUserIds: ['user-eng-001', 'user-eng-002', 'user-eng-003', 'user-eng-004', 'user-eng-005',
                             'user-eng-006', 'user-eng-007', 'user-eng-008', 'user-eng-009', 'user-eng-010'],
        challengeItems: ['API連携エラー継続中', 'テスト不備による再テスト'],
      },
      {
        reportDate: new Date('2024-01-10T09:00:00Z'),
        reportCount: 9,
        submittedByUserIds: ['user-eng-001', 'user-eng-002', 'user-eng-003', 'user-eng-004', 'user-eng-005',
                             'user-eng-006', 'user-eng-007', 'user-eng-008', 'user-eng-009'],
        challengeItems: ['API連携エラー解決'],
      },
    ];

    // Act
    const result: WeeklyReportDataset = extractWeeklyReportData(
      extractionRequest,
      mockDailyReportData,
      mockTextAnalysisAdapter as any
    );

    // Assert
    // 1. 戻り値の構造を検証
    expect(result).toBeDefined();
    expect(result).toHaveProperty('weekRange');
    expect(result).toHaveProperty('totalReportsExtracted');
    expect(result).toHaveProperty('reportsByDate');
    expect(result).toHaveProperty('extractedChallenges');
    expect(result).toHaveProperty('dataQualityScore');

    // 2. 週の範囲が正しく設定されている
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);

    // 3. 抽出された日報の総件数が正しい（10 + 10 + 9 = 29件）
    expect(result.totalReportsExtracted).toBe(29);

    // 4. 日別集計が正しく生成されている
    expect(result.reportsByDate).toHaveLength(3);
    expect(result.reportsByDate[0].reportCount).toBe(10);
    expect(result.reportsByDate[1].reportCount).toBe(10);
    expect(result.reportsByDate[2].reportCount).toBe(9);

    // 5. 各日の報告者IDリストが正しく記録されている
    expect(result.reportsByDate[0].submittedByUserIds).toEqual(
      ['user-eng-001', 'user-eng-002', 'user-eng-003', 'user-eng-004', 'user-eng-005',
       'user-eng-006', 'user-eng-007', 'user-eng-008', 'user-eng-009', 'user-eng-010']
    );

    // 6. 課題項目がテキスト形式で記録されている
    expect(result.reportsByDate[0].challengeItems).toContain('API連携エラーが発生しました');
    expect(result.reportsByDate[0].challengeItems).toContain('デプロイ予定が遅延');

    // 7. 正規化・重複排除済みの課題リストが生成されている
    expect(result.extractedChallenges).toBeDefined();
    expect(result.extractedChallenges.length).toBeGreaterThan(0);

    // 8. 各課題に発生頻度、影響度スコア、優先度ランクが含まれている
    result.extractedChallenges.forEach(challenge => {
      expect(challenge).toHaveProperty('issueKeyword');
      expect(challenge).toHaveProperty('occurrenceCount');
      expect(challenge).toHaveProperty('impactScore');
      expect(challenge).toHaveProperty('priorityRank');
      // 発生頻度は1以上
      expect(challenge.occurrenceCount).toBeGreaterThanOrEqual(1);
      // 影響度スコアは0～100の範囲
      expect(challenge.impactScore).toBeGreaterThanOrEqual(0);
      expect(challenge.impactScore).toBeLessThanOrEqual(100);
      // 優先度ランクは定義された値のいずれか
      expect(['high', 'medium', 'low']).toContain(challenge.priorityRank);
    });

    // 9. データ品質スコアが許容下限値（50.0）に等しい場合、正常に処理される
    expect(result.dataQualityScore).toBe(50.0);

    // 10. モック化されたTextAnalysisServiceAdapterのメソッドが呼び出されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalled();

    // 11. 課題が発生頻度の高い順にランク付けされている
    for (let i = 0; i < result.extractedChallenges.length - 1; i++) {
      expect(result.extractedChallenges[i].occurrenceCount)
        .toBeGreaterThanOrEqual(result.extractedChallenges[i + 1].occurrenceCount);
    }

    // 12. エラーが発生していない（例外がスローされていない）
    expect(result).not.toBeNull();
  });
});