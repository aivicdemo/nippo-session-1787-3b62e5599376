import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能', () => {
  test('SCEN-1631: TextAnalysisServiceAdapter.extractKeywords が 30 秒のタイムアウトに達したとき、リトライを実行し全て失敗後は処理を中止しエラーを返す', async () => {
    const testInputText = 'システム障害が発生した。データベース接続エラーが継続している。課題対応中。';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-001';

    let callCount = 0;
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async () => {
        callCount++;
        const error = new Error('API call timeout');
        (error as any).code = 'TIMEOUT';
        throw error;
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(typeof result).toBe('object');

    if ('code' in result && 'message' in result && 'retryCount' in result) {
      expect(result.code).toBe('TIMEOUT_MAX_RETRIES_EXCEEDED');
      expect(result.message).toBe('キーワード抽出がタイムアウトしました。手動入力をご利用ください。');
      expect(result.retryCount).toBe(3);
    }

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);
  });
});