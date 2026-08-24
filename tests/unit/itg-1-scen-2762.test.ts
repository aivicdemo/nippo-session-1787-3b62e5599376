import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2762
  test('[error] 課題キーワード自動抽出機能 - TextAnalysisServiceAdapter が null を返すとき処理が失敗する', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue(null),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    const reportText = '昨日は機能Aの開発を進めた。今日は機能Bをテストする予定。課題として、データベース接続がタイムアウトしている';

    expect(() => {
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter, [reportText]);
    }).toThrow(/null|undefined|接続|タイムアウト/);
  });
});