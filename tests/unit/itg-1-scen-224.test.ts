import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題抽出・優先度付け', () => {
  test('SCEN-224: 当月の日報データが空のときエラーを発生させる', () => {
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');
    const minimumConfidenceThreshold = 50;

    const input = {
      reports: [],
      analysisStartDate,
      analysisEndDate,
      minimumConfidenceThreshold,
    };

    expect(() => {
      extractAndRankIssuesFromReports(input);
    }).toThrow(/集約対象の日報が存在しません/);
  });
});