import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  test('SCEN-373: 課題説明が空の場合、警告ログが記録されて優先度スコアが計算される', () => {
    // Arrange
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const input = {
      issueId: 'ISSUE-001',
      frequency: 50,
      impactScore: 60,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    // Act
    const result = calculatePriorityScoreForIssue(input);

    // Assert
    // 戻り値が正常に返される
    expect(result).toHaveProperty('issueId');
    expect(result).toHaveProperty('priorityScore');
    expect(result).toHaveProperty('priorityRank');
    expect(result).toHaveProperty('colorCode');

    // issueId が一致する
    expect(result.issueId).toBe('ISSUE-001');

    // priorityScore が 1～100 の範囲内
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    // priorityScore の計算が正確（frequency 50 * 0.4 + impactScore 60 * 0.6 = 20 + 36 = 56）
    expect(result.priorityScore).toBe(56);

    // priorityRank が MEDIUM（56は40～69の範囲）
    expect(result.priorityRank).toBe('MEDIUM');

    // colorCode が YELLOW（MEDIUM に対応）
    expect(result.colorCode).toBe('YELLOW');

    // 警告ログが記録されている
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('課題の詳細が不明なため、重大度判定ができません')
    );

    // クリーンアップ
    consoleWarnSpy.mockRestore();
  });
});