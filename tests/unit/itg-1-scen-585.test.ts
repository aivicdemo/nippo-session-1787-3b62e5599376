import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

// Mock TextAnalysisServiceAdapter
const mockTextAnalysisServiceAdapter = {
  extractKeywords: jest.fn(),
  assessImpactScore: jest.fn(),
  classifyIssueSeverity: jest.fn(),
};

describe('課題優先度判定機能 - 外部サービス失敗時の振る舞い', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  // SCEN-585: TextAnalysisServiceAdapterが3回リトライ後も失敗したとき処理が中断される
  test('should return analysis failed error after 3 retries when TextAnalysisServiceAdapter fails consistently', async () => {
    // Arrange: TextAnalysisServiceAdapterのclassifyIssueSeverityを3回連続で失敗するように設定
    const timeoutError = new Error('TimeoutError');
    mockTextAnalysisServiceAdapter.classifyIssueSeverity
      .mockRejectedValueOnce(timeoutError)  // 1回目の失敗
      .mockRejectedValueOnce(timeoutError)  // 2回目の失敗
      .mockRejectedValueOnce(timeoutError); // 3回目の失敗

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース障害が発生した',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    // Act & Assert: 3回のリトライと段階的なインターバルを検証
    const resultPromise = calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);

    // 1回目の失敗後、3秒のインターバルで再試行されることを確認
    await jest.advanceTimersByTimeAsync(3000);
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(2);

    // 2回目の失敗後、10秒のインターバルで再試行されることを確認
    await jest.advanceTimersByTimeAsync(10000);
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(3);

    // 3回目の失敗後、30秒のインターバルで再試行されることを確認
    await jest.advanceTimersByTimeAsync(30000);
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(4);

    const result = await resultPromise;

    // Assert: 3回のリトライがすべて失敗した後の状態を検証
    // (1) ユーザーへの戻り値として課題分析失敗を示す構造化エラーオブジェクトが返される
    expect(result).toEqual({
      errorCode: 'ANALYSIS_FAILED',
      message: '課題分析が一時的に利用できません。手動入力をご利用ください',
      issueId: 'issue-001',
    });

    // (3) 課題優先度スコア（0-100）の算出は実行されず、スコア値はnullまたはundefinedのまま
    expect((result as any).priorityScore).toBeUndefined();

    // (4) TextAnalysisServiceAdapterの呼び出し回数を確認（初回1回 + リトライ3回 = 4回）
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(4);

    jest.useRealTimers();
  });
});