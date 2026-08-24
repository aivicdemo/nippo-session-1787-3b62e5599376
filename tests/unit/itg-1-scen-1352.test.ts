import { describe, it, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  it('SCEN-1352: 影響度スコアの算出で小数点以下が生じた場合、丸め処理が正確に実行される', () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'システム障害', frequency: 1 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(66.67),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const input = {
      issueId: 'issue-001',
      issueContent: 'システム障害が発生し、全チームの業務が停止している状況',
      occurrenceFrequency: 3,
      impactScore: 66.67,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    // Act
    const result = calculateIssuePriorityScore(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(67);
    expect(Number.isInteger(result.priorityScore)).toBe(true);
    expect(result.scoreBreakdown).toBeDefined();
    expect(Number.isInteger(result.scoreBreakdown.impactScore)).toBe(true);
    expect(result.calculatedAt).toBeDefined();
  });
});