/* eslint-disable @typescript-eslint/no-explicit-any */

// declare module because there's none avaialable
declare module 'nodemailer-stub' {
  export const interactsWithMail: any;
  export const stubTransport: any;
}
