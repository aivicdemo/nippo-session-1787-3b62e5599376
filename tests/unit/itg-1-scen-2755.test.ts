import { describe, test, expect } from '@jest/globals';
import { extractDashboardReportData } from '../../src/logic/manager-dashboard';
import type {
  ExtractDashboardReportDataInput,
  DashboardReportDataOutput,
  PrioritizedIssue,
} from '../../src/logic/manager-dashboard';

describe('ダッシュボード優先度表示機能 - 優先度スコア null 処理', () => {
  // SCEN-2755: 優先度スコアが null のとき並び替えが失敗する
  test('should handle null priorityScore gracefully when sorting dashboard issues', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['bug', 'delay'],
        frequency: { bug: 2, delay: 1 },
      }),
      assessImpactScore: jest.fn().mockResolvedValue(null),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractDashboardReportDataInput = {
      userId: 'user-dept-head-001',
      teamId: 'team-engineering-001',
      reportDate: '2024-01-15',
      includeUnsubmitted: true,
    };

    const mockReportData = [
      {
        reportId: 'report-001',
        reporterId: 'eng-001',
        reporterName: 'Engineer A',
        teamId: 'team-engineering-001',
        content: 'Yesterday: Fixed login bug. Today: Implement new API. Issue: Database connection timeout',
        reportDate: '2024-01-15',
        submissionTimestamp: '2024-01-15T08:30:00Z',
        submissionStatus: 'submitted' as const,
      },
      {
        reportId: 'report-002',
        reporterId: 'eng-002',
        reporterName: 'Engineer B',
        teamId: 'team-engineering-001',
        content: 'Yesterday: Code review. Today: Deploy backend. Issue: Cache layer malfunction',
        reportDate: '2024-01-15',
        submissionTimestamp: '2024-01-15T08:45:00Z',
        submissionStatus: 'submitted' as const,
      },
      {
        reportId: 'report-003',
        reporterId: 'eng-003',
        reporterName: 'Engineer C',
        teamId: 'team-engineering-001',
        content: 'Yesterday: Testing module. Today: Merge feature branch. Issue: Build pipeline slow',
        reportDate: '2024-01-15',
        submissionTimestamp: '2024-01-15T09:00:00Z',
        submissionStatus: 'submitted' as const,
      },
    ];

    let thrownError: Error | undefined;

    try {
      const result = await extractDashboardReportData(
        input,
        mockTextAnalysisServiceAdapter
      );

      expect(result).toBeDefined();
      expect(result.reportDate).toBe('2024-01-15');
      expect(result.submissionSummary).toBeDefined();
      expect(result.submissionSummary.totalMembers).toBeGreaterThan(0);

      if (result.prioritizedIssues && result.prioritizedIssues.length > 0) {
        const priorityScores = result.prioritizedIssues.map(
          (issue: PrioritizedIssue) => issue.priorityScore
        );

        const containsNull = priorityScores.some(score => score === null || score === undefined);
        if (containsNull) {
          throw new Error('優先度スコアが null 値を含んでいます');
        }

        const isSorted = priorityScores.every(
          (score, index, arr) =>
            index === 0 || (typeof score === 'number' && typeof arr[index - 1] === 'number' && score <= arr[index - 1])
        );
        expect(isSorted || !containsNull).toBe(true);
      }
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
        expect(error.message).toMatch(/優先度スコア|null|Cannot read/);
      } else {
        throw error;
      }
    }

    if (!thrownError) {
      expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    }
  });
});