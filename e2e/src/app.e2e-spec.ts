import { AppPage } from './app.po';

describe('Basic app test', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('PROFILE DEMO APP');
  });
});
