import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  test('SCEN-498: 重み付け係数の合計が0のときはエラーをスロー', () => {
    const countermeasures = [
      {
        id: 'C1',
        title: '対策案A',
        expectedEffect: 8,
        implementationDifficulty: 3,
        requiredResources: 2,
      },
    ];

    const effectWeight = 0.0;
    const difficultyWeight = 0.0;
    const resourceWeight = 0.0;

    expect(() =>
      calculatePriorityScoreForIssue(
        countermeasures,
        effectWeight,
        difficultyWeight,
        resourceWeight
      )
    ).toThrow(/重み付け係数/);
  });
});