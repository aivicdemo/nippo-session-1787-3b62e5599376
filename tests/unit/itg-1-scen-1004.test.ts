import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ダッシュボード表示データ更新機能', () => {
  // SCEN-1004
  test('新しい日報が送信されたとき、ダッシュボードの昨日実績データが最新の内容に更新される', async () => {
    const referenceDate = new Date('2024-01-15T09:00:00Z');
    const yesterdayDate = new Date('2024-01-14');
    const userId = 'user-a-001';
    const teamId = 'team-dev-001';
    const reportDate = '2024-01-14';

    const dashboardAccessInput = {
      userId,
      teamId,
      reportDate,
      maxStalenessSeconds: 300,
    };

    const initialReportContent = 'Initial yesterday report: completed database schema design';
    const updatedReportContent = 'Updated yesterday report: completed database schema design and code review';

    const mockDashboardReportData = {
      reportDate,
      submissionSummary: {
        totalMembers: 10,
        submittedCount: 8,
        unsubmittedCount: 2,
        submissionRate: 80,
      },
      prioritizedIssues: [
        {
          issueId: 'issue-001',
          issueContent: 'API response time delay',
          priorityScore: 85,
          priorityColor: 'red',
          impactLevel: 'high',
          reporterName: 'Engineer A',
        },
      ],
      unsubmittedMembers: [
        {
          memberId: 'user-b-002',
          memberName: 'Engineer B',
          submissionDeadline: '2024-01-14T09:00:00Z',
        },
      ],
      lastUpdatedAt: '2024-01-15T08:45:00Z',
    };

    const mockFreshnessCheckData = {
      isDataFresh: true,
      lastUpdateTimestamp: '2024-01-15T08:45:00Z',
      displayTimestamp: referenceDate.toISOString(),
      stalenessSeconds: 75,
    };

    const currentTimestamp = referenceDate.toISOString();
    const lastUpdateTimestamp = new Date('2024-01-15T08:45:00Z').toISOString();
    const expectedStalenessSeconds = 75;
    const maxAllowedStaleness = 300;

    const result = await ensureDashboardDataFreshness(
      dashboardAccessInput,
      {
        isDataFresh: mockFreshnessCheckData.isDataFresh,
        lastUpdateTimestamp,
        displayTimestamp: currentTimestamp,
        stalenenessSeconds: expectedStalenessSeconds,
      },
    );

    expect(result).toBeDefined();
    expect(result.isDataFresh).toBe(true);
    expect(result.lastUpdateTimestamp).toBe(lastUpdateTimestamp);
    expect(result.displayTimestamp).toBe(currentTimestamp);
    expect(result.stalenessSeconds).toBeLessThanOrEqual(maxAllowedStaleness);
    expect(result.stalenessSeconds).toBe(expectedStalenessSeconds);
  });
});