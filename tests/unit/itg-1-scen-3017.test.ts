import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-3017
  test('同一タイムスタンプの複数課題について、優先度スコアの順序が逆転しないように計算される', () => {
    const sharedTimestamp = '2026-08-19T10:00:00.000Z';
    const now = new Date(sharedTimestamp);

    const mockAiClient = {
      assessImpactScore: jest.fn((content: string): number => {
        if (content.includes('データベース障害')) {
          return 75;
        }
        if (content.includes('ネットワーク遅延')) {
          return 65;
        }
        if (content.includes('メモリ不足')) {
          return 55;
        }
        return 50;
      }),
    };

    const issueA: IssuePriorityScoringInput = {
      issueId: 'issue-a-001',
      issueContent: 'データベース障害により営業システムが停止',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: sharedTimestamp,
      teamId: 'team-001',
    };

    const issueB: IssuePriorityScoringInput = {
      issueId: 'issue-b-002',
      issueContent: 'ネットワーク遅延によるAPI応答時間増加',
      occurrenceFrequency: 3,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: sharedTimestamp,
      teamId: 'team-001',
    };

    const issueC: IssuePriorityScoringInput = {
      issueId: 'issue-c-003',
      issueContent: 'メモリ不足によるサーバー再起動',
      occurrenceFrequency: 2,
      impactScore: 40,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1.0,
      reportingDate: sharedTimestamp,
      teamId: 'team-001',
    };

    const resultA = calculateIssuePriorityScore(issueA, mockAiClient);
    const resultB = calculateIssuePriorityScore(issueB, mockAiClient);
    const resultC = calculateIssuePriorityScore(issueC, mockAiClient);

    const results: IssuePriorityScoringOutput[] = [resultA, resultB, resultC];
    const sortedResults = results.sort(
      (a, b) => b.priorityScore - a.priorityScore,
    );

    expect(sortedResults[0].issueId).toBe('issue-a-001');
    expect(sortedResults[0].priorityScore).toBe(75);
    expect(sortedResults[0].priorityRank).toBe('高');

    expect(sortedResults[1].issueId).toBe('issue-b-002');
    expect(sortedResults[1].priorityScore).toBe(65);
    expect(sortedResults[1].priorityRank).toBe('中');

    expect(sortedResults[2].issueId).toBe('issue-c-003');
    expect(sortedResults[2].priorityScore).toBe(55);
    expect(sortedResults[2].priorityRank).toBe('低');

    expect(sortedResults[0].calculatedAt).toBeDefined();
    expect(sortedResults[1].calculatedAt).toBeDefined();
    expect(sortedResults[2].calculatedAt).toBeDefined();

    expect(sortedResults[0].scoreBreakdown).toBeDefined();
    expect(sortedResults[1].scoreBreakdown).toBeDefined();
    expect(sortedResults[2].scoreBreakdown).toBeDefined();

    expect(sortedResults[0].colorCode).toBe('#FF0000');
    expect(sortedResults[1].colorCode).toBe('#FFFF00');
    expect(sortedResults[2].colorCode).toBe('#00FF00');
  });
});