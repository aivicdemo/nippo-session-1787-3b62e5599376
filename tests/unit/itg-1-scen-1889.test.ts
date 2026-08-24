import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題検索・ランク付け機能 - 権限検証', () => {
  // SCEN-1889
  test('ユーザーが開発部長の権限を保有していないとき、権限エラーが返される', () => {
    const testUserID = 'user-001';
    const teamID = 'team-alpha';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-07T23:59:59Z');

    const input: ExtractIssueKeywordsInput = {
      teamId: teamID,
      startDate: startDate,
      endDate: endDate,
      minFrequencyThreshold: 1,
      requestUserId: testUserID,
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockPermissionChecker = {
      hasManagerRole: jest.fn().mockReturnValue(false),
      getUserRole: jest.fn().mockReturnValue('employee'),
    };

    const mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    expect(() => {
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter, mockPermissionChecker, mockLogger);
    }).toThrow(/権限/);

    expect(mockPermissionChecker.hasManagerRole).toHaveBeenCalledWith(testUserID);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('権限外アクセス試行')
    );
  });
});