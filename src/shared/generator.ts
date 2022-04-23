import crypto from 'crypto';

const randomString = (length: number): string => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

export default { randomString };
