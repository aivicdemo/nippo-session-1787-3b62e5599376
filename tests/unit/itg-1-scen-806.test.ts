import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-806: [error] 課題優先度スコア算出機能 - キーワードごとの過去7日間発生頻度が負の数のとき処理が中断される
  test('過去7日間発生頻度が負の数を含む場合、エラーハンドリングが実行され処理が中断される', () => {
    const scoringInput: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続エラーが断続的に発生している',
      occurrenceFrequency: -5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A',
    };

    expect(() => calculateIssuePriorityScore(scoringInput)).toThrow(/課題分析結果に不正な値が検出されました/);
  });
});