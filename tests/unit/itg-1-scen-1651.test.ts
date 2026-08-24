import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-1651
  test('メンバーの提出期限が null のレコードが混在するとき、処理を中止しエラーを返す', () => {
    const input: Parameters<typeof aggregateReportSubmissionStatus>[0] = {
      teamId: 'team-001',
      reportDate: '2026-08-20',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    const mockSubmissionRecords = [
      {
        userId: 'user-001',
        userName: 'Engineer A',
        email: 'engineer.a@company.com',
        deadline: new Date('2026-08-20T09:00:00Z'),
        submittedAt: new Date('2026-08-20T08:30:00Z'),
      },
      {
        userId: 'user-002',
        userName: 'Engineer B',
        email: 'engineer.b@company.com',
        deadline: new Date('2026-08-20T09:00:00Z'),
        submittedAt: new Date('2026-08-20T08:45:00Z'),
      },
      {
        userId: 'user-003',
        userName: 'Engineer C',
        email: 'engineer.c@company.com',
        deadline: new Date('2026-08-20T09:00:00Z'),
        submittedAt: null,
      },
      {
        userId: 'user-004',
        userName: 'Engineer D',
        email: 'engineer.d@company.com',
        deadline: new Date('2026-08-20T09:00:00Z'),
        submittedAt: new Date('2026-08-20T08:50:00Z'),
      },
      {
        userId: 'user-005',
        userName: 'Engineer E',
        email: 'engineer.e@company.com',
        deadline: new Date('2026-08-20T09:00:00Z'),
        submittedAt: new Date('2026-08-20T08:55:00Z'),
      },
      {
        userId: 'user-006',
        userName: 'Engineer F',
        email: 'engineer.f@company.com',
        deadline: new Date('2026-08-20T09:00:00Z'),
        submittedAt: new Date('2026-08-20T09:05:00Z'),
      },
      {
        userId: 'user-007',
        userName: 'Engineer G',
        email: 'engineer.g@company.com',
        deadline: new Date('2026-08-20T09:00:00Z'),
        submittedAt: new Date('2026-08-20T08:40:00Z'),
      },
      {
        userId: 'user-008',
        userName: 'Engineer H',
        email: 'engineer.h@company.com',
        deadline: new Date('2026-08-20T09:00:00Z'),
        submittedAt: new Date('2026-08-20T08:20:00Z'),
      },
      {
        userId: 'user-009',
        userName: 'Engineer I',
        email: 'engineer.i@company.com',
        deadline: null,
        submittedAt: null,
      },
      {
        userId: 'user-010',
        userName: 'Engineer J',
        email: 'engineer.j@company.com',
        deadline: null,
        submittedAt: null,
      },
    ];

    expect(() => {
      aggregateReportSubmissionStatus(
        input,
        mockSubmissionRecords
      );
    }).toThrow(/提出期限/);
  });
});