import { generateAndSendManagerConfirmationEmail } from '../../src/logic/confirmation-email-generation';

describe('Confirmation Email Generation', () => {
  test('SCEN-084: throws AggregatedReportDataNotReadyError when aggregationDate is null', () => {
    const input = {
      managerUserId: 'MGR001',
      aggregationDate: null,
      unsubmittedMembers: [],
      prioritizedIssues: [],
      submissionDeadline: '2026-01-20T09:00:00Z',
      teamId: 'TEAM001',
    };

    expect(() => generateAndSendManagerConfirmationEmail(input)).toThrow(/日報集約データが不完全です/);
  });
});