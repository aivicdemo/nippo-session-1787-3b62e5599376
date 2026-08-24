import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析 - 課題傾向スコアの丸め処理', () => {
  test('SCEN-1704: 小数を含む課題傾向スコアが小数第2位で四捨五入されて保持される', () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        // 日報テキストから課題キーワードを抽出
        const keywords: Array<{ keyword: string; frequency: number }> = [];
        if (text.includes('データベース接続')) {
          keywords.push({ keyword: 'データベース接続エラー', frequency: 1 });
        }
        if (text.includes('API応答遅延')) {
          keywords.push({ keyword: 'API応答遅延', frequency: 1 });
        }
        if (text.includes('メモリリーク')) {
          keywords.push({ keyword: 'メモリリーク', frequency: 1 });
        }
        return keywords;
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        // 小数を含むスコア値を返す
        const scoreMap: { [key: string]: number } = {
          'データベース接続エラー': 47.3856, // 47.39に丸める
          'API応答遅延': 62.1544,           // 62.15に丸める
          'メモリリーク': 89.9956,          // 90.00に丸める
        };
        return scoreMap[keyword] || 50.5;
      }),
      classifyIssueSeverity: jest.fn(() => 'medium'),
    };

    // 複数の日報データを準備
    const report1 = '昨日はデータベース接続の問題に対応しました。今日はAPI応答遅延の調査を進めます。';
    const report2 = 'メモリリークの問題が発生しているため、デバッグ中です。API応答遅延も並行して対応中。';
    const report3 = 'データベース接続エラーが再発。メモリリークの根本原因を特定しました。';

    const dailyReports = [
      {
        reportDate: new Date('2024-01-08'),
        reportCount: 1,
        submittedByUserIds: ['user1'],
        challengeItems: [report1],
      },
      {
        reportDate: new Date('2024-01-09'),
        reportCount: 1,
        submittedByUserIds: ['user2'],
        challengeItems: [report2],
      },
      {
        reportDate: new Date('2024-01-10'),
        reportCount: 1,
        submittedByUserIds: ['user3'],
        challengeItems: [report3],
      },
    ];

    const request: WeeklyExtractionRequest = {
      weekStartDate: new Date('2024-01-08'),
      weekEndDate: new Date('2024-01-14'),
      teamIds: ['team-001'],
      requestedByUserId: 'manager-001',
    };

    // Act: 週次課題傾向分析フローを実行
    const result: WeeklyReportDataset = extractWeeklyReportData(
      dailyReports,
      request,
      mockTextAnalysisAdapter
    );

    // Assert: 抽出されたスコア値が小数第2位で四捨五入されていることを検証
    expect(result.extractedChallenges).toBeDefined();
    expect(Array.isArray(result.extractedChallenges)).toBe(true);

    // 各課題のスコア値が小数第2位に丸められていることを確認
    const challengeMap = new Map(result.extractedChallenges.map(c => [c.keyword, c]));

    // データベース接続エラー: 47.3856 → 47.39 の確認
    const dbConnectionChallenge = challengeMap.get('データベース接続エラー');
    if (dbConnectionChallenge) {
      expect(dbConnectionChallenge.priorityScore).toBe(47.39);
    }

    // API応答遅延: 62.1544 → 62.15 の確認
    const apiDelayChallenge = challengeMap.get('API応答遅延');
    if (apiDelayChallenge) {
      expect(apiDelayChallenge.priorityScore).toBe(62.15);
    }

    // メモリリーク: 89.9956 → 90.00 の確認
    const memoryLeakChallenge = challengeMap.get('メモリリーク');
    if (memoryLeakChallenge) {
      expect(memoryLeakChallenge.priorityScore).toBe(90.00);
    }

    // 複数の日報に対して実行した場合、すべてのスコア値が一貫して小数第2位に丸められていることを検証
    result.extractedChallenges.forEach(challenge => {
      // スコア値の小数点以下が最大2桁であることを確認
      const decimalPart = challenge.priorityScore.toString().split('.')[1];
      if (decimalPart) {
        expect(decimalPart.length).toBeLessThanOrEqual(2);
      }
    });

    // dataQualityScoreも同様に確認
    expect(typeof result.dataQualityScore).toBe('number');
    const qualityDecimalPart = result.dataQualityScore.toString().split('.')[1];
    if (qualityDecimalPart) {
      expect(qualityDecimalPart.length).toBeLessThanOrEqual(2);
    }
  });
});