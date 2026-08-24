import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定・優先度スコア算出機能', () => {
  // SCEN-1634: [error] TextAnalysisServiceAdapter.assessImpactScore 呼び出し失敗時の 3 回リトライ後エラー返却
  test('assessImpactScore が常に失敗する場合、3 回のリトライ（3秒・10秒・30秒インターバル）を実行後、エラーステータス ASSESSMENT_MAX_RETRIES_EXCEEDED を返す', async () => {
    const mockRetryIntervals: number[] = [];
    let callCount = 0;

    const mockTextAnalysisServiceAdapter = {
      assessImpactScore: jest.fn(async () => {
        callCount += 1;
        if (callCount > 1) {
          mockRetryIntervals.push(Date.now());
        }
        throw new Error('API connection failed');
      }),
      extractKeywords: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const issuePriorityScoringInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: '納期遅延のリスクが高い',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01',
    };

    const startTime = Date.now();
    const result: IssuePriorityScoringOutput = await calculateIssuePriorityScore(
      issuePriorityScoringInput,
      mockTextAnalysisServiceAdapter
    );

    const totalElapsedTime = Date.now() - startTime;

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeUndefined();
    expect(result.priorityRank).toBeUndefined();
    expect(result.scoreBreakdown).toBeUndefined();
    expect(result.colorCode).toBeUndefined();
    expect(result.calculatedAt).toBeUndefined();

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(3);

    expect(callCount).toBe(3);

    expect(totalElapsedTime).toBeGreaterThanOrEqual(43000);

    expect(result.error).toBeDefined();
    expect(result.error?.status).toBe('error');
    expect(result.error?.code).toBe('ASSESSMENT_MAX_RETRIES_EXCEEDED');
    expect(result.error?.message).toMatch(/Impact score assessment failed after 3 retries/);

    expect(result.userMessage).toBe('課題分析が一時的に利用できません。手動入力をご利用ください');
  });
});