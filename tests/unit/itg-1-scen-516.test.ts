import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-516: [edge] 課題キーワードの抽出順序が逆順の場合、最終的な優先度ランキングに影響しない
  test('異なる抽出順序でも最終的な優先度ランキングが一致する', () => {
    // パターンA: データベース接続エラー → ネットワーク障害 → 認証失敗の順で抽出
    const inputPatternA: IssuePriorityScoringInput = {
      issueId: 'issue-001-db-error',
      issueContent: 'データベース接続エラーが発生しており、システム全体が影響を受けている',
      occurrenceFrequency: 8,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const inputPatternB: IssuePriorityScoringInput = {
      issueId: 'issue-002-network-error',
      issueContent: 'ネットワーク障害により通信が断続的に遮断されている状況',
      occurrenceFrequency: 5,
      impactScore: 72,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const inputPatternC: IssuePriorityScoringInput = {
      issueId: 'issue-003-auth-error',
      issueContent: '認証失敗エラーが特定ユーザーで発生している',
      occurrenceFrequency: 3,
      impactScore: 58,
      affectedTeamCount: 1,
      resolutionDaysAverage: 0.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    // パターンAの順序で計算
    const resultA_Issue1 = calculateIssuePriorityScore(inputPatternA);
    const resultA_Issue2 = calculateIssuePriorityScore(inputPatternB);
    const resultA_Issue3 = calculateIssuePriorityScore(inputPatternC);

    const rankingA = [
      { issueId: resultA_Issue1.issueId, priorityScore: resultA_Issue1.priorityScore, rank: resultA_Issue1.priorityRank },
      { issueId: resultA_Issue2.issueId, priorityScore: resultA_Issue2.priorityScore, rank: resultA_Issue2.priorityRank },
      { issueId: resultA_Issue3.issueId, priorityScore: resultA_Issue3.priorityScore, rank: resultA_Issue3.priorityRank }
    ].sort((a, b) => b.priorityScore - a.priorityScore);

    // パターンBの順序で計算（異なる入力順序）
    const resultB_Issue3 = calculateIssuePriorityScore(inputPatternC);
    const resultB_Issue1 = calculateIssuePriorityScore(inputPatternA);
    const resultB_Issue2 = calculateIssuePriorityScore(inputPatternB);

    const rankingB = [
      { issueId: resultB_Issue3.issueId, priorityScore: resultB_Issue3.priorityScore, rank: resultB_Issue3.priorityRank },
      { issueId: resultB_Issue1.issueId, priorityScore: resultB_Issue1.priorityScore, rank: resultB_Issue1.priorityRank },
      { issueId: resultB_Issue2.issueId, priorityScore: resultB_Issue2.priorityScore, rank: resultB_Issue2.priorityRank }
    ].sort((a, b) => b.priorityScore - a.priorityScore);

    // 両パターンの優先度ランキングが完全に一致することを確認
    expect(rankingA.length).toBe(3);
    expect(rankingB.length).toBe(3);

    // ランキングの順序が一致
    expect(rankingA[0].issueId).toBe(rankingB[0].issueId);
    expect(rankingA[1].issueId).toBe(rankingB[1].issueId);
    expect(rankingA[2].issueId).toBe(rankingB[2].issueId);

    // 優先度スコアが一致
    expect(rankingA[0].priorityScore).toBe(rankingB[0].priorityScore);
    expect(rankingA[1].priorityScore).toBe(rankingB[1].priorityScore);
    expect(rankingA[2].priorityScore).toBe(rankingB[2].priorityScore);

    // 優先度ランクが一致
    expect(rankingA[0].rank).toBe(rankingB[0].rank);
    expect(rankingA[1].rank).toBe(rankingB[1].rank);
    expect(rankingA[2].rank).toBe(rankingB[2].rank);

    // 第1位の優先度スコアが最も高い（データベース接続エラー）
    expect(rankingA[0].issueId).toBe('issue-001-db-error');
    expect(rankingA[0].priorityScore).toBeGreaterThan(rankingA[1].priorityScore);

    // 第2位の優先度スコア（ネットワーク障害）
    expect(rankingA[1].issueId).toBe('issue-002-network-error');
    expect(rankingA[1].priorityScore).toBeGreaterThan(rankingA[2].priorityScore);

    // 第3位の優先度スコア（認証失敗）
    expect(rankingA[2].issueId).toBe('issue-003-auth-error');

    // 優先度ランク判定の確認（スコアに応じた分類）
    expect(rankingA[0].rank).toBe('高');
    expect(rankingA[1].rank).toBe('中');
    expect(rankingA[2].rank).toBe('中');
  });
});

type IssuePriorityScoringInput = {
  issueId: string;
  issueContent: string;
  occurrenceFrequency: number;
  impactScore: number;
  affectedTeamCount: number;
  resolutionDaysAverage: number;
  reportingDate: string;
  teamId: string;
};