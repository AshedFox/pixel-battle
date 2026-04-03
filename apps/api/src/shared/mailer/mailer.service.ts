import { ConnectionOptions, Queue, Worker } from 'bullmq';
import { MailJobData } from './types';
import { config } from '../../config';
import { renderTemplate } from './renderer';
import { transporter } from './transporter';

const QUEUE_NAME = 'mailer';

export class MailerService {
  public readonly queue: Queue<MailJobData>;
  public readonly worker: Worker<MailJobData>;

  constructor(
    connectionQueue: ConnectionOptions,
    connectionWorker: ConnectionOptions,
  ) {
    this.queue = new Queue<MailJobData>(QUEUE_NAME, {
      connection: connectionQueue,
    });
    this.worker = new Worker<MailJobData>(
      QUEUE_NAME,
      async (job) => {
        const { template, to, data } = job.data;
        const html = await renderTemplate(template, data);

        let subject = 'Notification';
        if (job.data.template === 'welcome') {
          subject = `Welcome to ${job.data.data.appName}`;
        }

        await transporter.sendMail({
          from: config.MAIL_USER,
          to,
          subject,
          html,
        });
      },
      { connection: connectionWorker },
    );
  }

  async sendMail(jobData: MailJobData) {
    await this.queue.add(jobData.template, jobData);
  }
}
