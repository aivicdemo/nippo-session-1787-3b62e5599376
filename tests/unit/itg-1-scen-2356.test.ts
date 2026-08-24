import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - 課題キーワード抽出と定量化指標', () => {
  // SCEN-2356: [normal] 朝会報告集約分析機能 - 発生頻度・影響度・解決速度の3つの定量化指標がすべて分析レポートに含まれる
  test('should generate analysis report with occurrence frequency, impact score, and resolution speed metrics', () => {
    // TextAnalysisServiceAdapter スタブ定義
    const stubTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue([
        { keyword: 'DB接続エラー', occurrenceCount: 2, confidence: 0.95 },
        { keyword: 'タイムアウト', occurrenceCount: 1, confidence: 0.87 },
      ]),
      assessImpactScore: jest.fn((keyword: string) => {
        if (keyword === 'DB接続エラー') return 78;
        if (keyword === 'タイムアウト') return 45;
        return 50;
      }),
      classifyIssueSeverity: jest.fn((text: string) => 'high'),
    };

    // テスト用の日報データセット
    const monthlyReportDataset = {
      extractionPeriodStart: '2024-01-01T00:00:00Z',
      extractionPeriodEnd: '2024-01-31T23:59:59Z',
      totalReportCount: 3,
      reportsByTeam: [
        {
          teamId: 'team-001',
          reportCount: 3,
          submissionRate: 100,
          reportIds: ['report-001', 'report-002', 'report-003'],
        },
      ],
      dataQualityScore: 85,
      extractedAt: '2024-02-01T09:00:00Z',
    };

    // 個別の日報レコード（課題記述を含む）
    const dailyReportRecords = [
      {
        reportId: 'report-001',
        reportDate: '2024-01-10T09:15:00Z',
        memberId: 'member-001',
        teamId: 'team-001',
        yesterdayAccomplishments: 'API開発完了',
        todayPlan: 'テスト実施予定',
        issuesDescription: 'DB接続エラーが発生。タイムアウトで止まった。',
      },
      {
        reportId: 'report-002',
        reportDate: '2024-01-15T09:20:00Z',
        memberId: 'member-002',
        teamId: 'team-001',
        yesterdayAccomplishments: 'テスト完了',
        todayPlan: 'デプロイ準備',
        issuesDescription: 'DB接続エラーが再度発生。',
      },
      {
        reportId: 'report-003',
        reportDate: '2024-01-20T09:25:00Z',
        memberId: 'member-003',
        teamId: 'team-001',
        yesterdayAccomplishments: 'バグ修正',
        todayPlan: 'リリース確認',
        issuesDescription: 'パフォーマンス問題検出。',
      },
    ];

    // 解決日数計算用のデータ
    const issueResolutionData = [
      {
        issueId: 'issue-001',
        reportedDate: new Date('2024-01-10T09:15:00Z'),
        resolvedDate: new Date('2024-01-11T14:30:00Z'),
        resolutionDays: 1.22,
      },
      {
        issueId: 'issue-002',
        reportedDate: new Date('2024-01-15T09:20:00Z'),
        resolvedDate: new Date('2024-01-16T11:00:00Z'),
        resolutionDays: 1.07,
      },
      {
        issueId: 'issue-003',
        reportedDate: new Date('2024-01-20T09:25:00Z'),
        resolvedDate: null,
        resolutionDays: null,
      },
    ];

    // extractMonthlyReportData を実行
    const analysisResult = extractMonthlyReportData(
      monthlyReportDataset,
      dailyReportRecords,
      issueResolutionData,
      stubTextAnalysisServiceAdapter
    );

    // 戻り値は配列の課題分析オブジェクト形式
    expect(Array.isArray(analysisResult)).toBe(true);
    expect(analysisResult.length).toBeGreaterThan(0);

    // 最初の課題（DB接続エラー）を検証
    const firstIssue = analysisResult[0];
    expect(firstIssue).toBeDefined();

    // フィールド1: 発生頻度（出現回数/全報告数の%表記）
    // 3件中2件で出現 → 66.7%
    expect(firstIssue.frequency).toBeDefined();
    expect(typeof firstIssue.frequency).toBe('string');
    expect(firstIssue.frequency).toMatch(/^[0-9]+(\.[0-9]+)?%$/);
    const frequencyValue = parseFloat(firstIssue.frequency);
    expect(frequencyValue).toBeGreaterThanOrEqual(0);
    expect(frequencyValue).toBeLessThanOrEqual(100);
    expect(frequencyValue).toBeCloseTo(66.7, 1);

    // フィールド2: 影響度（0-100スコア）
    expect(firstIssue.impactScore).toBeDefined();
    expect(typeof firstIssue.impactScore).toBe('number');
    expect(firstIssue.impactScore).toBeGreaterThanOrEqual(0);
    expect(firstIssue.impactScore).toBeLessThanOrEqual(100);
    expect(firstIssue.impactScore).toBe(78);

    // フィールド3: 解決速度（平均解決日数）
    expect(firstIssue.resolutionDaysAverage).toBeDefined();
    expect(typeof firstIssue.resolutionDaysAverage).toBe('number');
    expect(firstIssue.resolutionDaysAverage).toBeGreaterThanOrEqual(0);
    expect(firstIssue.resolutionDaysAverage).toBeCloseTo(1.15, 2);

    // 3つのフィールドがすべて同一のオブジェクト内に共存していることを確認
    expect(Object.keys(firstIssue)).toContain('frequency');
    expect(Object.keys(firstIssue)).toContain('impactScore');
    expect(Object.keys(firstIssue)).toContain('resolutionDaysAverage');

    // 課題名フィールドも存在することを確認
    expect(firstIssue.issueName).toBe('DB接続エラー');

    // TextAnalysisServiceAdapter のメソッドが呼ばれたことを確認
    expect(stubTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(
      stubTextAnalysisServiceAdapter.assessImpactScore
    ).toHaveBeenCalledWith('DB接続エラー');
  });
});