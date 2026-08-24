import { describe, test, expect } from '@jest/globals';
import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput } from '../../src/logic/notification-delivery';

describe('部長向けダッシュボード - 本日の報告提出状況リアルタイム表示機能', () => {
  // SCEN-231: [error] 日報集約メール送信機能 - チーム内に部長が存在しないときエラーになる
  test('should throw error when no department head exists in team', () => {
    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-a-001',
      reportDate: '2024-01-15',
      managerUserId: '',
      submittedReports: [
        {
          reporterId: 'user-member-001',
          reporterName: 'メンバーA',
          submittedAt: '2024-01-15T08:45:00Z',
          challenges: ['タスク遅延の懸念']
        },
        {
          reporterId: 'user-member-002',
          reporterName: 'メンバーB',
          submittedAt: '2024-01-15T08:50:00Z',
          challenges: ['リソース不足']
        },
        {
          reporterId: 'user-member-003',
          reporterName: 'メンバーC',
          submittedAt: '2024-01-15T08:55:00Z',
          challenges: ['品質リスク']
        }
      ],
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:00'
    };

    expect(() => {
      generateAndSendSummaryEmail(input);
    }).toThrow(/部長/);
  });
});