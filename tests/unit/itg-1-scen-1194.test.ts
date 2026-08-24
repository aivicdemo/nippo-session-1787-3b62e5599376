import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1194
  test('TextAnalysisServiceAdapter の呼び出しが API エラーを返すとき 3 回再試行後エラーになる', async () => {
    let callCount = 0;
    const callHistory: Array<{ attemptNumber: number; timestamp: Date }> = [];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async () => {
        callCount += 1;
        callHistory.push({
          attemptNumber: callCount,
          timestamp: new Date(),
        });

        if (callCount === 1) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          throw new Error('API Error: 503 Service Unavailable');
        }
        if (callCount === 2) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          throw new Error('API Error: 503 Service Unavailable');
        }
        if (callCount === 3) {
          await new Promise((resolve) => setTimeout(resolve, 10000));
          throw new Error('API Error: 503 Service Unavailable');
        }
        if (callCount === 4) {
          await new Promise((resolve) => setTimeout(resolve, 30000));
          throw new Error('API Error: 503 Service Unavailable');
        }
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const extractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportText =
      '昨日はバグ修正、今日は機能開発、課題は納期調整';

    let errorThrown: Error | null = null;
    let result: any = null;

    try {
      result = await extractAndRankIssueKeywords(
        extractIssueKeywordsInput,
        reportText,
        mockTextAnalysisAdapter
      );
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(callCount).toBe(4);
    expect(callHistory.length).toBe(4);
    expect(callHistory[0].attemptNumber).toBe(1);
    expect(callHistory[1].attemptNumber).toBe(2);
    expect(callHistory[2].attemptNumber).toBe(3);
    expect(callHistory[3].attemptNumber).toBe(4);

    expect(errorThrown).not.toBeNull();
    expect(errorThrown).toBeInstanceOf(Error);
    expect(errorThrown?.message).toMatch(/503|Service Unavailable/);

    expect(result).toBeNull();

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(4);
  });
});