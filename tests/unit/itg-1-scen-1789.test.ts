import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

// Mock for TextAnalysisServiceAdapter
interface TextAnalysisServiceAdapter {
  extractKeywords: jest.Mock;
  assessImpactScore: jest.Mock;
}

describe('Monthly Report Data Extraction - Issue Keyword Aggregation', () => {
  // SCEN-1789
  test('should aggregate issue trends from multiple previous month reports with correct frequency and impact scores', () => {
    // Setup: Mock TextAnalysisServiceAdapter with predefined responses
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn((text: string) => {
        const keywordFrequency: Record<string, number> = {
          'データベース接続エラー': 5,
          'テスト環境遅延': 3,
          'API仕様不備': 4,
        };
        return keywordFrequency;
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const impactScores: Record<string, number> = {
          'データベース接続エラー': 75,
          'テスト環境遅延': 60,
          'API仕様不備': 65,
        };
        return impactScores[keyword] ?? 0;
      }),
    };

    // Prepare test data: 30 daily reports from previous month (July 2026)
    // 10 members × 3 reports each
    const testReports = [
      {
        reportId: 'report-001',
        teamId: 'team-001',
        userId: 'user-A',
        reportDate: new Date('2026-07-01'),
        previousDayContent: 'Fixed login module',
        todayPlanContent: 'Implement database connection',
        issueContent: 'データベース接続エラーが発生。対応に時間がかかっている。',
      },
      {
        reportId: 'report-002',
        teamId: 'team-001',
        userId: 'user-A',
        reportDate: new Date('2026-07-02'),
        previousDayContent: 'Debugging database',
        todayPlanContent: 'Continue debugging',
        issueContent: 'テスト環境の構築が遅延している。',
      },
      {
        reportId: 'report-003',
        teamId: 'team-001',
        userId: 'user-A',
        reportDate: new Date('2026-07-03'),
        previousDayContent: 'Environment setup',
        todayPlanContent: 'Review API specs',
        issueContent: 'API仕様書の不備により実装が進まない。',
      },
      {
        reportId: 'report-004',
        teamId: 'team-001',
        userId: 'user-B',
        reportDate: new Date('2026-07-01'),
        previousDayContent: 'Code review',
        todayPlanContent: 'Deploy to staging',
        issueContent: 'データベース接続エラーの影響で本番リリースが遅延。',
      },
      {
        reportId: 'report-005',
        teamId: 'team-001',
        userId: 'user-B',
        reportDate: new Date('2026-07-02'),
        previousDayContent: 'Testing API',
        todayPlanContent: 'Fix API response',
        issueContent: 'テスト環境遅延により検証作業が進まない。',
      },
      {
        reportId: 'report-006',
        teamId: 'team-001',
        userId: 'user-B',
        reportDate: new Date('2026-07-03'),
        previousDayContent: 'API debugging',
        todayPlanContent: 'Finalize API',
        issueContent: 'API仕様不備による追加対応が発生。',
      },
      {
        reportId: 'report-007',
        teamId: 'team-001',
        userId: 'user-C',
        reportDate: new Date('2026-07-01'),
        previousDayContent: 'Infrastructure work',
        todayPlanContent: 'Setup database',
        issueContent: 'データベース接続エラーが再度発生。',
      },
      {
        reportId: 'report-008',
        teamId: 'team-001',
        userId: 'user-C',
        reportDate: new Date('2026-07-02'),
        previousDayContent: 'Database maintenance',
        todayPlanContent: 'Test connection',
        issueContent: 'テスト環境の準備がまだ完了していない。',
      },
      {
        reportId: 'report-009',
        teamId: 'team-001',
        userId: 'user-C',
        reportDate: new Date('2026-07-03'),
        previousDayContent: 'Testing',
        todayPlanContent: 'Deploy',
        issueContent: 'API仕様書の矛盾が判明。',
      },
      {
        reportId: 'report-010',
        teamId: 'team-001',
        userId: 'user-D',
        reportDate: new Date('2026-07-01'),
        previousDayContent: 'Feature development',
        todayPlanContent: 'Database integration',
        issueContent: 'データベース接続エラーが複数チームに波及。',
      },
      {
        reportId: 'report-011',
        teamId: 'team-001',
        userId: 'user-D',
        reportDate: new Date('2026-07-02'),
        previousDayContent: 'Debugging',
        todayPlanContent: 'Environment setup',
        issueContent: 'テスト環境遅延が原因で本番テストが遅れている。',
      },
      {
        reportId: 'report-012',
        teamId: 'team-001',
        userId: 'user-D',
        reportDate: new Date('2026-07-03'),
        previousDayContent: 'Testing phase',
        todayPlanContent: 'API validation',
        issueContent: 'API仕様不備の修正が完了。',
      },
      {
        reportId: 'report-013',
        teamId: 'team-001',
        userId: 'user-E',
        reportDate: new Date('2026-07-01'),
        previousDayContent: 'System design',
        todayPlanContent: 'Implement storage',
        issueContent: 'データベース接続エラー対応に時間を消費。',
      },
      {
        reportId: 'report-014',
        teamId: 'team-001',
        userId: 'user-E',
        reportDate: new Date('2026-07-02'),
        previousDayContent: 'Storage setup',
        todayPlanContent: 'Run tests',
        issueContent: 'テスト環境の遅延が続いている。',
      },
      {
        reportId: 'report-015',
        teamId: 'team-001',
        userId: 'user-E',
        reportDate: new Date('2026-07-03'),
        previousDayContent: 'Test execution',
        todayPlanContent: 'Fix issues',
        issueContent: 'API仕様の確認を完了。',
      },
      {
        reportId: 'report-016',
        teamId: 'team-001',
        userId: 'user-F',
        reportDate: new Date('2026-07-01'),
        previousDayContent: 'Backend development',
        todayPlanContent: 'Database setup',
        issueContent: 'データベース接続エラーが発生中。',
      },
      {
        reportId: 'report-017',
        teamId: 'team-001',
        userId: 'user-F',
        reportDate: new Date('2026-07-02'),
        previousDayContent: 'Troubleshooting',
        todayPlanContent: 'Deploy test env',
        issueContent: 'テスト環境構築の遅延で進捗に影響。',
      },
      {
        reportId: 'report-018',
        teamId: 'team-001',
        userId: 'user-F',
        reportDate: new Date('2026-07-03'),
        previousDayContent: 'Environment config',
        todayPlanContent: 'API implementation',
        issueContent: 'API仕様書の内容が不十分。',
      },
      {
        reportId: 'report-019',
        teamId: 'team-001',
        userId: 'user-G',
        reportDate: new Date('2026-07-01'),
        previousDayContent: 'Frontend work',
        todayPlanContent: 'Connect to backend',
        issueContent: 'バックエンド側のデータベース接続エラーにより開発が停止。',
      },
      {
        reportId: 'report-020',
        teamId: 'team-001',
        userId: 'user-G',
        reportDate: new Date('2026-07-02'),
        previousDayContent: 'Integration',
        todayPlanContent: 'Test integration',
        issueContent: 'テスト環境が利用不可のため検証が進まない。',
      },
      {
        reportId: 'report-021',
        teamId: 'team-001',
        userId: 'user-G',
        reportDate: new Date('2026-07-03'),
        previousDayContent: 'Testing',
        todayPlanContent: 'Validation',
        issueContent: 'API仕様の齟齬により統合テストが失敗。',
      },
      {
        reportId: 'report-022',
        teamId: 'team-001',
        userId: 'user-H',
        reportDate: new Date('2026-07-01'),
        previousDayContent: 'QA setup',
        todayPlanContent: 'Test execution',
        issueContent: 'データベース接続エラーが本番環境で再現。',
      },
      {
        reportId: 'report-023',
        teamId: 'team-001',
        userId: 'user-H',
        reportDate: new Date('2026-07-02'),
        previousDayContent: 'Bug report',
        todayPlanContent: 'Environment test',
        issueContent: 'テスト環境遅延により予定が変更になった。',
      },
      {
        reportId: 'report-024',
        teamId: 'team-001',
        userId: 'user-H',
        reportDate: new Date('2026-07-03'),
        previousDayContent: 'Regression testing',
        todayPlanContent: 'Final validation',
        issueContent: 'API仕様書の修正版をレビュー中。',
      },
      {
        reportId: 'report-025',
        teamId: 'team-001',
        userId: 'user-I',
        reportDate: new Date('2026-07-01'),
        previousDayContent: 'Documentation',
        todayPlanContent: 'Update docs',
        issueContent: 'データベース接続エラーの原因分析を開始。',
      },
      {
        reportId: 'report-026',
        teamId: 'team-001',
        userId: 'user-I',
        reportDate: new Date('2026-07-02'),
        previousDayContent: 'Root cause analysis',
        todayPlanContent: 'Prepare test',
        issueContent: 'テスト環境構築がボトルネック状態。',
      },
      {
        reportId: 'report-027',
        teamId: 'team-001',
        userId: 'user-I',
        reportDate: new Date('2026-07-03'),
        previousDayContent: 'Test prep',
        todayPlanContent: 'Execute test',
        issueContent: 'API仕様の整合性取れず。',
      },
      {
        reportId: 'report-028',
        teamId: 'team-001',
        userId: 'user-J',
        reportDate: new Date('2026-07-01'),
        previousDayContent: 'Deployment prep',
        todayPlanContent: 'Staging deploy',
        issueContent: 'データベース接続エラーが解決まで3日かかる見込み。',
      },
      {
        reportId: 'report-029',
        teamId: 'team-001',
        userId: 'user-J',
        reportDate: new Date('2026-07-02'),
        previousDayContent: 'Monitoring',
        todayPlanContent: 'Check test env',
        issueContent: 'テスト環境の構築完了予定が不確定。',
      },
      {
        reportId: 'report-030',
        teamId: 'team-001',
        userId: 'user-J',
        reportDate: new Date('2026-07-03'),
        previousDayContent: 'Health check',
        todayPlanContent: 'Production ready',
        issueContent: 'API仕様書のドキュメント作成完了。',
      },
    ];

    // Execute: Call extractMonthlyReportData with July 2026 (previous month)
    const result = extractMonthlyReportData(
      {
        targetYear: 2026,
        targetMonth: 7,
        requestedByUserId: 'admin-001',
        teamIdFilter: ['team-001'],
      },
      mockTextAnalysisAdapter,
      testReports,
    );

    // Verify: Check monthly report content structure and aggregated issue trends
    expect(result).toBeDefined();
    expect(result.extractionPeriodStart).toBe('2026-07-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2026-07-31T23:59:59Z');
    expect(result.totalReportCount).toBe(30);

    // Verify: Issue trend aggregation section
    const issueTrends = result.reportsByTeam[0]?.issueTrends ?? [];
    expect(issueTrends).toBeDefined();
    expect(issueTrends.length).toBeGreaterThan(0);

    // Verify: Issue ranking by frequency and impact score
    // Expected ranking: (1) データベース接続エラー freq=5 score=75, (2) API仕様不備 freq=4 score=65, (3) テスト環境遅延 freq=3 score=60
    const sortedTrends = issueTrends.sort((a, b) => {
      const scoreA = (a.frequency ?? 0) * (a.impactScore ?? 0);
      const scoreB = (b.frequency ?? 0) * (b.impactScore ?? 0);
      return scoreB - scoreA;
    });

    expect(sortedTrends[0]?.keyword).toBe('データベース接続エラー');
    expect(sortedTrends[0]?.frequency).toBe(5);
    expect(sortedTrends[0]?.impactScore).toBe(75);

    expect(sortedTrends[1]?.keyword).toBe('API仕様不備');
    expect(sortedTrends[1]?.frequency).toBe(4);
    expect(sortedTrends[1]?.impactScore).toBe(65);

    expect(sortedTrends[2]?.keyword).toBe('テスト環境遅延');
    expect(sortedTrends[2]?.frequency).toBe(3);
    expect(sortedTrends[2]?.impactScore).toBe(60);

    // Verify: Data quality score is within acceptable range (0-100)
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Verify: Extraction timestamp is recorded
    expect(result.extractedAt).toBeDefined();
    expect(new Date(result.extractedAt).getTime()).toBeGreaterThan(0);

    // Verify: TextAnalysisServiceAdapter was called for keyword extraction
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();

    // Verify: All 30 reports were aggregated
    expect(result.reportsByTeam[0]?.reportCount).toBe(30);
  });
});