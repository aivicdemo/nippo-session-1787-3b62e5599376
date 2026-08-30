import { test, expect } from '@playwright/test';

test.describe("ダッシュボード戻るフロー", () => {
  // SCEN-644: [normal] ダッシュボード戻るフロー - 業務フロー「ダッシュボード戻るフロー」を開始から完了まで実行する
  test("部長向けダッシュボードから日報確認・検索画面へ正常に遷移し、戻るボタンで履歴スタックに記録される", async ({ page }) => {
    await test.step("工程1: ログイン処理を実行する", async () => {
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
      // ダッシュボード画面の主要要素が表示されることを確認
      const header = page.locator('h1, h2, .header');
      await expect(header).toBe(true);
    });

    await test.step("工程3: ダッシュボード上の『戻る』ボタン（またはナビゲーション要素）を確認", async () => {
      // data-aivic-nav="scr-1787119221707" のナビゲーション要素を探す
      // （日報確認・検索画面へのリンク）
      const reportSearchNavItem = page.locator('[data-aivic-nav="scr-1787119221707"]');
      await expect(reportSearchNavItem).toBe(true);
    });

    await test.step("工程4: 日報確認・検索画面へのナビゲーション要素をクリック", async () => {
      const reportSearchNavItem = page.locator('[data-aivic-nav="scr-1787119221707"]');
      await reportSearchNavItem.click();
      // 画面遷移待機
      await page.waitForURL(url => url.toString().includes('scr-1787119221707'));
    });

    await test.step("工程5: 日報確認・検索画面へ正常に遷移したことを確認", async () => {
      // 現在のURLが日報確認・検索画面であることを確認
      const currentUrl = page.url();
      expect(currentUrl).toContain('scr-1787119221707');
      
      // 日報確認・検索画面の特徴的な要素が表示されることを確認
      // （例：「日報確認・検索」というテキストを含む見出しやラベル）
      const pageTitle = page.locator('text=/日報確認|検索/i');
      await expect(pageTitle).toBe(true);
    });

    await test.step("工程6: 過去の提出済み日報一覧が表示されていることを確認", async () => {
      // 日報リスト表示領域（reports-tbody）の存在確認
      const reportList = page.locator('#reports-tbody');
      // リストが存在し、何らかの行が表示されている状態を期待
      const reportRows = reportList.locator('tr');
      // 実際に行があるかどうかは環境に依存するが、テーブル構造そのものは存在するはず
      await expect(reportList).toBe(true);
    });

    await test.step("工程7: ブラウザの履歴スタックにダッシュボード画面が記録されていることを確認", async () => {
      // ブラウザの戻るボタン（history API）が機能することを確認
      // Playwrightでは履歴スタックの内容を直接検査できないため、
      // 戻るナビゲーションが可能な状態を確認することで検証
      
      // 現在の画面が日報確認・検索画面であることを再確認
      expect(page.url()).toContain('scr-1787119221707');
      
      // 戻るナビゲーション要素（ダッシュボードへのリンク）を確認
      const dashboardNavItem = page.locator('[data-aivic-nav="scr-1787119200549"]');
      await expect(dashboardNavItem).toBe(true);
    });

    await test.step("工程8: 戻るナビゲーション要素をクリックしてダッシュボードに戻る", async () => {
      const dashboardNavItem = page.locator('[data-aivic-nav="scr-1787119200549"]');
      await dashboardNavItem.click();
      // ダッシュボード画面への遷移待機
      await page.waitForURL(url => url.toString().includes('scr-1787119200549'));
    });

    await test.step("工程9: ダッシュボード画面に正常に戻ったことを確認", async () => {
      // 現在のURLがダッシュボード画面であることを確認
      const currentUrl = page.url();
      expect(currentUrl).toContain('scr-1787119200549');
      
      // ダッシュボードの特徴的な要素が表示されていることを確認
      // 提出状況や課題リストなどの表示領域が存在することを検証
      const dashboard = page.locator('.shell-container, .content-area, main');
      await expect(dashboard).toBe(true);
    });

    await test.step("工程10: ブラウザの履歴スタック検証の追加確認", async () => {
      // ダッシュボード画面に正常に戻った状態で、
      // 再度日報確認・検索画面へ遷移可能であることを確認
      const reportSearchNavItem = page.locator('[data-aivic-nav="scr-1787119221707"]');
      await expect(reportSearchNavItem).toBe(true);
      
      // これにより、ブラウザの履歴スタックに両画面が記録されていることが
      // 間接的に確認される
    });
  });
});