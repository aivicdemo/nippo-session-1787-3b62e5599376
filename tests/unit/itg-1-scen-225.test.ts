import { generateAndSendSummaryEmail, type GenerateAndSendSummaryEmailInput, type GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('部長向けダッシュボードリアルタイム表示 - 報告提出状況', () => {
  // SCEN-225
  test('提出完了数がメンバー数を超過したときエラーになる', () => {
    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'mgr-001',
      submittedReports: [
        {
          reporterId: 'emp-001',
          reporterName: 'Alice',
          submittedAt: '2024-01-15T08:15:00Z',
          challenges: ['Database performance issue']
        },
        {
          reporterId: 'emp-002',
          reporterName: 'Bob',
          submittedAt: '2024-01-15T08:20:00Z',
          challenges: ['API timeout']
        },
        {
          reporterId: 'emp-003',
          reporterName: 'Carol',
          submittedAt: '2024-01-15T08:25:00Z',
          challenges: ['Deployment delay']
        },
        {
          reporterId: 'emp-004',
          reporterName: 'David',
          submittedAt: '2024-01-15T08:30:00Z',
          challenges: []
        },
        {
          reporterId: 'emp-005',
          reporterName: 'Eve',
          submittedAt: '2024-01-15T08:35:00Z',
          challenges: ['Network connectivity']
        },
        {
          reporterId: 'emp-006',
          reporterName: 'Frank',
          submittedAt: '2024-01-15T08:40:00Z',
          challenges: []
        },
        {
          reporterId: 'emp-007',
          reporterName: 'Grace',
          submittedAt: '2024-01-15T08:45:00Z',
          challenges: ['Code review backlog']
        },
        {
          reporterId: 'emp-008',
          reporterName: 'Henry',
          submittedAt: '2024-01-15T08:50:00Z',
          challenges: []
        },
        {
          reporterId: 'emp-009',
          reporterName: 'Ivy',
          submittedAt: '2024-01-15T08:55:00Z',
          challenges: ['Testing framework upgrade']
        },
        {
          reporterId: 'emp-010',
          reporterName: 'Jack',
          submittedAt: '2024-01-15T09:00:00Z',
          challenges: []
        },
        {
          reporterId: 'emp-011',
          reporterName: 'Karen',
          submittedAt: '2024-01-15T09:05:00Z',
          challenges: ['Configuration issue']
        }
      ],
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:30'
    };

    expect(() => generateAndSendSummaryEmail(input)).toThrow(/超過/);
  });
});