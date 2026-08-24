import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('weekly-issue-analysis: extractWeeklyReportData', () => {
  // SCEN-1465: [edge] 前週日報データ集約・課題抽出機能 - 前週期間が8日間に延長された場合、7日分を超過したデータは除外される
  test('should exclude data exceeding 7-day span when 8-day aggregation period is applied', () => {
    // Setup: 内部時刻を「月曜日 00:00」に設定
    const referenceDate = new Date('2024-01-15T00:00:00Z'); // 月曜日
    const now = referenceDate;

    // 前々週火曜日（8日前）
    const dayBefore8 = new Date('2024-01-08T12:00:00Z');
    // 前々週水曜日（7日前）
    const dayBefore7 = new Date('2024-01-09T12:00:00Z');
    // 前週月曜日（1日前）
    const dayBefore1 = new Date('2024-01-14T12:00:00Z');

    // 8日間の集約期間を設定（前々週火曜日～前週月曜日）
    const weekStartDate = new Date('2024-01-08T00:00:00Z'); // 前々週火曜日
    const weekEndDate = new Date('2024-01-14T23:59:59Z'); // 前週月曜日

    // TextAnalysisServiceAdapterをスタブ化
    const stubTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(() => Promise.resolve([
        { keyword: '遅延', frequency: 1, confidenceScore: 0.95 },
      ])),
      assessImpactScore: jest.fn(() => Promise.resolve(75)),
      classifyIssueSeverity: jest.fn(() => Promise.resolve('high')),
    };

    // モック日報データを準備
    const mockDailyReports = [
      {
        reportId: 'report-8days-ago',
        reportDate: dayBefore8,
        submittedByUserId: 'user-001',
        yesterdayAccomplishment: 'completed feature X',
        todayPlan: 'start feature Y',
        challengeItems: 'deployment delay occurred',
      },
      {
        reportId: 'report-7days-ago',
        reportDate: dayBefore7,
        submittedByUserId: 'user-002',
        yesterdayAccomplishment: 'fixed bug in module A',
        todayPlan: 'test module B',
        challengeItems: 'found critical bug in integration',
      },
      {
        reportId: 'report-1day-ago',
        reportDate: dayBefore1,
        submittedByUserId: 'user-003',
        yesterdayAccomplishment: 'completed testing',
        todayPlan: 'deploy to staging',
        challengeItems: 'system outage during verification',
      },
    ];

    // テスト対象関数の入力を構成
    const request: WeeklyExtractionRequest = {
      weekStartDate: weekStartDate,
      weekEndDate: weekEndDate,
      teamIds: undefined,
      requestedByUserId: 'manager-001',
    };

    // 注：実装が内部で日報データを取得する設計の場合、
    // ここではモック・スタブを注入して実行
    // 実装がコンストラクタ・DI・グローバル経由でアダプタを参照する場合、
    // jest.mock() や beforeEach で設定

    // extractWeeklyReportData を呼び出し
    // （実装がスタブ化されたアダプタを参照可能な設計を前提）
    const result: WeeklyReportDataset = extractWeeklyReportData(
      request,
      stubTextAnalysisServiceAdapter as any
    );

    // Assertion 1: 集約対象は前週月曜日の1件のデータのみ
    expect(result.totalReportsExtracted).toBe(1);

    // Assertion 2: reportsByDate に含まれるのは前週月曜日のみ
    expect(result.reportsByDate).toHaveLength(1);
    expect(result.reportsByDate[0].reportDate).toEqual(dayBefore1);
    expect(result.reportsByDate[0].reportCount).toBe(1);
    expect(result.reportsByDate[0].submittedByUserIds).toEqual(['user-003']);

    // Assertion 3: TextAnalysisServiceAdapterのextractKeywordsは1回のみ呼び出し
    expect(stubTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(1);

    // Assertion 4: extractKeywordsの呼び出し対象は前週月曜日の日報
    expect(stubTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.stringContaining('system outage during verification')
    );

    // Assertion 5: extractedChallenges は '障害' キーワードのみ（前週月曜日のデータから）
    expect(result.extractedChallenges).toHaveLength(1);
    expect(result.extractedChallenges[0]).toMatchObject({
      keyword: expect.stringMatching(/outage|障害|system/i),
      occurrenceCount: expect.any(Number),
    });

    // Assertion 6: dataQualityScore は計算値（前週月曜日の1件のみで算出）
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Assertion 7: 週の範囲は指定した8日間のままだが、処理対象は7日分に限定
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);

    // Assertion 8: 除外されたデータの情報がログまたは監査ログに記録されていることを確認
    // （実装がログ機能を持つ場合、例えば result.exclusionLog など）
    // 実装設計によって異なるため、ここではコメント
    // const exclusionLog = result.exclusionLog;
    // expect(exclusionLog).toContainEqual(
    //   expect.objectContaining({
    //     reason: expect.stringMatching(/超過期間|exceed/i),
    //     excludedDate: dayBefore8,
    //   })
    // );
    // expect(exclusionLog).toContainEqual(
    //   expect.objectContaining({
    //     reason: expect.stringMatching(/超過期間|exceed/i),
    //     excludedDate: dayBefore7,
    //   })
    // );
  });
});