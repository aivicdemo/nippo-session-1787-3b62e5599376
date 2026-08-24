import { describe, test, expect, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-568: [error] 課題優先度判定機能 - 抽出課題リストが空配列のとき影響度スコア計算スキップされる
  test('抽出課題リストが空配列のとき、影響度スコア計算処理がスキップされ、エラーを発生させずに処理を完了する', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout occurred',
      occurrenceFrequency: 3,
      impactScore: 45,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeNull();
  });
});