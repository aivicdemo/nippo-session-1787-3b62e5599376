import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyReportDataset } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - 同日抽出（SCEN-1781）', () => {
  // SCEN-1781
  test('抽出開始日と終了日が同日（1日のみ）の場合にデータを正常抽出する', () => {
    const extractionStartDate = new Date('2026-01-15T00:00:00.000Z');
    const extractionEndDate = new Date('2026-01-15T23:59:59.999Z');
    const targetYear = 2026;
    const targetMonth = 1;
    const requestedByUserId = 'user-001';

    const mockReportRecords = [
      {
        reportId: 'report-001',
        reportDate: new Date('2026-01-15T09:30:00.000Z'),
        teamId: 'team-001',
        memberId: 'member-001',
        yesterdayAccomplishment: 'タスクA完了',
        todayPlan: 'タスクB開始',
        currentIssue: '環境構築に遅延',
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2026-01-15T10:00:00.000Z'),
        teamId: 'team-001',
        memberId: 'member-002',
        yesterdayAccomplishment: 'レビュー実施',
        todayPlan: 'マージ作業',
        currentIssue: 'ネットワーク問題',
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2026-01-15T10:15:00.000Z'),
        teamId: 'team-001',
        memberId: 'member-003',
        yesterdayAccomplishment: 'テスト実施',
        todayPlan: 'バグ修正',
        currentIssue: 'パフォーマンス低下',
      },
      {
        reportId: 'report-004',
        reportDate: new Date('2026-01-15T11:00:00.000Z'),
        teamId: 'team-001',
        memberId: 'member-004',
        yesterdayAccomplishment: 'ドキュメント作成',
        todayPlan: 'リリース準備',
        currentIssue: 'スケジュール圧迫',
      },
      {
        reportId: 'report-005',
        reportDate: new Date('2026-01-15T11:30:00.000Z'),
        teamId: 'team-001',
        memberId: 'member-005',
        yesterdayAccomplishment: 'デプロイ実行',
        todayPlan: 'モニタリング',
        currentIssue: 'リソース不足',
      },
    ];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(() => ({
        keywords: [
          { keyword: '環境構築', frequency: 1, impactScore: 75 },
          { keyword: 'ネットワーク問題', frequency: 1, impactScore: 70 },
          { keyword: 'パフォーマンス低下', frequency: 1, impactScore: 80 },
          { keyword: 'スケジュール圧迫', frequency: 1, impactScore: 85 },
          { keyword: 'リソース不足', frequency: 1, impactScore: 72 },
        ],
      })),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          '環境構築': 75,
          'ネットワーク問題': 70,
          'パフォーマンス低下': 80,
          'スケジュール圧迫': 85,
          'リソース不足': 72,
        };
        return scoreMap[keyword] || 50;
      }),
      classifyIssueSeverity: jest.fn((keyword: string) => {
        const severityMap: Record<string, string> = {
          'スケジュール圧迫': 'high',
          'パフォーマンス低下': 'high',
          'リソース不足': 'medium',
          'ネットワーク問題': 'medium',
          '環境構築': 'medium',
        };
        return severityMap[keyword] || 'low';
      }),
    };

    const result: MonthlyReportDataset = extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId,
        teamIdFilter: ['team-001'],
      },
      mockReportRecords,
      mockTextAnalysisServiceAdapter
    );

    expect(result.extractionPeriodStart).toBe('2026-01-15T00:00:00.000Z');
    expect(result.extractionPeriodEnd).toBe('2026-01-15T23:59:59.999Z');

    expect(result.totalReportCount).toBe(5);

    expect(result.reportsByTeam).toHaveLength(1);
    const teamSummary = result.reportsByTeam[0];
    expect(teamSummary.teamId).toBe('team-001');
    expect(teamSummary.reportCount).toBe(5);
    expect(teamSummary.submissionRate).toBe(100);
    expect(teamSummary.reportIds).toEqual([
      'report-001',
      'report-002',
      'report-003',
      'report-004',
      'report-005',
    ]);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.extractedAt).toBeDefined();
    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate.getTime()).toBeGreaterThan(
      new Date('2026-01-14T00:00:00.000Z').getTime()
    );
  });
});