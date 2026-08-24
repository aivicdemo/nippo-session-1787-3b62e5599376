import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type TextAnalysisServiceAdapter } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1487
  test('各日報の「抱えている課題」項目がnullのとき、エラーを返す', () => {
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportWithNullChallenge = {
      reportId: 'report-001',
      teamId: 'team-001',
      reporterId: 'engineer-001',
      yesterdayAccomplishments: 'タスク A を完了した',
      todayPlans: 'タスク B を開始する',
      challengesText: null,
      reportedAt: new Date('2024-01-15T09:00:00Z'),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    expect(() =>
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter, [
        reportWithNullChallenge,
      ])
    ).toThrow(/抱えている課題項目がnull/);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});