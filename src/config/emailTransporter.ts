import nodemailer from 'nodemailer';
import config from 'config';

const mailConfig = config.get('mail') as {
  host: string;
  port: number;
  tls: {
    rejectUnauthorized: boolean;
  };
};

// import nodemailerStub from 'nodemailer-stub';

// const transporter = nodemailer.createTransport(nodemailerStub.stubTransport);

const transporter = nodemailer.createTransport({ ...mailConfig });

export default transporter;
