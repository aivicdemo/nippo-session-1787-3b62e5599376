import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー抽出機能', () => {
  // SCEN-1619
  test('報告提出状況から未提出メンバー0人を抽出し、空の未提出者リストが返される', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'manager-001';

    const allMembersSubmitted = [
      {
        userId: 'user-001',
        userName: 'Engineer A',
        email: 'engineer-a@example.com',
        submissionTimestamp: new Date('2024-01-15T08:30:00Z'),
        reportContent: {
          yesterday: 'Fixed login bug',
          today: 'Implement new feature',
          challenges: 'Database performance issue',
        },
      },
      {
        userId: 'user-002',
        userName: 'Engineer B',
        email: 'engineer-b@example.com',
        submissionTimestamp: new Date('2024-01-15T08:45:00Z'),
        reportContent: {
          yesterday: 'Completed API integration',
          today: 'Code review',
          challenges: 'Third-party API delay',
        },
      },
      {
        userId: 'user-003',
        userName: 'Engineer C',
        email: 'engineer-c@example.com',
        submissionTimestamp: new Date('2024-01-15T08:15:00Z'),
        reportContent: {
          yesterday: 'Wrote unit tests',
          today: 'Deploy staging',
          challenges: 'Test coverage gap',
        },
      },
      {
        userId: 'user-004',
        userName: 'Engineer D',
        email: 'engineer-d@example.com',
        submissionTimestamp: new Date('2024-01-15T08:20:00Z'),
        reportContent: {
          yesterday: 'Refactored configuration',
          today: 'Performance optimization',
          challenges: 'Memory leak detection',
        },
      },
      {
        userId: 'user-005',
        userName: 'Engineer E',
        email: 'engineer-e@example.com',
        submissionTimestamp: new Date('2024-01-15T08:25:00Z'),
        reportContent: {
          yesterday: 'Fixed security vulnerability',
          today: 'Security audit',
          challenges: 'Compliance requirement update',
        },
      },
      {
        userId: 'user-006',
        userName: 'Engineer F',
        email: 'engineer-f@example.com',
        submissionTimestamp: new Date('2024-01-15T08:35:00Z'),
        reportContent: {
          yesterday: 'Documentation update',
          today: 'Technical design review',
          challenges: 'Architecture complexity',
        },
      },
      {
        userId: 'user-007',
        userName: 'Engineer G',
        email: 'engineer-g@example.com',
        submissionTimestamp: new Date('2024-01-15T08:40:00Z'),
        reportContent: {
          yesterday: 'Build pipeline optimization',
          today: 'CI/CD improvement',
          challenges: 'Build time increase',
        },
      },
      {
        userId: 'user-008',
        userName: 'Engineer H',
        email: 'engineer-h@example.com',
        submissionTimestamp: new Date('2024-01-15T08:10:00Z'),
        reportContent: {
          yesterday: 'Debugged production issue',
          today: 'Root cause analysis',
          challenges: 'Monitoring gap',
        },
      },
      {
        userId: 'user-009',
        userName: 'Engineer I',
        email: 'engineer-i@example.com',
        submissionTimestamp: new Date('2024-01-15T08:50:00Z'),
        reportContent: {
          yesterday: 'Client feedback implementation',
          today: 'User acceptance testing',
          challenges: 'Scope creep',
        },
      },
      {
        userId: 'user-010',
        userName: 'Engineer J',
        email: 'engineer-j@example.com',
        submissionTimestamp: new Date('2024-01-15T08:05:00Z'),
        reportContent: {
          yesterday: 'Sprint planning preparation',
          today: 'Sprint planning',
          challenges: 'Capacity constraint',
        },
      },
    ];

    const result = await detectAndNotifyUnsubmittedMembers({
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
      submittedMembers: allMembersSubmitted,
    });

    expect(result.unsubmittedMembers).toEqual([]);
    expect(result.unsubmittedMembers.length).toBe(0);
    expect(result.notificationsSent).toBe(0);
    expect(result.notificationFailures).toEqual([]);
  });
});