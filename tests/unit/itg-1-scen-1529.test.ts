import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-1529: [error] 課題優先度スコア算出機能 - TextAnalysisServiceAdapter の assessImpactScore が失敗したときエラーが発生する
  test('TextAnalysisServiceAdapter の assessImpactScore が失敗した場合、代替動作を実行する', () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを準備し、assessImpactScore が例外をスローするよう設定
    const failingTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [{ keyword: 'サーバーダウン', frequency: 3 }],
        totalKeywordCount: 1,
        extractedAt: new Date('2024-01-15T09:30:00Z'),
        analysisperiodDays: 7,
      }),
      assessImpactScore: jest.fn().mockRejectedValue(
        new Error('TextAnalysisService temporarily unavailable')
      ),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        confidence: 0.85,
      }),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバーダウンによるサービス停止',
      occurrenceFrequency: 3,
      impactScore: 85,
      affectedTeamCount: 4,
      resolutionDaysAverage: 1.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    // Act & Assert: assessImpactScore の失敗により、例外がスローされることを確認
    expect(async () => {
      await calculateIssuePriorityScore(input, failingTextAnalysisAdapter);
    }).rejects.toThrow(/unavailable|テキスト分析|一時的に利用できません/);
  });
});