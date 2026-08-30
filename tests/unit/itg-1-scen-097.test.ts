import { analyzeIssuePatternsByTimeRange } from '../../src/logic/issue-pattern-analysis';
import { type IssuePatternAnalysisRequest } from '../../src/logic/issue-pattern-analysis';

describe('朝会報告管理システム - 課題パターン分析', () => {
  // SCEN-097
  test('指定された開始日が終了日より後である場合、分析対象期間が無効というエラーをスロー', () => {
    const invalidRequest: IssuePatternAnalysisRequest = {
      startDate: new Date('2026-01-15T00:00:00Z'),
      endDate: new Date('2026-01-10T00:00:00Z'),
      periodGranularity: 'daily',
      teamId: null,
    };

    expect(() => analyzeIssuePatternsByTimeRange(invalidRequest)).toThrow(
      /分析対象期間が無効です/
    );
  });
});