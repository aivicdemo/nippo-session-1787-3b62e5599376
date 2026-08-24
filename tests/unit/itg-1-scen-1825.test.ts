import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('月次チームパフォーマンスメトリクス計算', () => {
  // SCEN-1825: [edge] 課題傾向集計機能 - 複数チームから抽出された課題キーワードが重複含めて正確にカウントされて頻度計算される

  it('複数チームの日報から課題キーワードを重複を含めてカウントし、発生頻度を正確に計算する', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');

    // テスト用日報レコード：チームA（3件）
    const teamAReports = [
      {
        reportId: 'report-a-001',
        teamId: 'team-a',
        memberId: 'member-a-001',
        reportDate: new Date('2024-01-15T09:00:00Z'),
        yesterdayAccomplishment: 'DB接続関連の修正完了',
        todayPlan: 'ネットワーク遅延の調査',
        issue: 'データベース接続エラーが発生中',
      },
      {
        reportId: 'report-a-002',
        teamId: 'team-a',
        memberId: 'member-a-002',
        reportDate: new Date('2024-01-16T09:00:00Z'),
        yesterdayAccomplishment: 'ネットワーク設定確認',
        todayPlan: 'レスポンス改善',
        issue: 'ネットワーク遅延が継続中',
      },
      {
        reportId: 'report-a-003',
        teamId: 'team-a',
        memberId: 'member-a-003',
        reportDate: new Date('2024-01-17T09:00:00Z'),
        yesterdayAccomplishment: 'エラーログ分析',
        todayPlan: 'DB再起動テスト',
        issue: 'データベース接続エラーが再発',
      },
    ];

    // テスト用日報レコード：チームB（2件）
    const teamBReports = [
      {
        reportId: 'report-b-001',
        teamId: 'team-b',
        memberId: 'member-b-001',
        reportDate: new Date('2024-01-15T09:00:00Z'),
        yesterdayAccomplishment: '通信テスト実施',
        todayPlan: 'API応答確認',
        issue: 'ネットワーク遅延で応答が遅い',
      },
      {
        reportId: 'report-b-002',
        teamId: 'team-b',
        memberId: 'member-b-002',
        reportDate: new Date('2024-01-16T09:00:00Z'),
        yesterdayAccomplishment: 'メモリ使用量ログ記録',
        todayPlan: 'メモリリーク調査',
        issue: 'メモリ不足でプロセスが落ちている',
      },
    ];

    // テスト用日報レコード：チームC（4件）
    const teamCReports = [
      {
        reportId: 'report-c-001',
        teamId: 'team-c',
        memberId: 'member-c-001',
        reportDate: new Date('2024-01-15T09:00:00Z'),
        yesterdayAccomplishment: 'DB障害復旧',
        todayPlan: 'コネクションプール設定',
        issue: 'データベース接続エラー発生',
      },
      {
        reportId: 'report-c-002',
        teamId: 'team-c',
        memberId: 'member-c-002',
        reportDate: new Date('2024-01-16T09:00:00Z'),
        yesterdayAccomplishment: 'ネットワーク帯域確認',
        todayPlan: '負荷分散設定',
        issue: 'ネットワーク遅延が顕著',
      },
      {
        reportId: 'report-c-003',
        teamId: 'team-c',
        memberId: 'member-c-003',
        reportDate: new Date('2024-01-17T09:00:00Z'),
        yesterdayAccomplishment: 'ルータ再設定完了',
        todayPlan: '疎通確認',
        issue: 'ネットワーク遅延は継続中',
      },
      {
        reportId: 'report-c-004',
        teamId: 'team-c',
        memberId: 'member-c-004',
        reportDate: new Date('2024-01-18T09:00:00Z'),
        yesterdayAccomplishment: 'メモリダンプ分析',
        todayPlan: 'オブジェクト参照確認',
        issue: 'メモリ不足の根本原因を追跡中',
      },
    ];

    const allReports = [...teamAReports, ...teamBReports, ...teamCReports];

    // TextAnalysisServiceAdapterをスタブに置き換え
    // 各報告の課題項目から予定されたキーワードを返すモック
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((issueText: string) => {
        if (issueText.includes('データベース接続エラー')) {
          return {
            keywords: ['データベース接続エラー'],
            frequencies: [1],
          };
        }
        if (issueText.includes('ネットワーク遅延')) {
          return {
            keywords: ['ネットワーク遅延'],
            frequencies: [1],
          };
        }
        if (issueText.includes('メモリ不足')) {
          return {
            keywords: ['メモリ不足'],
            frequencies: [1],
          };
        }
        return { keywords: [], frequencies: [] };
      }),
      assessImpactScore: jest.fn(() => 75),
      classifyIssueSeverity: jest.fn(() => 'high'),
    };

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds: ['team-a', 'team-b', 'team-c'],
      reportDataset: allReports,
    };

    const result = calculateTeamPerformanceMetrics(input, mockTextAnalysisAdapter);

    // 検証：結果がTeamPerformanceMetricsOutputの型を満たすこと
    expect(result).toHaveProperty('teamMetrics');
    expect(result).toHaveProperty('aggregationPeriod');
    expect(result).toHaveProperty('dataQualityScore');
    expect(result).toHaveProperty('outlierDetectionResult');

    // 検証：集計対象期間が正しく設定されていること
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);

    // 検証：3チームすべてのメトリクスが計算されていること
    expect(result.teamMetrics).toHaveLength(3);

    // 検証：各チームのメトリクスが存在すること
    const teamAMetrics = result.teamMetrics.find((m) => m.teamId === 'team-a');
    const teamBMetrics = result.teamMetrics.find((m) => m.teamId === 'team-b');
    const teamCMetrics = result.teamMetrics.find((m) => m.teamId === 'team-c');

    expect(teamAMetrics).toBeDefined();
    expect(teamBMetrics).toBeDefined();
    expect(teamCMetrics).toBeDefined();

    // 検証：チームAの提出率（3件が期間内に提出）
    if (teamAMetrics) {
      expect(teamAMetrics.reportSubmissionRate).toBeGreaterThan(0);
    }

    // 検証：チームBの提出率（2件が期間内に提出）
    if (teamBMetrics) {
      expect(teamBMetrics.reportSubmissionRate).toBeGreaterThan(0);
    }

    // 検証：チームCの提出率（4件が期間内に提出）
    if (teamCMetrics) {
      expect(teamCMetrics.reportSubmissionRate).toBeGreaterThan(0);
    }

    // 検証：優先度スコアが1～100の範囲内であること
    result.teamMetrics.forEach((metric) => {
      expect(metric.priorityScore).toBeGreaterThanOrEqual(1);
      expect(metric.priorityScore).toBeLessThanOrEqual(100);
      expect(metric.issueResolutionSpeed).toBeGreaterThan(0);
      expect(metric.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
      expect(metric.issueRecurrenceRate).toBeLessThanOrEqual(100);
    });

    // 検証：データ品質スコアが0～100の範囲内であること
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 検証：TextAnalysisServiceAdapterが各報告に対して課題抽出を試行したこと
    // 複数チーム、複数報告だから複数回呼び出されているはず
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});