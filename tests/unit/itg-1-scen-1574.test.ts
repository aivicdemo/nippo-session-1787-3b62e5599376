import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - Issue Keyword Extraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1574
  test('should throw error when issue ranking lacks required field (issue keyword)', async () => {
    const aggregationStartDate = '2024-01-08';
    const aggregationEndDate = '2024-01-14';
    const teamId = 'team-001';

    const extractedIssuesWithMissingKeyword = [
      {
        issueId: 'issue-001',
        issueKeyword: 'API Gateway timeout',
        occurrenceCount: 3,
        impactScore: 85,
      },
      {
        issueId: 'issue-002',
        issueKeyword: '',
        occurrenceCount: 2,
        impactScore: 60,
      },
      {
        issueId: 'issue-003',
        issueKeyword: 'Database connection pool exhaustion',
        occurrenceCount: 5,
        impactScore: 95,
      },
      {
        issueId: 'issue-004',
        issueKeyword: 'Memory leak in worker thread',
        occurrenceCount: 4,
        impactScore: 80,
      },
      {
        issueId: 'issue-005',
        issueKeyword: 'SSL certificate validation',
        occurrenceCount: 2,
        impactScore: 70,
      },
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate,
      aggregationEndDate,
      extractedIssues: extractedIssuesWithMissingKeyword,
      teamId,
    };

    expect(() => generateWeeklyAnalysisReport(input)).toThrow(/課題キーワード/);
  });
});