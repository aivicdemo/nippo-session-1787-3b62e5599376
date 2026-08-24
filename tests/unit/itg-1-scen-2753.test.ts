import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractDashboardReportData } from '../../src/logic/manager-dashboard';

describe('Manager Dashboard - Priority Score and Color Coding', () => {
  test('SCEN-2753: Dashboard displays prioritized issues with both score and color coding', async () => {
    const userId = 'user-department-head-001';
    const teamId = 'team-engineering-001';
    const reportDate = '2024-01-15';

    const mockReportData = [
      {
        reportId: 'report-001',
        reporterId: 'engineer-001',
        reporterName: 'Engineer One',
        teamId: teamId,
        teamName: 'Engineering Team',
        content: 'System outage occurred during deployment',
        reportDate: reportDate,
        submissionTimestamp: '2024-01-15T08:30:00Z',
        issues: [
          {
            issueId: 'issue-001',
            issueContent: 'システム障害',
            priorityScore: 85,
            priorityColor: 'red',
            impactLevel: 'high',
          },
        ],
      },
      {
        reportId: 'report-002',
        reporterId: 'engineer-002',
        reporterName: 'Engineer Two',
        teamId: teamId,
        teamName: 'Engineering Team',
        content: 'Team capacity insufficient for sprint tasks',
        reportDate: reportDate,
        submissionTimestamp: '2024-01-15T08:45:00Z',
        issues: [
          {
            issueId: 'issue-002',
            issueContent: '人員不足',
            priorityScore: 60,
            priorityColor: 'yellow',
            impactLevel: 'medium',
          },
        ],
      },
      {
        reportId: 'report-003',
        reporterId: 'engineer-003',
        reporterName: 'Engineer Three',
        teamId: teamId,
        teamName: 'Engineering Team',
        content: 'Resource allocation needs review due to budget cuts',
        reportDate: reportDate,
        submissionTimestamp: '2024-01-15T09:00:00Z',
        issues: [
          {
            issueId: 'issue-003',
            issueContent: '予算削減',
            priorityScore: 40,
            priorityColor: 'green',
            impactLevel: 'low',
          },
        ],
      },
    ];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害', '人員不足', '予算削減'],
        frequencies: [3, 2, 1],
      }),
      assessImpactScore: jest.fn((content: string) => {
        if (content.includes('システム障害')) {
          return Promise.resolve(85);
        } else if (content.includes('人員不足')) {
          return Promise.resolve(60);
        } else if (content.includes('予算削減')) {
          return Promise.resolve(40);
        }
        return Promise.resolve(0);
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    const input = {
      userId: userId,
      teamId: teamId,
      reportDate: reportDate,
      includeUnsubmitted: true,
    };

    const result = await extractDashboardReportData(
      input,
      mockTextAnalysisServiceAdapter,
      mockNotificationServiceAdapter,
      mockReportData,
    );

    expect(result).toBeDefined();
    expect(result.reportDate).toBe(reportDate);

    expect(result.prioritizedIssues).toHaveLength(3);

    expect(result.prioritizedIssues[0]).toEqual(
      expect.objectContaining({
        issueId: 'issue-001',
        issueContent: 'システム障害',
        priorityScore: 85,
        priorityColor: 'red',
        impactLevel: 'high',
        reporterName: 'Engineer One',
      }),
    );

    expect(result.prioritizedIssues[1]).toEqual(
      expect.objectContaining({
        issueId: 'issue-002',
        issueContent: '人員不足',
        priorityScore: 60,
        priorityColor: 'yellow',
        impactLevel: 'medium',
        reporterName: 'Engineer Two',
      }),
    );

    expect(result.prioritizedIssues[2]).toEqual(
      expect.objectContaining({
        issueId: 'issue-003',
        issueContent: '予算削減',
        priorityScore: 40,
        priorityColor: 'green',
        impactLevel: 'low',
        reporterName: 'Engineer Three',
      }),
    );

    expect(result.prioritizedIssues[0].priorityScore).toBeGreaterThan(
      result.prioritizedIssues[1].priorityScore,
    );
    expect(result.prioritizedIssues[1].priorityScore).toBeGreaterThan(
      result.prioritizedIssues[2].priorityScore,
    );

    const scoreColorMapping = {
      85: 'red',
      60: 'yellow',
      40: 'green',
    };

    result.prioritizedIssues.forEach((issue) => {
      const expectedColor = scoreColorMapping[issue.priorityScore as keyof typeof scoreColorMapping];
      expect(issue.priorityColor).toBe(expectedColor);
    });

    expect(result.submissionSummary).toEqual(
      expect.objectContaining({
        totalMembers: 3,
        submittedCount: 3,
        unsubmittedCount: 0,
        submissionRate: 100,
      }),
    );

    expect(result.lastUpdatedAt).toBeDefined();
    const lastUpdatedTime = new Date(result.lastUpdatedAt);
    expect(lastUpdatedTime.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });
});