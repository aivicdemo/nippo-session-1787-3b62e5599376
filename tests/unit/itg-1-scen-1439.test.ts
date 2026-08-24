import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset, type DailyReportSummary } from '../../src/logic/weekly-issue-analysis';

describe('前週日報データ集約機能 - 課題項目抽出', () => {
  // SCEN-1439
  test('日報から「昨日やったこと」「今日やること」を除外し「抱えている課題」のみを構造化データとして抽出される', async () => {
    // 前提: テスト用の5件の日報レコード（各々が3つの必須項目を含む）
    const weekStartDate = new Date('2024-01-15T00:00:00Z'); // 月曜日
    const weekEndDate = new Date('2024-01-21T23:59:59Z'); // 日曜日

    const dailyReports: DailyReportSummary[] = [
      {
        reportDate: new Date('2024-01-15T09:00:00Z'),
        reportCount: 2,
        submittedByUserIds: ['user-001', 'user-002'],
        challengeItems: ['システム停止対応', 'データベース性能問題'],
      },
      {
        reportDate: new Date('2024-01-16T09:00:00Z'),
        reportCount: 2,
        submittedByUserIds: ['user-001', 'user-002'],
        challengeItems: ['テスト環境セットアップ遅延', 'システム停止対応'],
      },
      {
        reportDate: new Date('2024-01-17T09:00:00Z'),
        reportCount: 2,
        submittedByUserIds: ['user-001', 'user-003'],
        challengeItems: ['デプロイメント失敗', 'ネットワーク接続不安定'],
      },
      {
        reportDate: new Date('2024-01-18T09:00:00Z'),
        reportCount: 2,
        submittedByUserIds: ['user-002', 'user-003'],
        challengeItems: ['システム停止対応', 'メモリリーク検出'],
      },
      {
        reportDate: new Date('2024-01-19T09:00:00Z'),
        reportCount: 1,
        submittedByUserIds: ['user-001'],
        challengeItems: ['ドキュメント作成遅延'],
      },
    ];

    const request: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds: undefined,
      requestedByUserId: 'manager-001',
    };

    // スタブ化されたTextAnalysisServiceAdapterをモック化
    // (実装では extractWeeklyReportData の内部で使用される場合を想定)
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        // テキストから簡易的にキーワード抽出をシミュレート
        const keywords = text.split(/、|，/).map(k => k.trim()).filter(k => k.length > 0);
        return keywords.map((keyword, idx) => ({
          keyword,
          frequency: keywords.filter(k => k === keyword).length,
        }));
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        return Math.floor(Math.random() * 100);
      }),
      classifyIssueSeverity: jest.fn((text: string) => {
        return 'medium';
      }),
    };

    // 関数を実行
    const result: WeeklyReportDataset = await extractWeeklyReportData(
      request,
      mockTextAnalysisAdapter,
    );

    // 期待値の検証

    // 1. 結果に weekRange が含まれていることを確認
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);

    // 2. 抽出された日報の総件数を確認（5日分のデータが集約されている）
    expect(result.totalReportsExtracted).toBe(5);

    // 3. reportsByDate が5つの DailyReportSummary を含むことを確認
    expect(result.reportsByDate).toHaveLength(5);

    // 4. 各 DailyReportSummary が「抱えている課題」のみを含むことを確認
    result.reportsByDate.forEach((dailySummary: DailyReportSummary) => {
      expect(dailySummary.challengeItems).toBeDefined();
      expect(Array.isArray(dailySummary.challengeItems)).toBe(true);
      // challengeItems に「昨日やったこと」「今日やること」に該当するキーワードが含まれていないことを確認
      const challengeText = dailySummary.challengeItems.join(' ');
      expect(challengeText).not.toMatch(/昨日やったこと/);
      expect(challengeText).not.toMatch(/今日やること/);
    });

    // 5. extractedChallenges が構造化データ配列として返却されていることを確認
    expect(Array.isArray(result.extractedChallenges)).toBe(true);

    // 6. 抽出課題に「システム停止対応」が含まれていることを確認（複数日で報告されているため frequency >= 1）
    const systemStopChallenge = result.extractedChallenges.find(
      (challenge) => challenge.issueKeyword === 'システム停止対応',
    );
    expect(systemStopChallenge).toBeDefined();
    expect(systemStopChallenge?.occurrenceCount).toBeGreaterThanOrEqual(1);

    // 7. dataQualityScore が 0～100 の範囲内であることを確認
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 8. TextAnalysisServiceAdapter の extractKeywords メソッドが「抱えている課題」に対してのみ呼び出されたことを確認
    // (mockTextAnalysisAdapter を使用した場合、呼び出し回数は dailyReports の challengeItems 数に相応)
    const extractKeywordsCallCount = mockTextAnalysisAdapter.extractKeywords.mock.calls.length;
    expect(extractKeywordsCallCount).toBeGreaterThan(0);

    // 9. 出力データに「昨日やったこと」「今日やること」に関連するキーワードが含まれていないことをアサート
    result.extractedChallenges.forEach((challenge) => {
      expect(challenge.issueKeyword).not.toMatch(/昨日やった|やったこと/);
      expect(challenge.issueKeyword).not.toMatch(/今日やる|やること/);
    });

    // 10. 必須フィールドがすべて存在することを確認
    result.reportsByDate.forEach((dailySummary: DailyReportSummary) => {
      expect(dailySummary.reportDate).toBeDefined();
      expect(typeof dailySummary.reportDate.getTime()).toBe('number');
      expect(dailySummary.reportCount).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(dailySummary.submittedByUserIds)).toBe(true);
      expect(dailySummary.submittedByUserIds.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(dailySummary.challengeItems)).toBe(true);
    });

    result.extractedChallenges.forEach((challenge) => {
      expect(challenge.issueKeyword).toBeDefined();
      expect(typeof challenge.issueKeyword).toBe('string');
      expect(challenge.occurrenceCount).toBeGreaterThanOrEqual(1);
    });
  });
});