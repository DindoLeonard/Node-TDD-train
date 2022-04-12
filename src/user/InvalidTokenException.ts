// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InvalidTokenException(this: any) {
  this.message = 'email_failure';
  this.status = 400;
}

export default InvalidTokenException;
