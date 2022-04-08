import nodemailer from 'nodemailer';
import nodemailerStub from 'nodemailer-stub';

const transporter = nodemailer.createTransport(nodemailerStub.stubTransport);

export default transporter;
