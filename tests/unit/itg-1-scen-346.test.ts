import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  test('SCEN-346: Should handle empty issue data and return warning without calculating priority score', () => {
    // Arrange
    const emptyIssueInput = {
      issueId: '',
      frequency: 0,
      impactScore: 0,
    };

    // Capture console.warn to verify warning is logged
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Act
    const result = calculatePriorityScoreForIssue(emptyIssueInput);

    // Assert
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/本日の課題データがありません。報告を確認してください/)
    );
    expect(result).toBe(null);
    
    // Clean up
    warnSpy.mockRestore();
  });
});