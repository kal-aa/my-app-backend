import bcrypt from "bcrypt";
import constErr from "./constErr.js";

function comparePassword(inputPassword, sqlPassword, next, ifResult) {
  bcrypt.compare(inputPassword, sqlPassword, (err, result) => {
    if (err) {
      console.error("Error comparing password:", err);
      return next(new Error());
    }
    if (!result) {
      console.error("Password Doesn't match");
      return constErr(401, "Incorrect password", next);
    }
    console.log("Authenticated!");
    ifResult(result);
  });
}

export default comparePassword;
