import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1496
  test('日報データのタイムスタンプがnullのとき、エラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(() => {
        throw new Error('INVALID_TIMESTAMP: Report timestamp cannot be null');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const invalidReportData = {
      userId: 'user001',
      reportDate: null,
      yesterdayWork: '顧客A対応',
      todayWork: 'レビュー実施',
      issues: 'システムパフォーマンス低下',
    };

    const input = {
      teamId: 'team001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user_admin_001',
      reportDataList: [invalidReportData],
    };

    expect(() =>
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/INVALID_TIMESTAMP/);
  });
});