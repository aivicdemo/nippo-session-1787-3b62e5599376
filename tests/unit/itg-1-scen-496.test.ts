import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-496: [edge] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。 - 必要リソースが1未満または10を超えるときという明示された境界条件で必要リソースは1から10の範囲で入力してください
  test('should clamp requiredResources below 1 to 1 and calculate priority score correctly', () => {
    const countermeasures = [
      {
        id: 'cm-001',
        title: '対策案A',
        expectedEffect: 5,
        implementationDifficulty: 3,
        requiredResources: 0,
      },
    ];
    const effectWeight = 0.5;
    const difficultyWeight = 0.3;
    const resourceWeight = 0.2;

    const result = calculatePriorityScoreForIssue(
      countermeasures,
      effectWeight,
      difficultyWeight,
      resourceWeight
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'cm-001',
      title: '対策案A',
      priorityScore: 64,
      rank: 1,
    });
  });
});