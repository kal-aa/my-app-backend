import createConnection from "../reUses/createConnection.js";
import constErr from "./constErr.js";

const db = createConnection();
const addressSql = `SElECT * FROM addresses WHERE address_id = ?`;

function checkAddressSql(id, next, ifCheckAddressTrue) {
  db.query(addressSql, [id], (err, addressResult) => {
    if (err) {
      console.error("Error fetching address:", err);
      return next(new Error());
    }
    if (addressResult.length === 0) {
      console.error(
        "No data found with the given address_id"
      );
      return constErr(
        404,
        "Please open the website again and log-in/sign-up first",
        next
      );
    }

    ifCheckAddressTrue(addressResult);
  });
}

export default checkAddressSql;
