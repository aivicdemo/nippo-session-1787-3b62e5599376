import { encryptDailyReportData, type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('Data Security - Daily Report Encryption', () => {
  // SCEN-177
  test('should throw ValidationError when progressInfo field is empty string', () => {
    const input: EncryptDailyReportDataInput = {
      reporterId: 'ENG-001',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: 'Completed feature X implementation',
      todayPlan: 'Start testing feature Y',
      challenges: '',
      encryptionKeyId: 'KEY-2024-001',
      executorUserId: 'MANAGER-001',
    };

    expect(() => encryptDailyReportData(input)).toThrow(/進捗情報|progressInfo|challenge/i);
  });
});