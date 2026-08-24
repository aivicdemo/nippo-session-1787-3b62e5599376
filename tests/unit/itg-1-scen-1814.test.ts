import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - TextAnalysisServiceAdapter エラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1814
  test('TextAnalysisServiceAdapter が課題キーワード抽出に失敗した場合、レポート生成時にエラーが throws される', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(new Error('IOException: Connection timeout')),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-001';
    const teamIdFilter = ['team-001', 'team-002'];

    const dailyReports = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-01T08:00:00Z'),
        teamId: 'team-001',
        content: {
          yesterday: 'Fixed bug in authentication module',
          today: 'Implement new feature for dashboard',
          issues: 'Database connection timeout in production environment. Network latency increasing.',
        },
        submittedAt: new Date('2024-01-01T08:30:00Z'),
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-02T08:00:00Z'),
        teamId: 'team-001',
        content: {
          yesterday: 'Completed dashboard UI design review',
          today: 'Integrate payment gateway API',
          issues: 'Database connection timeout recurring. Memory leak detected in worker process.',
        },
        submittedAt: new Date('2024-01-02T08:30:00Z'),
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-01-03T08:00:00Z'),
        teamId: 'team-002',
        content: {
          yesterday: 'Reviewed code for API endpoints',
          today: 'Deploy to staging environment',
          issues: 'API response time degradation. Server CPU utilization high.',
        },
        submittedAt: new Date('2024-01-03T08:30:00Z'),
      },
    ];

    await expect(
      extractMonthlyReportData(
        {
          targetYear,
          targetMonth,
          requestedByUserId,
          teamIdFilter,
        },
        mockTextAnalysisAdapter,
        dailyReports
      )
    ).rejects.toThrow(/課題キーワード抽出/);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});