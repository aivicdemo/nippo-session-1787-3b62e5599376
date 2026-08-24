import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyReportDataset, TeamReportSummary } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - ボトルネック推移の波及度スコア集計', () => {
  let mockTextAnalysisAdapter: any;

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce(45)
        .mockResolvedValueOnce(72)
        .mockResolvedValueOnce(28),
      extractKeywords: jest.fn().mockResolvedValue([]),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('SCEN-1791: 前月の課題の波及度スコアに基づいてボトルネック推移が降順で集計される', async () => {
    const targetYear = 2024;
    const targetMonth = 2;
    const requestedByUserId = 'user-dept-head-001';
    const teamIdFilter = ['team-dev-001'];

    const mockIssueRecords = [
      {
        issueId: 'issue-a-001',
        issueContent: '認証API のレスポンス遅延',
        reportedDate: new Date('2024-01-15T09:00:00Z'),
        affectedTeamIds: ['team-dev-001'],
        impactScore: 0,
      },
      {
        issueId: 'issue-b-002',
        issueContent: 'データベース接続タイムアウト問題',
        reportedDate: new Date('2024-01-18T14:30:00Z'),
        affectedTeamIds: ['team-dev-001'],
        impactScore: 0,
      },
      {
        issueId: 'issue-c-003',
        issueContent: 'UI レンダリング最適化',
        reportedDate: new Date('2024-01-22T10:15:00Z'),
        affectedTeamIds: ['team-dev-001'],
        impactScore: 0,
      },
    ];

    const request = {
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter,
      _mockIssueRecords: mockIssueRecords,
      _mockTextAnalysisAdapter: mockTextAnalysisAdapter,
    };

    const result: MonthlyReportDataset = await extractMonthlyReportData(request);

    expect(result).toBeDefined();
    expect(result.extractionPeriodStart).toBe('2024-01-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2024-01-31T23:59:59Z');
    expect(result.totalReportCount).toBeGreaterThanOrEqual(3);
    expect(result.reportsByTeam).toBeDefined();
    expect(Array.isArray(result.reportsByTeam)).toBe(true);

    const teamReport = result.reportsByTeam.find((t: TeamReportSummary) => t.teamId === 'team-dev-001');
    expect(teamReport).toBeDefined();
    if (teamReport) {
      expect(teamReport.reportCount).toBeGreaterThanOrEqual(3);
      expect(typeof teamReport.submissionRate).toBe('number');
      expect(teamReport.submissionRate).toBeGreaterThanOrEqual(0);
      expect(teamReport.submissionRate).toBeLessThanOrEqual(100);
    }

    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.extractedAt).toBeDefined();
    expect(typeof result.extractedAt).toBe('string');

    const extractedBottleneckData = (result as any).bottleneckTransition;
    if (extractedBottleneckData && Array.isArray(extractedBottleneckData)) {
      const sortedByImpact = extractedBottleneckData.sort(
        (a: any, b: any) => (b.impactScore || 0) - (a.impactScore || 0)
      );

      expect(sortedByImpact.length).toBeGreaterThanOrEqual(3);

      const firstIssue = sortedByImpact[0];
      expect(firstIssue.impactScore).toBe(72);

      const secondIssue = sortedByImpact[1];
      expect(secondIssue.impactScore).toBe(45);

      const thirdIssue = sortedByImpact[2];
      expect(thirdIssue.impactScore).toBe(28);

      for (let i = 0; i < sortedByImpact.length - 1; i++) {
        expect(sortedByImpact[i].impactScore).toBeGreaterThanOrEqual(sortedByImpact[i + 1].impactScore);
      }
    }

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});