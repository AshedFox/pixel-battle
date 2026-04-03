import nodemailer from 'nodemailer';
import { config } from '../../config';

export const transporter = nodemailer.createTransport({
  host: config.MAIL_HOST,
  port: Number(config.MAIL_PORT),
  secure: config.MAIL_SECURE,
  auth: {
    user: config.MAIL_USER,
    pass: config.MAIL_PASSWORD,
  },
});
