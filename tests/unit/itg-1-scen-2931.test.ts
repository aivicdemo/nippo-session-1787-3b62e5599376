import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-2931
  test('報告者ユーザーIDが空文字列のとき、処理を中断してエラーを返す', () => {
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: '',
    };

    expect(() =>
      extractAndRankIssueKeywords(input, textAnalysisServiceAdapterStub)
    ).toThrow(/ユーザーID|報告者/);

    expect(textAnalysisServiceAdapterStub.extractKeywords).not.toHaveBeenCalled();
  });
});