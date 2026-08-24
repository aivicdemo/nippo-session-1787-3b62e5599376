import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1172
  test('日報から0件の課題キーワードが抽出された場合、空の一覧が返される', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportContent = {
      yesterday: 'タスクA完了',
      today: 'タスクB開始',
      challenges: '特になし',
    };

    const result = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      reportContent
    ) as RankedIssueKeywordList;

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      reportContent.challenges
    );
    expect(result.keywords).toEqual([]);
    expect(result.totalKeywordCount).toBe(0);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(1);
  });
});