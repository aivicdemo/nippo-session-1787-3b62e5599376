import { generateAndSendManagerConfirmationEmail } from '../../src/logic/confirmation-email-generation';

describe('朝会報告管理システム - 確認メール生成・送信', () => {
  test('SCEN-280: 日報データが1件も送信されていない場合、AggregatedReportDataNotReadyErrorをスローして確認メールは送信されない', () => {
    const input = {
      managerUserId: 'manager001',
      aggregationDate: '2026-01-15',
      unsubmittedMembers: [],
      prioritizedIssues: [],
      submissionDeadline: '2026-01-15T09:00:00Z',
      teamId: 'team-A',
    };

    expect(() => generateAndSendManagerConfirmationEmail(input)).toThrow(/日報集約データが不完全/);
  });
});