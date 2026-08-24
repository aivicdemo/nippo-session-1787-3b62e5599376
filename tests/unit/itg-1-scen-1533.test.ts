import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能 - 優先度ランク決定ロジック', () => {
  test('SCEN-1533: 優先度ランク判定基準値が未設定のときエラーを発生させる', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続がタイムアウトする',
      occurrenceFrequency: 15,
      impactScore: 85,
      affectedTeamCount: 4,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01',
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'database', frequency: 10 },
        { keyword: 'timeout', frequency: 8 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(85),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const priorityThresholdConfig = {
      highPriorityThreshold: undefined,
      mediumPriorityThreshold: undefined,
    };

    expect(() =>
      calculateIssuePriorityScore(
        input,
        mockTextAnalysisServiceAdapter,
        priorityThresholdConfig
      )
    ).toThrow(/優先度ランク閾値|基準値|初期化/);
  });
});