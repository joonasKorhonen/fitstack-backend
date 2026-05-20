import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class MailService {
  private readonly client: SESClient;
  private readonly fromEmail: string;

  constructor() {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const fromEmail = process.env.AWS_SES_FROM_EMAIL;

    if (!region || !accessKeyId || !secretAccessKey || !fromEmail) {
      throw new Error(
        'AWS SES configuration missing. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_SES_FROM_EMAIL.',
      );
    }

    this.fromEmail = fromEmail;
    this.client = new SESClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const subject = 'FitStack — salasanan palautus';
    const text =
      `Saimme pyynnön palauttaa FitStack-tilisi salasana.\n\n` +
      `Palauta salasana avaamalla tämä linkki (voimassa 1 tunnin):\n${resetUrl}\n\n` +
      `Jos et pyytänyt palautusta, voit jättää tämän viestin huomiotta.`;
    const html =
      `<p>Saimme pyynnön palauttaa FitStack-tilisi salasana.</p>` +
      `<p>Palauta salasana <a href="${resetUrl}">tästä linkistä</a> (voimassa 1 tunnin).</p>` +
      `<p>Jos et pyytänyt palautusta, voit jättää tämän viestin huomiotta.</p>`;

    try {
      await this.client.send(
        new SendEmailCommand({
          Source: this.fromEmail,
          Destination: { ToAddresses: [to] },
          Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Text: { Data: text, Charset: 'UTF-8' },
              Html: { Data: html, Charset: 'UTF-8' },
            },
          },
        }),
      );
    } catch (err) {
      throw new InternalServerErrorException(
        `Sähköpostin lähetys epäonnistui: ${(err as Error).message}`,
      );
    }
  }
}
