import bcrypt from "bcrypt";

function hashPassword(password, next, ifHashed, saltRounds = 10) {
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.error("Error comparing password:", err);
      return next(new Error());
    }

    ifHashed(hash);
  });
}

export default hashPassword;
