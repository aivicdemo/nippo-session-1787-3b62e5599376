import { test, expect } from '@playwright/test';

test.describe("リマインド通知管理画面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/panels/scr-1787119211243.html");
  });

  // SCEN-011: [edge] リマインド通知管理画面 - リマインド通知スケジュール一覧に0件のときスケジュールなし表示になる
  test("SCEN-011: スケジュール一覧に0件のときスケジュールなし表示になる", async ({ page }) => {
    const schedulesList = page.locator('#schedules-list');
    const schedulesEmpty = page.locator('#schedules-empty');
    
    await expect(schedulesEmpty).toBeVisible();
    await expect(schedulesEmpty).toContainText('スケジュールなし');
  });

  // SCEN-012: [normal] リマインド通知管理画面 - リマインド通知履歴一覧に複数件の履歴が表示される
  test("SCEN-012: リマインド通知履歴一覧に複数件の履歴が表示される", async ({ page }) => {
    const historyList = page.locator('#history-list');
    const historyItems = historyList.locator('[data-history-item]');
    
    await expect(historyList).toBeVisible();
    const count = await historyItems.count();
    expect(count).toBeGreaterThan(0);
  });

  // SCEN-013: [edge] リマインド通知管理画面 - リマインド通知履歴一覧に0件のとき履歴なし表示になる
  test("SCEN-013: リマインド通知履歴一覧に0件のとき履歴なし表示になる", async ({ page }) => {
    const historyEmpty = page.locator('#history-empty');
    
    await expect(historyEmpty).toBeVisible();
    await expect(historyEmpty).toContainText('履歴なし');
  });

  // SCEN-014: [normal] リマインド通知管理画面 - リマインド通知履歴に通知送信日時が表示される
  test("SCEN-014: リマインド通知履歴に通知送信日時が表示される", async ({ page }) => {
    const historyList = page.locator('#history-list');
    const firstItem = historyList.locator('[data-history-item]').first();
    
    await expect(firstItem).toBeVisible();
    const dateText = await firstItem.locator('[data-send-datetime]').textContent();
    expect(dateText).not.toBeNull();
    expect(dateText).toMatch(/\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}/);
  });

  // SCEN-015: [normal] リマインド通知管理画面 - リマインド通知履歴に通知対象者が表示される
  test("SCEN-015: リマインド通知履歴に通知対象者が表示される", async ({ page }) => {
    const historyList = page.locator('#history-list');
    const firstItem = historyList.locator('[data-history-item]').first();
    
    await firstItem.click();
    const detailModal = page.locator('#detail-modal');
    await expect(detailModal).toBeVisible();
    
    const targetText = await detailModal.locator('[data-target-member]').textContent();
    expect(targetText).not.toBeNull();
  });

  // SCEN-016: [normal] リマインド通知管理画面 - リマインド通知履歴に送信済みステータスが表示される
  test("SCEN-016: リマインド通知履歴に送信済みステータスが表示される", async ({ page }) => {
    const historyList = page.locator('#history-list');
    const firstItem = historyList.locator('[data-history-item]').first();
    
    await expect(firstItem).toBeVisible();
    const statusText = await firstItem.locator('[data-status]').textContent();
    expect(statusText).toContain('送信済み');
  });

  // SCEN-017: [normal] リマインド通知管理画面 - リマインド通知履歴に未送信ステータスが表示される
  test("SCEN-017: リマインド通知履歴に未送信ステータスが表示される", async ({ page }) => {
    const historyList = page.locator('#history-list');
    const historyItems = historyList.locator('[data-history-item]');
    
    let foundUnsent = false;
    const count = await historyItems.count();
    
    for (let i = 0; i < count; i++) {
      const statusText = await historyItems.nth(i).locator('[data-status]').textContent();
      if (statusText?.includes('未送信')) {
        foundUnsent = true;
        break;
      }
    }
    
    expect(foundUnsent).toBe(true);
  });

  // SCEN-018: [normal] リマインド通知管理画面 - リマインド通知内容確認リンク押下で通知内容が表示される
  test("SCEN-018: リマインド通知内容確認リンク押下で通知内容が表示される", async ({ page }) => {
    const historyList = page.locator('#history-list');
    const firstItem = historyList.locator('[data-history-item]').first();
    
    await firstItem.click();
    const detailModal = page.locator('#detail-modal');
    await expect(detailModal).toBeVisible();
    
    const detailContent = page.locator('#detail-content');
    await expect(detailContent).toBeVisible();
  });

  // SCEN-019: [normal] リマインド通知管理画面 - 報告期限までの時間が画面に表示される
  test("SCEN-019: 報告期限までの時間が画面に表示される", async ({ page }) => {
    const timeRemainingElement = page.getByTestId('time-remaining');
    
    await expect(timeRemainingElement).toBeVisible();
    const timeText = await timeRemainingElement.textContent();
    expect(timeText).not.toBeNull();
    expect(timeText).toMatch(/(\d+時間|\d+分|\d+日)/);
  });

  // SCEN-020: [error] リマインド通知管理画面 - リマインド送信時刻を空で保存するとエラー表示になる
  test("SCEN-020: リマインド送信時刻を空で保存するとエラー表示になる", async ({ page }) => {
    const createButton = page.getByTestId('create-schedule-button');
    await createButton.click();
    
    const createModal = page.locator('#create-modal');
    await expect(createModal).toBeVisible();
    
    const teamSelect = page.locator('select[name="team_id"]');
    await teamSelect.selectOption('営業チーム');
    
    const deadlineInput = page.locator('input[name="deadline_hours"]');
    await deadlineInput.fill('24');
    
    const saveButton = page.getByRole('button', { name: '作成' });
    await saveButton.click();
    
    const errorMessage = page.locator('[data-error="send_time"]');
    await expect(errorMessage).toBeVisible();
    await expect(createModal).toBeVisible();
  });
});