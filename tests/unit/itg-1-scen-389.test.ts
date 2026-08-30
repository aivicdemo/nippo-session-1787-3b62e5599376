import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('priority-scoring-engine', () => {
  // SCEN-389
  test('should calculate priority score and rank with warning when issue description exceeds 50 characters', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const issueId = 'ISSUE-001';
    const frequency = 75;
    const impactScore = 80;
    const frequencyWeight = 0.4;
    const impactWeight = 0.6;
    const longIssueDescription = 'これは非常に長い課題説明であり、50文字の制限を超えてしまっているため、警告が発生するべきテストケースです';

    const result = calculatePriorityScoreForIssue({
      issueId,
      frequency,
      impactScore,
      frequencyWeight,
      impactWeight,
      issueDescription: longIssueDescription,
    });

    const expectedPriorityScore = Math.round(frequency * frequencyWeight + impactScore * impactWeight);

    expect(result).toEqual({
      issueId: 'ISSUE-001',
      priorityScore: expectedPriorityScore,
      priorityRank: 'HIGH',
      colorCode: 'RED',
    });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/課題説明が長すぎます/));

    warnSpy.mockRestore();
  });
});