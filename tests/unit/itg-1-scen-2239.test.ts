import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  let mockTextAnalysisServiceAdapter: any;

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  // SCEN-2239
  test('teamIdがnullの日報オブジェクトを入力した場合、ValidationErrorが発生し処理は中断される', () => {
    const invalidReportData = {
      userId: 'user123',
      teamId: null,
      reportDate: '2026-08-20',
      content: '課題がある',
    };

    const extractInput = {
      teamId: invalidReportData.teamId,
      startDate: new Date('2026-08-20T00:00:00Z'),
      endDate: new Date('2026-08-20T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user123',
    };

    expect(() => {
      extractAndRankIssueKeywords(extractInput, mockTextAnalysisServiceAdapter);
    }).toThrow(/teamId/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});