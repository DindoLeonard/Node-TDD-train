import transporter from '../config/emailTransporter';
import nodemailer from 'nodemailer';

const sendAccountActivation = async (email: string, token: string) => {
  const info = await transporter.sendMail({
    from: 'My App <info@my-app.com>',
    to: email,
    subject: 'Account Activation',
    html: `Token is ${token}`, // activationToken
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('url' + nodemailer.getTestMessageUrl(info));
  }
};

const sendPasswordReset = async (email: string, token: string) => {
  //
  const info = await transporter.sendMail({
    from: 'My App <info@my-app.com>',
    to: email,
    subject: 'Password Reset',
    // html: `Token is ${token}`, // activationToken
    html: `
      <div>
        <b>Please click below link to reset your password</b>
      </div>
      <div>
        <a href="http://localhost:8080/#/password-reset?reset=${token}">Reset</a>
      </div>
    `,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('url' + nodemailer.getTestMessageUrl(info));
  }
};

export default { sendAccountActivation, sendPasswordReset };
