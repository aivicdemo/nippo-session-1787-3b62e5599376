import { analyzeIssueRecurrencePatterns } from '../../src/logic/report-search-and-retrieval';

describe('朝会報告管理システム - 課題再発パターン分析', () => {
  // SCEN-114: 指定期間内の課題データから再発パターンを時系列で分析し、ボトルネック変化を可視化レポートとして出力する - 指定された開始日が終了日より後である場合、分析期間の開始日は終了日以前である必要があります
  test('should throw error when startDate is after endDate', () => {
    const input = {
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-10T00:00:00Z'),
      requestingUserId: 'user-001'
    };

    expect(() => analyzeIssueRecurrencePatterns(input)).toThrow(/分析期間/);
  });
});