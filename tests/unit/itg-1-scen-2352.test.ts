import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - 課題影響度スコア集計', () => {
  // SCEN-2352
  test('TextAnalysisServiceAdapterが正常応答した場合、抽出された課題の影響度スコアを集計に含める', () => {
    // Stub TextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続エラー', frequency: 2 },
          { keyword: 'API応答遅延', frequency: 1 }
        ]
      }),
      assessImpactScore: jest.fn().mockImplementation((keyword: string) => {
        if (keyword === 'データベース接続エラー') {
          return Promise.resolve({ impactScore: 75 });
        }
        if (keyword === 'API応答遅延') {
          return Promise.resolve({ impactScore: 45 });
        }
        return Promise.resolve({ impactScore: 0 });
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' })
    };

    // Input data: 3件以上の日報
    const inputReports = [
      {
        reportId: 'report-001',
        teamId: 'team-dev-001',
        submittedAt: new Date('2024-01-15T09:00:00Z'),
        yesterdayAccomplishment: 'API開発完了',
        todayPlan: 'テスト実施',
        issues: 'データベース接続エラーが発生した'
      },
      {
        reportId: 'report-002',
        teamId: 'team-dev-001',
        submittedAt: new Date('2024-01-15T09:05:00Z'),
        yesterdayAccomplishment: 'UIコンポーネント実装',
        todayPlan: 'レビュー対応',
        issues: 'API応答遅延により処理が遅くなっている。また、データベース接続エラーも再度発生'
      },
      {
        reportId: 'report-003',
        teamId: 'team-dev-001',
        submittedAt: new Date('2024-01-15T09:10:00Z'),
        yesterdayAccomplishment: 'バグ修正',
        todayPlan: 'デプロイ準備',
        issues: 'データベース接続エラーが継続している'
      }
    ];

    const monthlyReportInput = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-pm-001',
      teamIdFilter: ['team-dev-001']
    };

    // Execute
    const result = extractMonthlyReportData(
      monthlyReportInput,
      inputReports,
      mockTextAnalysisServiceAdapter
    );

    // Verify - 集計結果に抽出された課題キーワードと影響度スコアが含まれること
    expect(result.extractedKeywords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'データベース接続エラー',
          impactScore: 75
        }),
        expect.objectContaining({
          keyword: 'API応答遅延',
          impactScore: 45
        })
      ])
    );

    // Verify - 合計影響度スコアが120以上であること
    const totalImpactScore = result.extractedKeywords.reduce(
      (sum, kw) => sum + kw.impactScore,
      0
    );
    expect(totalImpactScore).toBeGreaterThanOrEqual(120);

    // Verify - TextAnalysisServiceAdapter が呼び出されたこと
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      'データベース接続エラー'
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      'API応答遅延'
    );
  });
});