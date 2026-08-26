import { listNotificationHistory, type NotificationHistorySearchCriteria, type NotificationHistoryPage } from '../../src/logic/remind-notification-history';

describe('Remind Notification History', () => {
  // SCEN-021
  test('should return sorted notification history records with complete content when searched with valid criteria', async () => {
    const searchCriteria: NotificationHistorySearchCriteria = {
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      notificationStatus: 'sent',
      pageNumber: 1,
      pageSize: 10,
    };

    const result: NotificationHistoryPage = await listNotificationHistory(searchCriteria);

    expect(result.records).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    result.records.forEach((record) => {
      expect(record.notificationId).toBeDefined();
      expect(typeof record.notificationId).toBe('string');
      expect(record.sentDateTime).toBeInstanceOf(Date);
      expect(record.notificationStatus).toBe('sent');
      expect(typeof record.recipientEmail).toBe('string');
      expect(record.recipientEmail.length).toBeGreaterThan(0);
      expect(record.reportContent).toBeDefined();
      expect(typeof record.reportContent.yesterday).toBe('string');
      expect(record.reportContent.yesterday.length).toBeGreaterThan(0);
      expect(typeof record.reportContent.today).toBe('string');
      expect(record.reportContent.today.length).toBeGreaterThan(0);
      expect(typeof record.reportContent.issues).toBe('string');
      expect(record.reportContent.issues.length).toBeGreaterThan(0);
    });

    for (let i = 0; i < result.records.length - 1; i++) {
      const currentTime = result.records[i].sentDateTime.getTime();
      const nextTime = result.records[i + 1].sentDateTime.getTime();
      expect(currentTime).toBeGreaterThanOrEqual(nextTime);
    }
  });
});