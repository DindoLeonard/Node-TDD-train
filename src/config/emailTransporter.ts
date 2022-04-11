import nodemailer from 'nodemailer';
// import nodemailerStub from 'nodemailer-stub';

// const transporter = nodemailer.createTransport(nodemailerStub.stubTransport);

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 8587,
  tls: {
    rejectUnauthorized: false,
  },
});

export default transporter;
