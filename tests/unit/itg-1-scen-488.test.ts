import { analyzeIssuePatternsByTimeRange } from '../../src/logic/issue-pattern-analysis';

describe('analyzeIssuePatternsByTimeRange', () => {
  test('SCEN-488: should throw error when periodGranularity is invalid value other than daily, weekly, or monthly', async () => {
    const invalidRequest = {
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      periodGranularity: 'quarterly' as any,
      teamId: null,
    };

    expect(() => analyzeIssuePatternsByTimeRange(invalidRequest)).toThrow(/期間区分は日次・週次・月次から選択してください/);
  });
});