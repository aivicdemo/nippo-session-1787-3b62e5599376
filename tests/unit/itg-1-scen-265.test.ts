import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-265: [edge] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。 - 影響を受けるメンバー数がチーム全体の人数を超えるときという明示された境界条件で影響メンバー数はチーム人数以下に調整されます
  test('should clamp impact score to 100 when affected members exceed team size', () => {
    const result = calculatePriorityScoreForIssue({
      issueId: 'ISSUE-001',
      frequency: 50,
      impactScore: 120,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    });

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(80);
    expect(result.priorityRank).toBe('HIGH');
    expect(result.colorCode).toBe('RED');
  });
});