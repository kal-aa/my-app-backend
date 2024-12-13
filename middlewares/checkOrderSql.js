import createConnection from "../reUses/createConnection.js";
import constErr from "./constErr.js";

const db = createConnection();
const orderSql = `SELECT * FROM orders WHERE client_id = ?`;

function checkOrderSql(id, next, ifCheckOrderTrue) {
  db.query(orderSql, [id], (err, orderResult) => {
    if (err) {
      console.error("Error fetching client:", err);
      return next(new Error());
    }
    if (orderResult.length === 0) {
      console.error("user trying to fetch an order with out placing one");
      return constErr(
        404,
        "No order!",
        next
      );
    }

    ifCheckOrderTrue(orderResult);
  });
}

export default checkOrderSql;
