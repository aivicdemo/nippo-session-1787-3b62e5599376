import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-956
  test('ユーザー権限情報が null のとき処理を中止しエラーを返す', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'テスト環境の構築が遅延している',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
      userPermissions: null,
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toEqual({
      success: false,
      errorCode: 'INVALID_USER_PERMISSION',
      errorMessage: '課題優先度スコア計算に必要なユーザー権限情報が存在しません',
      issueId: 'issue-001',
    });
  });
});