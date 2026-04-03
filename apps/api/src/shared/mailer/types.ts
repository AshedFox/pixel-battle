export type MailJobData = {
  template: 'welcome';
  to: string;
  data: { username: string; confirmUrl: string; appName: string };
};
