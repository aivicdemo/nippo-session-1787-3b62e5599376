import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('生産性指標計算機能 - 課題発生頻度の再現性', () => {
  test('SCEN-2268: 同じ入力期間で2回実行した場合、課題発生頻度は同じ値で計算される', () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(() => ({
        keywords: [
          { keyword: 'バグ対応', frequency: 5, impactScore: 75 },
          { keyword: 'リソース不足', frequency: 3, impactScore: 60 },
        ],
      })),
      assessImpactScore: jest.fn((keyword: string) => {
        if (keyword === 'バグ対応') return 75;
        if (keyword === 'リソース不足') return 60;
        return 50;
      }),
      classifyIssueSeverity: jest.fn(() => 'high'),
    };

    // テスト用の日報データを準備
    const testReportData = [
      {
        memberId: 'ENG001',
        reportDate: new Date('2026-08-20T09:00:00Z'),
        yesterdayAccomplishment: 'バグ対応を実施',
        todayPlan: 'テスト実施',
        issues: 'バグ対応で時間がかかっている。リソース不足の影響がある。',
      },
      {
        memberId: 'ENG002',
        reportDate: new Date('2026-08-21T09:00:00Z'),
        yesterdayAccomplishment: 'バグ対応完了',
        todayPlan: 'デプロイ準備',
        issues: 'バグ対応の遅延。リソース不足により進捗が遅れている。',
      },
      {
        memberId: 'ENG003',
        reportDate: new Date('2026-08-22T09:00:00Z'),
        yesterdayAccomplishment: 'レビュー実施',
        todayPlan: '修正対応',
        issues: 'バグ対応の品質確保に課題あり。',
      },
      {
        memberId: 'ENG001',
        reportDate: new Date('2026-08-23T09:00:00Z'),
        yesterdayAccomplishment: 'バグ対応継続',
        todayPlan: 'テスト追加',
        issues: 'バグ対応が継続中。リソース制約がある。',
      },
      {
        memberId: 'ENG002',
        reportDate: new Date('2026-08-24T09:00:00Z'),
        yesterdayAccomplishment: 'テスト完了',
        todayPlan: 'ドキュメント作成',
        issues: 'バグ対応の最終確認が必要。',
      },
      {
        memberId: 'ENG003',
        reportDate: new Date('2026-08-25T09:00:00Z'),
        yesterdayAccomplishment: 'バグ対応最終確認',
        todayPlan: 'リリース準備',
        issues: 'バグ対応完了。次フェーズへ移行予定。',
      },
      {
        memberId: 'ENG001',
        reportDate: new Date('2026-08-26T09:00:00Z'),
        yesterdayAccomplishment: 'リリース実施',
        todayPlan: 'モニタリング',
        issues: 'バグ対応により全体スケジュールに影響',
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate: new Date('2026-08-20T00:00:00Z'),
      aggregationEndDate: new Date('2026-08-26T23:59:59Z'),
      teamIds: ['TEAM001'],
      reportRecords: testReportData as any,
    };

    // Act: 第1回目の計算を実行
    const firstExecutionResult = calculateTeamPerformanceMetrics(input, mockTextAnalysisAdapter);

    // 第1回目の結果から課題発生頻度を抽出
    const firstExecutionIssueFrequency = firstExecutionResult.issueFrequencyRanking.reduce(
      (map, item) => {
        map[item.issueKeyword] = item.occurrenceCount;
        return map;
      },
      {} as Record<string, number>,
    );

    // Act: 第2回目の計算を実行（同じ入力期間と日報データを使用）
    const secondExecutionResult = calculateTeamPerformanceMetrics(input, mockTextAnalysisAdapter);

    // 第2回目の結果から課題発生頻度を抽出
    const secondExecutionIssueFrequency = secondExecutionResult.issueFrequencyRanking.reduce(
      (map, item) => {
        map[item.issueKeyword] = item.occurrenceCount;
        return map;
      },
      {} as Record<string, number>,
    );

    // Assert: 第1回目と第2回目の課題発生頻度が完全に一致することを検証
    expect(Object.keys(firstExecutionIssueFrequency).length).toBe(
      Object.keys(secondExecutionIssueFrequency).length,
    );

    // 各キーワードの頻度値が小数点以下まで同じことを検証
    Object.keys(firstExecutionIssueFrequency).forEach((keyword) => {
      expect(firstExecutionIssueFrequency[keyword]).toBe(secondExecutionIssueFrequency[keyword]);
    });

    // 具体的な期待値との検証
    expect(firstExecutionIssueFrequency['バグ対応']).toBe(5);
    expect(firstExecutionIssueFrequency['リソース不足']).toBe(3);
    expect(secondExecutionIssueFrequency['バグ対応']).toBe(5);
    expect(secondExecutionIssueFrequency['リソース不足']).toBe(3);

    // 集計期間が正しく設定されていることを検証
    expect(new Date(firstExecutionResult.aggregationPeriod.startDate).getTime()).toBe(
      new Date('2026-08-20T00:00:00Z').getTime(),
    );
    expect(new Date(firstExecutionResult.aggregationPeriod.endDate).getTime()).toBe(
      new Date('2026-08-26T23:59:59Z').getTime(),
    );
    expect(firstExecutionResult.aggregationPeriod.durationDays).toBe(7);

    // 第2回目の集計期間も同じことを検証
    expect(new Date(secondExecutionResult.aggregationPeriod.startDate).getTime()).toBe(
      new Date('2026-08-20T00:00:00Z').getTime(),
    );
    expect(new Date(secondExecutionResult.aggregationPeriod.endDate).getTime()).toBe(
      new Date('2026-08-26T23:59:59Z').getTime(),
    );
    expect(secondExecutionResult.aggregationPeriod.durationDays).toBe(7);
  });
});