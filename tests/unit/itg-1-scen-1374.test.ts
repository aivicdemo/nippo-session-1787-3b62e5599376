import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Issue Keywords', () => {
  // SCEN-1374
  test('should throw InvalidIssueHierarchyError when parent issue ID is included in children list', () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-07T23:59:59Z';

    const reportDataList = [
      {
        id: 'report-001',
        teamId: 'team-001',
        createdAt: '2024-01-01T09:00:00Z',
        yesterdayAccomplishments: 'Completed task A',
        todayPlans: 'Work on task B',
        challenges: 'TASK-100 blocking, TASK-101 related issue',
      },
      {
        id: 'report-002',
        teamId: 'team-001',
        createdAt: '2024-01-02T09:00:00Z',
        yesterdayAccomplishments: 'Completed task B',
        todayPlans: 'Work on task C',
        challenges: 'TASK-100 needs review, TASK-102 delay detected',
      },
      {
        id: 'report-003',
        teamId: 'team-001',
        createdAt: '2024-01-03T09:00:00Z',
        yesterdayAccomplishments: 'Completed task C',
        todayPlans: 'Work on task D',
        challenges: 'TASK-103 integration problem',
      },
    ];

    expect(() =>
      extractAndRankIssueKeywords({
        reportDataList,
        analysisStartDate,
        analysisEndDate,
        minFrequencyThreshold: 1,
      })
    ).toThrow(/親課題IDが子課題リストに含まれています|Parent issue.*children/i);
  });
});