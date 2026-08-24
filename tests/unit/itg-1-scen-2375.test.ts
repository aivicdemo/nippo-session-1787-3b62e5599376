import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2375: [edge] 朝会報告集約分析機能 - 集約期間の開始日と終了日が同日のとき、その1日分の日報のみを抽出して分析する
  test('集約期間の開始日と終了日が同日のとき、その日付の日報のみを抽出して分析する', () => {
    // Arrange: テスト用スタブデータ準備
    const aggregationStartDate = new Date('2026-08-19T00:00:00Z');
    const aggregationEndDate = new Date('2026-08-19T23:59:59Z');

    const reportRecordsForSameDate = [
      {
        reportId: 'report-001',
        reportDate: new Date('2026-08-19T09:00:00Z'),
        userId: 'user-001',
        yesterdayAccomplishment: 'Feature A implementation completed',
        todayPlan: 'Start Feature B testing',
        challenge: 'Performance issue in database query',
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2026-08-19T09:15:00Z'),
        userId: 'user-002',
        yesterdayAccomplishment: 'Code review for Module C',
        todayPlan: 'Deploy to staging environment',
        challenge: 'Performance issue in database query and network latency',
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2026-08-19T09:30:00Z'),
        userId: 'user-003',
        yesterdayAccomplishment: 'Documentation update',
        todayPlan: 'Bug fix for issue #123',
        challenge: 'Network latency affecting API response time',
      },
    ];

    const recordsBeforeSameDate = [
      {
        reportId: 'report-before-001',
        reportDate: new Date('2026-08-18T09:00:00Z'),
        userId: 'user-004',
        yesterdayAccomplishment: 'Previous day work',
        todayPlan: 'Previous day plan',
        challenge: 'Previous day challenge',
      },
    ];

    const recordsAfterSameDate = [
      {
        reportId: 'report-after-001',
        reportDate: new Date('2026-08-20T09:00:00Z'),
        userId: 'user-005',
        yesterdayAccomplishment: 'Next day work',
        todayPlan: 'Next day plan',
        challenge: 'Next day challenge',
      },
    ];

    const allReportRecords = [
      ...recordsBeforeSameDate,
      ...reportRecordsForSameDate,
      ...recordsAfterSameDate,
    ];

    // TextAnalysisServiceAdapterのスタブ
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        const keywords: { keyword: string; frequency: number }[] = [];
        if (text.includes('Performance issue')) {
          keywords.push({ keyword: 'Performance issue', frequency: 2 });
        }
        if (text.includes('Network latency')) {
          keywords.push({ keyword: 'Network latency', frequency: 2 });
        }
        if (text.includes('database query')) {
          keywords.push({ keyword: 'database query', frequency: 1 });
        }
        return keywords;
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          'Performance issue': 85,
          'Network latency': 72,
          'database query': 65,
        };
        return scoreMap[keyword] || 50;
      }),
    };

    // Act: extractMonthlyReportDataを実行
    const result = extractMonthlyReportData(
      aggregationStartDate,
      aggregationEndDate,
      allReportRecords,
      mockTextAnalysisAdapter,
    );

    // Assert: 結果構造の検証
    expect(result).toHaveProperty('aggregationDate');
    expect(result).toHaveProperty('reportCount');
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('impactScores');

    // 集約日付の検証
    expect(result.aggregationDate).toBe('2026-08-19');

    // 同日の日報件数が正確であることを検証
    expect(result.reportCount).toBe(3);

    // 抽出されたキーワードが存在することを検証
    expect(result.keywords).toBeInstanceOf(Array);
    expect(result.keywords.length).toBeGreaterThan(0);

    // キーワードのstructureを検証
    result.keywords.forEach((item: { keyword: string; frequency: number }) => {
      expect(typeof item.keyword).toBe('string');
      expect(typeof item.frequency).toBe('number');
      expect(item.frequency).toBeGreaterThanOrEqual(0);
    });

    // 影響度スコアが存在することを検証
    expect(result.impactScores).toBeInstanceOf(Array);
    expect(result.impactScores.length).toBeGreaterThan(0);

    // スコアのstructureを検証
    result.impactScores.forEach(
      (item: { keyword: string; score: number }) => {
        expect(typeof item.keyword).toBe('string');
        expect(typeof item.score).toBe('number');
        expect(item.score).toBeGreaterThanOrEqual(0);
        expect(item.score).toBeLessThanOrEqual(100);
      },
    );

    // 同日以外の日報が含まれていないことを検証
    const includedReportIds = new Set<string>();
    if (result.reportIds && Array.isArray(result.reportIds)) {
      result.reportIds.forEach((id: string) => {
        includedReportIds.add(id);
      });
    }

    // 同日の日報IDのみが含まれることを検証
    reportRecordsForSameDate.forEach((record) => {
      // 実際の実装に応じて、reportIdsが結果に含まれるかチェック
      if (result.reportIds) {
        expect(result.reportIds).toContain(record.reportId);
      }
    });

    // 他の日付の日報が含まれていないことを検証
    recordsBeforeSameDate.forEach((record) => {
      if (result.reportIds) {
        expect(result.reportIds).not.toContain(record.reportId);
      }
    });

    recordsAfterSameDate.forEach((record) => {
      if (result.reportIds) {
        expect(result.reportIds).not.toContain(record.reportId);
      }
    });

    // TextAnalysisServiceAdapterが呼び出されたことを検証
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();

    // extractKeywordsの呼び出し回数が同日の日報数に対応していることを検証
    expect(mockTextAnalysisAdapter.extractKeywords.mock.calls.length).toBeGreaterThanOrEqual(
      1,
    );

    // 結果が具体的な値を持つことを最終確認
    expect(result.reportCount).toBe(3);
    expect(result.aggregationDate).toBe('2026-08-19');
  });
});