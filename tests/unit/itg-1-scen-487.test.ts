import { analyzeIssuePatternsByTimeRange } from '../../src/logic/issue-pattern-analysis';

describe('朝会報告管理システム - 課題パターン分析', () => {
  // SCEN-487
  test('指定期間内に課題データが存在しない場合、InsufficientDataErrorを発生させる', () => {
    const request = {
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: new Date('2025-01-31T23:59:59Z'),
      periodGranularity: 'daily' as const,
      teamId: null,
    };

    expect(() => analyzeIssuePatternsByTimeRange(request)).toThrow(/指定された期間内に分析対象の課題データが見つかりません/);
  });
});