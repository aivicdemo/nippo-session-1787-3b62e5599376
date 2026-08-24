import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付与機能', () => {
  // SCEN-632
  test('過去30日間の履歴データに不正な日付形式が含まれているとき例外を発生させる', () => {
    const invalidInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが発生している',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    expect(() => {
      calculateIssuePriorityScore(
        invalidInput,
        [
          {
            challengeId: 'hist-001',
            content: 'ネットワーク遅延',
            occurrenceCount: 3,
            impactScore: 60,
          },
          {
            challengeId: 'hist-002',
            content: 'メモリリーク',
            occurrenceCount: 2,
            impactScore: 80,
            recordDate: '2025-13-45',
          },
          {
            challengeId: 'hist-003',
            content: 'ログ出力エラー',
            occurrenceCount: 1,
            impactScore: 40,
            recordDate: 'invalid-date',
          },
        ]
      );
    }).toThrow(/日付/);
  });
});