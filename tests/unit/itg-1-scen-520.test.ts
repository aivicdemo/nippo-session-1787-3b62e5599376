import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題自動抽出・優先度判定機能', () => {
  // SCEN-520
  test('[normal] 10名のチームメンバーから集約された日報0件の場合、空の優先度別課題一覧が生成される', () => {
    // テストデータセット準備: 10名のチームメンバーが存在し、当日の日報が0件の状態
    const teamId = 'team-001';
    const startDate = new Date('2024-01-15T00:00:00Z');
    const endDate = new Date('2024-01-15T23:59:59Z');
    const requestUserId = 'user-manager-001';

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    // TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // 課題自動抽出・優先度判定機能を実行
    const result = extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    // 戻り値の構造を検証
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('totalKeywordCount');
    expect(result).toHaveProperty('extractedAt');
    expect(result).toHaveProperty('analysisperiodDays');

    // 優先度別課題一覧が空であることを確認
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBe(0);
    expect(result.totalKeywordCount).toBe(0);

    // 分析対象期間の日数を検証
    expect(result.analysisperiodDays).toBe(1);

    // TextAnalysisServiceAdapterへのAPI呼び出しが発生していないことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();

    // extractedAtが現在時刻に近いことを検証（許容範囲: 1秒以内）
    const now = new Date();
    expect(Math.abs(result.extractedAt.getTime() - now.getTime())).toBeLessThan(1000);
  });
});