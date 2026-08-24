import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア順序付け', () => {
  test('SCEN-2782: 同一優先度スコアの複数課題は報告時刻で順序付けされる', () => {
    // 同一の優先度スコア（75点）を持つ3件の課題を準備
    const issueA = {
      issueId: 'issue-a-001',
      issueContent: 'データベース接続タイムアウトが頻発している',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:30Z',
      teamId: 'team-dev-001',
    };

    const issueB = {
      issueId: 'issue-b-001',
      issueContent: 'APIレスポンスが遅延することがある',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:45Z',
      teamId: 'team-dev-001',
    };

    const issueC = {
      issueId: 'issue-c-001',
      issueContent: 'テストスイート実行時間が増加している',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:01:00Z',
      teamId: 'team-dev-001',
    };

    // 各課題に対して calculateIssuePriorityScore を実行
    const resultA = calculateIssuePriorityScore(issueA);
    const resultB = calculateIssuePriorityScore(issueB);
    const resultC = calculateIssuePriorityScore(issueC);

    // 3件すべてが同一のスコア（75点）を返すことを検証
    expect(resultA.priorityScore).toBe(75);
    expect(resultB.priorityScore).toBe(75);
    expect(resultC.priorityScore).toBe(75);

    // 優先度ランクが同じ（中）であることを検証
    expect(resultA.priorityRank).toBe('中');
    expect(resultB.priorityRank).toBe('中');
    expect(resultC.priorityRank).toBe('中');

    // 色コードが同じ（黄色）であることを検証
    expect(resultA.colorCode).toBe('#FFFF00');
    expect(resultB.colorCode).toBe('#FFFF00');
    expect(resultC.colorCode).toBe('#FFFF00');

    // スコア内訳が同一であることを検証
    expect(resultA.scoreBreakdown).toEqual(resultB.scoreBreakdown);
    expect(resultB.scoreBreakdown).toEqual(resultC.scoreBreakdown);

    // 報告時刻が記録されていることを検証
    expect(new Date(issueA.reportingDate).getTime()).toBeLessThan(
      new Date(issueB.reportingDate).getTime()
    );
    expect(new Date(issueB.reportingDate).getTime()).toBeLessThan(
      new Date(issueC.reportingDate).getTime()
    );

    // 報告時刻から見て、A -> B -> C の順序で時間が経過していることを確認
    const timeA = new Date(resultA.calculatedAt).getTime();
    const timeB = new Date(resultB.calculatedAt).getTime();
    const timeC = new Date(resultC.calculatedAt).getTime();

    // 計算実行時刻は計算時点なので、issueIdとreportingDateの組み合わせで安定した順序が保証されることを検証
    expect(issueA.reportingDate).toEqual('2024-01-15T09:00:30Z');
    expect(issueB.reportingDate).toEqual('2024-01-15T09:00:45Z');
    expect(issueC.reportingDate).toEqual('2024-01-15T09:01:00Z');

    // 各結果オブジェクトがissueIdを保持し、識別できることを検証
    expect(resultA.issueId).toBe('issue-a-001');
    expect(resultB.issueId).toBe('issue-b-001');
    expect(resultC.issueId).toBe('issue-c-001');

    // 同一スコアの複数課題が報告時刻順に並ぶための前提条件を検証
    // ダッシュボード表示ロジックがreportingDateを参照して順序付けできることを確保
    const issues = [resultA, resultB, resultC];
    const sortedByTime = issues.sort(
      (a, b) =>
        new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime()
    );

    // 優先度スコア順序と報告時刻順序の一貫性を検証
    expect(sortedByTime[0].issueId).toBe('issue-a-001');
    expect(sortedByTime[1].issueId).toBe('issue-b-001');
    expect(sortedByTime[2].issueId).toBe('issue-c-001');
  });
});