import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能', () => {
  test('SCEN-1320: 日報IDが空文字列のとき例外を発生させる', () => {
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const emptyReportId = '';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-15T00:00:00Z');
    const endDate = new Date('2024-01-21T23:59:59Z');

    expect(() => {
      extractAndRankIssueKeywords(
        {
          teamId,
          startDate,
          endDate,
          minFrequencyThreshold: 1,
          requestUserId: 'user-001',
        },
        textAnalysisServiceAdapterStub,
        emptyReportId,
      );
    }).toThrow(/報告ID|報告|ID|空/);

    expect(textAnalysisServiceAdapterStub.extractKeywords).not.toHaveBeenCalled();
    expect(textAnalysisServiceAdapterStub.assessImpactScore).not.toHaveBeenCalled();
    expect(textAnalysisServiceAdapterStub.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});