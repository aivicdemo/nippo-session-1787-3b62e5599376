import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyExtractionRequest, MonthlyReportDataset } from '../../src/logic/monthly-performance-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2350: [normal] 朝会報告集約分析機能 - 指定期間内に複数件の日報がある場合、全日報から抽出された課題を集計に含める
  test('指定期間内に複数件の日報がある場合、全日報から抽出された課題を集計に含める', async () => {
    // テストデータ: 指定期間内（2026-08-19～2026-08-23）に異なるチームメンバー3名が各2件ずつ、計6件の日報
    const mockReportRecords = [
      {
        reportId: 'report-001',
        teamId: 'team-A',
        userId: 'user-001',
        reportedDate: new Date('2026-08-19T09:00:00Z'),
        yesterdayAccomplishment: 'Database schema migration completed',
        todayPlan: 'Integration testing scheduled',
        issueDescription: 'データベース接続エラーが発生',
        submittedAt: new Date('2026-08-19T08:30:00Z'),
      },
      {
        reportId: 'report-002',
        teamId: 'team-A',
        userId: 'user-001',
        reportedDate: new Date('2026-08-20T09:00:00Z'),
        yesterdayAccomplishment: 'Debugging connection pool',
        todayPlan: 'Fix connection timeout',
        issueDescription: 'データベース接続エラーが発生',
        submittedAt: new Date('2026-08-20T08:30:00Z'),
      },
      {
        reportId: 'report-003',
        teamId: 'team-B',
        userId: 'user-002',
        reportedDate: new Date('2026-08-19T09:00:00Z'),
        yesterdayAccomplishment: 'Reviewed deployment checklist',
        todayPlan: 'Prepare production deployment',
        issueDescription: 'デプロイメント手順が不明確',
        submittedAt: new Date('2026-08-19T08:30:00Z'),
      },
      {
        reportId: 'report-004',
        teamId: 'team-B',
        userId: 'user-002',
        reportedDate: new Date('2026-08-21T09:00:00Z'),
        yesterdayAccomplishment: 'Environment setup completed',
        todayPlan: 'Execute deployment steps',
        issueDescription: 'デプロイメント手順が不明確',
        submittedAt: new Date('2026-08-21T08:30:00Z'),
      },
      {
        reportId: 'report-005',
        teamId: 'team-C',
        userId: 'user-003',
        reportedDate: new Date('2026-08-22T09:00:00Z'),
        yesterdayAccomplishment: 'API documentation drafted',
        todayPlan: 'Update implementation guide',
        issueDescription: 'ドキュメント更新漏れ',
        submittedAt: new Date('2026-08-22T08:30:00Z'),
      },
      {
        reportId: 'report-006',
        teamId: 'team-C',
        userId: 'user-003',
        reportedDate: new Date('2026-08-23T09:00:00Z'),
        yesterdayAccomplishment: 'Reviewed setup instructions',
        todayPlan: 'Final documentation review',
        issueDescription: 'ドキュメント更新漏れ',
        submittedAt: new Date('2026-08-23T08:30:00Z'),
      },
    ];

    // TextAnalysisServiceAdapterのスタブ作成
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        // extractKeywordsが呼び出されるたびに対応するキーワードを返す
        if (text.includes('データベース接続エラー')) {
          return { keywords: [{ keyword: 'データベース接続エラー', frequency: 1 }], confidence: 0.95 };
        }
        if (text.includes('デプロイメント手順')) {
          return { keywords: [{ keyword: 'デプロイメント手順', frequency: 1 }], confidence: 0.92 };
        }
        if (text.includes('ドキュメント更新')) {
          return { keywords: [{ keyword: 'ドキュメント更新', frequency: 1 }], confidence: 0.90 };
        }
        return { keywords: [], confidence: 0 };
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        return { impactScore: 75, severity: 'medium' };
      }),
      classifyIssueSeverity: jest.fn(async (text: string) => {
        return { severity: 'medium', confidence: 0.85 };
      }),
    };

    // 入力パラメータ
    const extractionRequest: MonthlyExtractionRequest = {
      targetYear: 2026,
      targetMonth: 8,
      requestedByUserId: 'user-manager-001',
      teamIdFilter: ['team-A', 'team-B', 'team-C'],
    };

    // extractMonthlyReportDataを実行
    const result: MonthlyReportDataset = await extractMonthlyReportData(
      extractionRequest,
      mockReportRecords,
      mockTextAnalysisAdapter
    );

    // 期待値の検証
    // 集計結果に3つのキーワードが全て含まれること
    expect(result.totalReportCount).toBe(6);
    expect(result.reportsByTeam).toHaveLength(3);

    // チーム別の日報集計結果を確認
    const teamAMetrics = result.reportsByTeam.find((t) => t.teamId === 'team-A');
    expect(teamAMetrics).toBeDefined();
    expect(teamAMetrics?.reportCount).toBe(2);
    expect(teamAMetrics?.submissionRate).toBe(100);
    expect(teamAMetrics?.reportIds).toContain('report-001');
    expect(teamAMetrics?.reportIds).toContain('report-002');

    const teamBMetrics = result.reportsByTeam.find((t) => t.teamId === 'team-B');
    expect(teamBMetrics).toBeDefined();
    expect(teamBMetrics?.reportCount).toBe(2);
    expect(teamBMetrics?.submissionRate).toBe(100);
    expect(teamBMetrics?.reportIds).toContain('report-003');
    expect(teamBMetrics?.reportIds).toContain('report-004');

    const teamCMetrics = result.reportsByTeam.find((t) => t.teamId === 'team-C');
    expect(teamCMetrics).toBeDefined();
    expect(teamCMetrics?.reportCount).toBe(2);
    expect(teamCMetrics?.submissionRate).toBe(100);
    expect(teamCMetrics?.reportIds).toContain('report-005');
    expect(teamCMetrics?.reportIds).toContain('report-006');

    // 抽出期間の検証
    expect(result.extractionPeriodStart).toBe('2026-08-19T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2026-08-23T23:59:59Z');

    // TextAnalysisServiceAdapterのextractKeywordsが全6件の日報に対して呼び出されたことを検証
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(6);

    // データ品質スコアが妥当な範囲であることを確認
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 抽出実行日時が設定されていることを確認
    expect(result.extractedAt).toBeDefined();
    expect(new Date(result.extractedAt).getTime()).toBeGreaterThan(0);
  });
});