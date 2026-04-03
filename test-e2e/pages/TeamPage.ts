import { Page, expect } from '@playwright/test';

export class TeamPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/equipes/creer'); 
  }

  async fillTeamName(name: string) {
    await this.page.getByText(/Créer une Team/i).waitFor({ state: 'visible', timeout: 10000 });
    const nameInput = this.page.getByLabel("Nom de l'équipe");
    await nameInput.fill(name);
  }

  async selectEmblem(imgName: string = 'akatsuki.jpg') {
    const emblem = this.page.locator(`img[alt="Emblème ${imgName}"]`);
    await emblem.scrollIntoViewIfNeeded();
    await emblem.click();
  }

  async submit() {
    const submitBtn = this.page.getByRole('button', { name: /fonder l'équipe/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
  }

  async createTeamFullFlow(name: string) {
    await this.fillTeamName(name);
    await this.selectEmblem();
    await this.submit();
  }
}