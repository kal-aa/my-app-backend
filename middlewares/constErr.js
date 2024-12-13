function constErr(status, message, next) {
  const err = new Error(message);
  err.status = status;
  return next(err);
}

export default constErr;
