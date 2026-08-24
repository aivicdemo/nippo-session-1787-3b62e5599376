import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1180
  test('抽出対象の日報IDが空文字列のときエラーになる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockImplementation(() => {
        throw {
          code: 'INVALID_DAILY_REPORT_ID',
          message: '日報IDは空文字列では指定できません'
        };
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    expect(() => {
      extractAndRankIssueKeywords(
        input,
        mockTextAnalysisServiceAdapter
      );
    }).toThrow(/日報ID/);
  });
});