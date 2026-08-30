import { test, expect } from '@playwright/test';

test.describe("部長向け確認メール送信フロー", () => {
  // SCEN-640
  test("部長向け確認メール送信が完了し、メッセージが表示される", async ({ page, request }) => {
    await test.step("工程1: ログイン", async () => {
      await page.goto("/login.html");
      await page.fill('[name="username"]', 'test');
      await page.fill('[name="password"]', 'test');
      await Promise.all([
        page.waitForURL(url => !url.toString().includes('/login.html')),
        page.click('button[type="submit"]'),
      ]);
    });

    await test.step("工程2: 部長向けダッシュボード画面を開く", async () => {
      await page.goto("/panels/scr-1787119200549.html");
      await expect(page).toHaveTitle(/dashboard|朝会|報告/i);
    });

    await test.step("工程3: チームメンバーの日報提出状況を確認", async () => {
      const submittedCountElement = page.locator('[data-testid="submitted-count"]');
      const unsubmittedCountElement = page.locator('[data-testid="unsubmitted-count"]');
      
      await expect(submittedCountElement).toBeVisible({ timeout: 5000 });
      await expect(unsubmittedCountElement).toBeVisible({ timeout: 5000 });
      
      const submittedCount = await submittedCountElement.textContent();
      const unsubmittedCount = await unsubmittedCountElement.textContent();
      
      expect(submittedCount).not.toBeNull();
      expect(unsubmittedCount).not.toBeNull();
      
      const submittedNum = parseInt(submittedCount || '0');
      const unsubmittedNum = parseInt(unsubmittedCount || '0');
      expect(submittedNum + unsubmittedNum).toBeGreaterThan(0);
    });

    let recordsBefore: any[] = [];
    await test.step("工程4: 『確認メール送信』ボタンを押下前に記録を取得", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      
      if (apiUrl && appId) {
        const tableIndex = await page.evaluate(
          (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
          "リマインド通知履歴"
        );
        
        if (tableIndex >= 0) {
          const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
          if (res.ok()) {
            recordsBefore = await res.json();
            expect(Array.isArray(recordsBefore)).toBe(true);
          }
        }
      }
    });

    await test.step("工程4: 『確認メール送信』ボタンを押下", async () => {
      const sendButton = page.locator('[data-testid="send-reminder-button"]');
      await expect(sendButton).toBeVisible({ timeout: 5000 });
      await sendButton.click();
    });

    await test.step("工程5: 確認メール送信処理が実行され、完了メッセージが表示される", async () => {
      const successMessage = page.locator('text=/確認メール送信完了|送信完了|送信しました/i');
      await expect(successMessage).toBeVisible({ timeout: 10000 });
      
      const messageText = await successMessage.textContent();
      expect(messageText).toContain("完了");
    });

    await test.step("工程6: 画面遷移またはステータス表示により、処理完了状態が確認される", async () => {
      const completionIndicator = page.locator('text=/送信完了|完了|確認メール/i');
      await expect(completionIndicator).toBeVisible({ timeout: 5000 });
      
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      
      if (apiUrl && appId) {
        const tableIndex = await page.evaluate(
          (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
          "リマインド通知履歴"
        );
        
        if (tableIndex >= 0) {
          const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
          expect(res.ok()).toBe(true);
          const recordsAfter = await res.json();
          expect(Array.isArray(recordsAfter)).toBe(true);
          expect(recordsAfter.length).toBeGreaterThanOrEqual(recordsBefore.length);
        }
      }
    });
  });
});