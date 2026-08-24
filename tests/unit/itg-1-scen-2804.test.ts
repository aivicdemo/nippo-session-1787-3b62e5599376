import { sortAndGroupProgressComparison } from '../../src/logic/manager-dashboard';
import { type GroupedProgressOutput, type ProgressGroup } from '../../src/logic/manager-dashboard';

describe('課題の優先度スコア降順整列機能', () => {
  // SCEN-2804
  test('優先度スコアが昇順に逆順で入力された場合、ダッシュボードに降順で表示される', () => {
    const input_progressGroups: ProgressGroup[] = [
      {
        groupKey: 'keyword_a',
        groupLabel: 'キーワードA',
        issueId: 'issue_001',
        issueContent: 'キーワードAの課題',
        priorityScore: 45,
        priorityColor: 'yellow',
        impactLevel: 'medium',
        reporterName: 'Engineer A',
        memberCount: 3,
        affectedProjects: ['Project Alpha'],
      },
      {
        groupKey: 'keyword_b',
        groupLabel: 'キーワードB',
        issueId: 'issue_002',
        issueContent: 'キーワードBの課題',
        priorityScore: 72,
        priorityColor: 'red',
        impactLevel: 'high',
        reporterName: 'Engineer B',
        memberCount: 5,
        affectedProjects: ['Project Beta'],
      },
      {
        groupKey: 'keyword_c',
        groupLabel: 'キーワードC',
        issueId: 'issue_003',
        issueContent: 'キーワードCの課題',
        priorityScore: 28,
        priorityColor: 'green',
        impactLevel: 'low',
        reporterName: 'Engineer C',
        memberCount: 1,
        affectedProjects: ['Project Gamma'],
      },
    ];

    const result: GroupedProgressOutput = sortAndGroupProgressComparison(
      input_progressGroups,
    );

    expect(result.groupedData).toHaveLength(3);
    expect(result.groupedData[0].priorityScore).toBe(72);
    expect(result.groupedData[0].groupLabel).toBe('キーワードB');
    expect(result.groupedData[1].priorityScore).toBe(45);
    expect(result.groupedData[1].groupLabel).toBe('キーワードA');
    expect(result.groupedData[2].priorityScore).toBe(28);
    expect(result.groupedData[2].groupLabel).toBe('キーワードC');

    expect(result.sortOrder).toEqual({
      sortBy: 'priorityScore',
      direction: 'descending',
    });
    expect(result.displayFormat).toBe('dashboard_table');
  });
});