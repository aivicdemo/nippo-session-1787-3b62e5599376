import { initializeScheduler } from '../../src/logic/remind-notification-scheduler';

const fetchMock = require('jest-fetch-mock');

describe('リマインド通知スケジューラー初期化', () => {
  test('SCEN-050: 永続化層からスケジュール一覧の読み込みに失敗した場合、エラーメッセージが返される', async () => {
    fetchMock.resetMocks();
    fetchMock.mockRejectOnce(new Error('Database connection failed'));

    await expect(initializeScheduler()).rejects.toThrow(/リマインド通知スケジュールの読み込みに失敗しました/);
  });
});