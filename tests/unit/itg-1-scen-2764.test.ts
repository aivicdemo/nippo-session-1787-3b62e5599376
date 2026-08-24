import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-2764: [error] 課題影響度判定機能 - TextAnalysisServiceAdapter から返されるスコアが null のとき処理が失敗する
  test('TextAnalysisServiceAdapterが影響度スコアをnullで返した場合、エラーを発生させてダッシュボード通知状態に遷移する', () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害'],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(null),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害が発生し、全チームの業務が停止した',
      occurrenceFrequency: 3,
      impactScore: null,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001',
    };

    expect(async () => {
      await calculateIssuePriorityScore(input, mockTextAnalysisService);
    }).toThrow(/影響度/);
  });
});