import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';

describe('朝会報告管理システム - 月次分析レポート生成', () => {
  test('SCEN-458: topChallengesCountが0またはnullのときデフォルト値5件で上位課題を抽出', () => {
    const testChallenges = [
      {
        challengeId: 'ch-001',
        title: 'Challenge 1',
        priorityScore: 100,
        frequency: 10,
        impactLevel: 'high'
      },
      {
        challengeId: 'ch-002',
        title: 'Challenge 2',
        priorityScore: 90,
        frequency: 9,
        impactLevel: 'high'
      },
      {
        challengeId: 'ch-003',
        title: 'Challenge 3',
        priorityScore: 80,
        frequency: 8,
        impactLevel: 'medium'
      },
      {
        challengeId: 'ch-004',
        title: 'Challenge 4',
        priorityScore: 70,
        frequency: 7,
        impactLevel: 'medium'
      },
      {
        challengeId: 'ch-005',
        title: 'Challenge 5',
        priorityScore: 60,
        frequency: 6,
        impactLevel: 'medium'
      },
      {
        challengeId: 'ch-006',
        title: 'Challenge 6',
        priorityScore: 50,
        frequency: 5,
        impactLevel: 'low'
      }
    ];

    const input = {
      targetMonth: '2024-01',
      challengeData: testChallenges,
      topChallengesCount: 0,
      minimumPriorityThreshold: 0,
      teamIds: ['team-001']
    };

    const resultWithZero = generateMonthlyAnalysisReport(input);

    expect(resultWithZero.selectedChallenges).toHaveLength(5);
    expect(resultWithZero.selectedChallenges[0]).toMatchObject({
      challengeId: 'ch-001',
      priorityScore: 100,
      reportingRank: 1
    });
    expect(resultWithZero.selectedChallenges[1]).toMatchObject({
      challengeId: 'ch-002',
      priorityScore: 90,
      reportingRank: 2
    });
    expect(resultWithZero.selectedChallenges[2]).toMatchObject({
      challengeId: 'ch-003',
      priorityScore: 80,
      reportingRank: 3
    });
    expect(resultWithZero.selectedChallenges[3]).toMatchObject({
      challengeId: 'ch-004',
      priorityScore: 70,
      reportingRank: 4
    });
    expect(resultWithZero.selectedChallenges[4]).toMatchObject({
      challengeId: 'ch-005',
      priorityScore: 60,
      reportingRank: 5
    });

    const inputWithNull = {
      targetMonth: '2024-01',
      challengeData: testChallenges,
      topChallengesCount: null,
      minimumPriorityThreshold: 0,
      teamIds: ['team-001']
    };

    const resultWithNull = generateMonthlyAnalysisReport(inputWithNull);

    expect(resultWithNull.selectedChallenges).toHaveLength(5);
    expect(resultWithNull.selectedChallenges[0]).toMatchObject({
      challengeId: 'ch-001',
      priorityScore: 100,
      reportingRank: 1
    });
    expect(resultWithNull.selectedChallenges[1]).toMatchObject({
      challengeId: 'ch-002',
      priorityScore: 90,
      reportingRank: 2
    });
    expect(resultWithNull.selectedChallenges[2]).toMatchObject({
      challengeId: 'ch-003',
      priorityScore: 80,
      reportingRank: 3
    });
    expect(resultWithNull.selectedChallenges[3]).toMatchObject({
      challengeId: 'ch-004',
      priorityScore: 70,
      reportingRank: 4
    });
    expect(resultWithNull.selectedChallenges[4]).toMatchObject({
      challengeId: 'ch-005',
      priorityScore: 60,
      reportingRank: 5
    });

    expect(resultWithZero.selectedChallenges).toEqual(resultWithNull.selectedChallenges);
  });
});