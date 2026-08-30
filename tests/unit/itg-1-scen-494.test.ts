import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  test('SCEN-494: calculate priority score with expected effect boundary validation', () => {
    // ケース1: expectedEffect = 0.9（1未満） - 制約違反
    const case1_input = {
      countermeasures: [
        {
          id: 'c1',
          title: 'test',
          expectedEffect: 0.9,
          implementationDifficulty: 5,
          requiredResources: 5,
        },
      ],
      effectWeight: 0.5,
      difficultyWeight: 0.3,
      resourceWeight: 0.2,
    };

    expect(() => calculatePriorityScoreForIssue(case1_input)).toThrow(
      /期待効果は1から10の範囲で入力してください/
    );

    // ケース2: expectedEffect = 10.1（10超過） - 制約違反
    const case2_input = {
      countermeasures: [
        {
          id: 'c2',
          title: 'test',
          expectedEffect: 10.1,
          implementationDifficulty: 5,
          requiredResources: 5,
        },
      ],
      effectWeight: 0.5,
      difficultyWeight: 0.3,
      resourceWeight: 0.2,
    };

    expect(() => calculatePriorityScoreForIssue(case2_input)).toThrow(
      /期待効果は1から10の範囲で入力してください/
    );

    // ケース3: expectedEffect = 1.0（境界値・最小） - 正常処理
    const case3_input = {
      countermeasures: [
        {
          id: 'c3',
          title: 'test',
          expectedEffect: 1.0,
          implementationDifficulty: 5,
          requiredResources: 5,
        },
      ],
      effectWeight: 0.5,
      difficultyWeight: 0.3,
      resourceWeight: 0.2,
    };

    const case3_result = calculatePriorityScoreForIssue(case3_input);
    expect(case3_result).toEqual({
      id: 'c3',
      priorityScore: 30,
      rank: 1,
    });

    // ケース4: expectedEffect = 10.0（境界値・最大） - 正常処理
    const case4_input = {
      countermeasures: [
        {
          id: 'c4',
          title: 'test',
          expectedEffect: 10.0,
          implementationDifficulty: 5,
          requiredResources: 5,
        },
      ],
      effectWeight: 0.5,
      difficultyWeight: 0.3,
      resourceWeight: 0.2,
    };

    const case4_result = calculatePriorityScoreForIssue(case4_input);
    expect(case4_result).toEqual({
      id: 'c4',
      priorityScore: 75,
      rank: 1,
    });
  });
});