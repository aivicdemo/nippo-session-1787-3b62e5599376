import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  test('SCEN-929: 課題リストの入力順序が逆順のとき、優先度順に正しく並べ替えられる', () => {
    const inputIssues = [
      {
        issueId: '3',
        keyword: '低優先',
        priorityScore: 20,
        frequency: 1,
        impactScore: 10,
      },
      {
        issueId: '2',
        keyword: '中優先',
        priorityScore: 50,
        frequency: 3,
        impactScore: 50,
      },
      {
        issueId: '1',
        keyword: '高優先',
        priorityScore: 85,
        frequency: 5,
        impactScore: 90,
      },
    ];

    const result = calculateIssuePriorityScore(inputIssues);

    expect(result).toHaveLength(3);
    expect(result[0].issueId).toBe('1');
    expect(result[0].priorityScore).toBe(85);
    expect(result[1].issueId).toBe('2');
    expect(result[1].priorityScore).toBe(50);
    expect(result[2].issueId).toBe('3');
    expect(result[2].priorityScore).toBe(20);
  });
});