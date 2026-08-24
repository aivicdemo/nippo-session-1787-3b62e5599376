import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1486
  test('各日報の「抱えている課題」項目が空文字列のとき、エラーを返す', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportData = {
      reportId: 'report-001',
      teamId: 'team-123',
      yesterdayAccomplishment: '昨日は顧客対応を3件処理した',
      todayPlan: '今日はシステムテストを実施予定',
      challengeIssue: '',
    };

    expect(() =>
      extractAndRankIssueKeywords(
        reportData,
        mockTextAnalysisAdapter,
      ),
    ).toThrow(/INVALID_ISSUE_FIELD_EMPTY/);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});