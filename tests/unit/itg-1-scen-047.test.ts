import { detectUnsubmittedMembers, type DetectUnsubmittedMembersInput } from '../../src/logic/report-submission-management';

describe('report-submission-management', () => {
  // SCEN-047
  test('should throw error when report deadline configuration is not found', async () => {
    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: new Date('2024-01-15'),
      evaluationTimestamp: new Date('2024-01-15T09:00:00Z'),
      includeDelayedOnly: false,
    };

    await expect(() => detectUnsubmittedMembers(input)).rejects.toThrow(/報告期限/);
  });
});