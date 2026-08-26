import { listNotificationHistory } from '../../src/logic/remind-notification-history';
import { type NotificationHistorySearchCriteria, type NotificationHistoryPage } from '../../src/logic/remind-notification-history';

describe('listNotificationHistory', () => {
  // SCEN-021
  test('should retrieve notification history records with search criteria and return sorted results', async () => {
    const searchCriteria: NotificationHistorySearchCriteria = {
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      notificationStatus: 'sent',
      pageNumber: 1,
      pageSize: 10,
    };

    const sentDateTime1 = new Date('2024-01-15T10:00:00Z');
    const sentDateTime2 = new Date('2024-01-16T10:00:00Z');
    const sentDateTime3 = new Date('2024-01-17T10:00:00Z');

    const expectedResult: NotificationHistoryPage = {
      records: [
        {
          notificationId: 'notif-001',
          sentDateTime: sentDateTime3,
          targetTeamId: 'team-001',
          targetMemberIds: ['user-001'],
          notificationStatus: 'sent',
          notificationContent: 'リマインド通知3',
          reportDeadline: new Date('2024-01-18T09:00:00Z'),
          timeToDeadline: '23 hours remaining',
        },
        {
          notificationId: 'notif-002',
          sentDateTime: sentDateTime2,
          targetTeamId: 'team-001',
          targetMemberIds: ['user-002'],
          notificationStatus: 'sent',
          notificationContent: 'リマインド通知2',
          reportDeadline: new Date('2024-01-17T09:00:00Z'),
          timeToDeadline: '23 hours remaining',
        },
        {
          notificationId: 'notif-003',
          sentDateTime: sentDateTime1,
          targetTeamId: 'team-001',
          targetMemberIds: ['user-003'],
          notificationStatus: 'sent',
          notificationContent: 'リマインド通知1',
          reportDeadline: new Date('2024-01-16T09:00:00Z'),
          timeToDeadline: '23 hours remaining',
        },
      ],
      totalCount: 3,
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await listNotificationHistory(searchCriteria);

    expect(result.records.length).toBe(3);
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    expect(result.records[0].notificationId).toBe('notif-001');
    expect(result.records[0].sentDateTime).toEqual(sentDateTime3);
    expect(result.records[0].status).toBe('sent');
    expect(result.records[0].notificationContent).toBe('リマインド通知3');

    expect(result.records[1].notificationId).toBe('notif-002');
    expect(result.records[1].sentDateTime).toEqual(sentDateTime2);
    expect(result.records[1].status).toBe('sent');
    expect(result.records[1].notificationContent).toBe('リマインド通知2');

    expect(result.records[2].notificationId).toBe('notif-003');
    expect(result.records[2].sentDateTime).toEqual(sentDateTime1);
    expect(result.records[2].status).toBe('sent');
    expect(result.records[2].notificationContent).toBe('リマインド通知1');

    // Verify records are sorted by sentDateTime in descending order
    expect(result.records[0].sentDateTime.getTime()).toBeGreaterThan(
      result.records[1].sentDateTime.getTime()
    );
    expect(result.records[1].sentDateTime.getTime()).toBeGreaterThan(
      result.records[2].sentDateTime.getTime()
    );
  });
});