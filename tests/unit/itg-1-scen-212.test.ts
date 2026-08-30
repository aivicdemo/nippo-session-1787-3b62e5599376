import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssuesFromReports, type ExtractAndRankIssuesInput } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題抽出とランク付け', () => {
  // SCEN-212
  test('指定期間内に課題報告が存在しない場合、NoReportsProvidedError をスロー', () => {
    const input: ExtractAndRankIssuesInput = {
      reports: [],
      analysisStartDate: new Date('2026-01-01T00:00:00Z'),
      analysisEndDate: new Date('2026-01-31T23:59:59Z'),
      minimumConfidenceThreshold: 50,
    };

    expect(() => extractAndRankIssuesFromReports(input)).toThrow(/集約対象の日報が存在しません/);
  });
});