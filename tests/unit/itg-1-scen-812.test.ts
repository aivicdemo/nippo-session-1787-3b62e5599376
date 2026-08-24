import { describe, it, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出 - 過去7日間発生頻度0件のエッジケース', () => {
  let mockTextAnalysisAdapter: any;

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'サーバー障害',
            frequency: 1,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 60,
      }),
    };
  });

  // SCEN-812
  it('過去7日間の発生頻度がちょうど0回のとき、本日報告のみで優先度スコアが算出される', async () => {
    const today = new Date('2024-01-15T09:00:00Z');
    const thirtyDaysAgo = new Date('2023-12-16T09:00:00Z');

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバー障害が発生して復旧に時間がかかった',
      occurrenceFrequency: 0,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: today.toISOString(),
      teamId: 'team-dev-001',
    };

    const result = await calculateIssuePriorityScore(
      input,
      mockTextAnalysisAdapter
    );

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(60);
    expect(result.priorityRank).toBe('中');
    expect(result.scoreBreakdown.frequencyScore).toBe(0);
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(4);
    expect(result.colorCode).toBe('#FFFF00');
    expect(result.calculatedAt).toBeDefined();
  });
});