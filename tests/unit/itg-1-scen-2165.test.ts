import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  test('SCEN-2165: 集計対象期間の終了日がnullのときエラーが発生する', () => {
    // Arrange: テスト入力データの準備
    // 開始日は有効な日付、終了日はnullで指定
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'パフォーマンス低下の問題',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2026-01-15',
      teamId: 'team-dev-01'
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    // Act & Assert: エラーが発生することを確認
    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/終了日|end date|null/i);

    // Assert: TextAnalysisServiceAdapterの呼び出しが行われていないことを確認
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
  });
});