import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractDashboardReportData, type ExtractDashboardReportDataInput, type DashboardReportDataOutput, type PrioritizedIssue } from '../../src/logic/manager-dashboard';

describe('Manager Dashboard - Prioritized Issues Sorting', () => {
  // SCEN-2742
  test('should display issues sorted by priority score in ascending order', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractDashboardReportDataInput = {
      userId: 'manager-001',
      teamId: 'team-dev-001',
      reportDate: '2024-01-15',
      includeUnsubmitted: true,
    };

    const mockReports = [
      {
        reportId: 'report-001',
        reporterId: 'engineer-001',
        reporterName: 'Engineer A',
        teamId: 'team-dev-001',
        content: 'Yesterday: completed feature X. Today: start feature Y. Issues: database connection timeout',
        submissionStatus: 'submitted' as const,
        submissionTimestamp: '2024-01-15T08:30:00Z',
      },
      {
        reportId: 'report-002',
        reporterId: 'engineer-002',
        reporterName: 'Engineer B',
        teamId: 'team-dev-001',
        content: 'Yesterday: fixed bug in module Z. Today: code review. Issues: API rate limit exceeded',
        submissionStatus: 'submitted' as const,
        submissionTimestamp: '2024-01-15T08:35:00Z',
      },
      {
        reportId: 'report-003',
        reporterId: 'engineer-003',
        reporterName: 'Engineer C',
        teamId: 'team-dev-001',
        content: 'Yesterday: unit tests completed. Today: integration testing. Issues: memory leak in cache layer',
        submissionStatus: 'submitted' as const,
        submissionTimestamp: '2024-01-15T08:40:00Z',
      },
    ];

    const mockExtractedIssues: PrioritizedIssue[] = [
      {
        issueId: 'issue-C',
        issueContent: 'memory leak in cache layer',
        priorityScore: 8,
        priorityColor: 'green',
        impactLevel: 'low',
        reporterName: 'Engineer C',
      },
      {
        issueId: 'issue-A',
        issueContent: 'database connection timeout',
        priorityScore: 15,
        priorityColor: 'green',
        impactLevel: 'low',
        reporterName: 'Engineer A',
      },
      {
        issueId: 'issue-D',
        issueContent: 'API rate limit exceeded',
        priorityScore: 23,
        priorityColor: 'yellow',
        impactLevel: 'medium',
        reporterName: 'Engineer B',
      },
      {
        issueId: 'issue-B',
        issueContent: 'API rate limit exceeded',
        priorityScore: 42,
        priorityColor: 'red',
        impactLevel: 'high',
        reporterName: 'Engineer B',
      },
    ];

    mockTextAnalysisService.extractKeywords.mockResolvedValue({
      keywords: ['database connection timeout', 'API rate limit exceeded', 'memory leak in cache layer'],
      frequencies: [1, 1, 1],
    });

    mockTextAnalysisService.assessImpactScore.mockImplementation((keyword: string) => {
      const scoreMap: Record<string, number> = {
        'database connection timeout': 15,
        'API rate limit exceeded': 42,
        'memory leak in cache layer': 8,
      };
      return Promise.resolve(scoreMap[keyword] || 0);
    });

    const result: DashboardReportDataOutput = await extractDashboardReportData(
      input,
      mockTextAnalysisService,
      mockReports
    );

    expect(result.prioritizedIssues).toHaveLength(4);
    expect(result.prioritizedIssues[0].priorityScore).toBe(8);
    expect(result.prioritizedIssues[0].issueId).toBe('issue-C');
    expect(result.prioritizedIssues[1].priorityScore).toBe(15);
    expect(result.prioritizedIssues[1].issueId).toBe('issue-A');
    expect(result.prioritizedIssues[2].priorityScore).toBe(23);
    expect(result.prioritizedIssues[2].issueId).toBe('issue-D');
    expect(result.prioritizedIssues[3].priorityScore).toBe(42);
    expect(result.prioritizedIssues[3].issueId).toBe('issue-B');

    for (let i = 0; i < result.prioritizedIssues.length - 1; i++) {
      expect(result.prioritizedIssues[i].priorityScore).toBeLessThanOrEqual(
        result.prioritizedIssues[i + 1].priorityScore
      );
    }
  });
});