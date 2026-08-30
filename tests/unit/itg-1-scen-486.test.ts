import { analyzeIssuePatternsByTimeRange } from '../../src/logic/issue-pattern-analysis';

describe('朝会報告管理システム - 課題パターン分析', () => {
  // SCEN-486: 分析開始日が分析終了日より後のときはエラーをスロー
  test('should throw InvalidDateRangeError when startDate is after endDate', () => {
    const startDate = new Date('2025-01-15T00:00:00Z');
    const endDate = new Date('2025-01-10T00:00:00Z');
    const periodGranularity = 'daily';
    const teamId = null;

    const request = {
      startDate,
      endDate,
      periodGranularity: periodGranularity as 'daily' | 'weekly' | 'monthly',
      teamId,
    };

    expect(() => analyzeIssuePatternsByTimeRange(request)).toThrow(/分析対象期間/);
  });
});