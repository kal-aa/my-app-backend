import createConnection from "../reUses/createConnection.js";
import comparePassword from "./comparePassword.js";

const db = createConnection();

const deleteWhetherOrNot = (id, inputPassword, res, next) => {
  const deleteClientSql = `DELETE FROM clients WHERE id = ?;`;
  const addressSql = `SELECT * FROM addresses WHERE client_id = ?;`;
  const deleteAddressSql = `DELETE FROM addresses WHERE client_id = ?;`;

  // Function to delete address
  function deleteAddress() {
    db.query(deleteAddressSql, [id], (err, deleteAddressResult) => {
      if (err) {
        console.error("Error deleting client:", err);
        return next(new Error());
      }
      console.log("Address deleted:", deleteAddressResult);

      //  Delete client after address is deleted
      deleteClient();
    });
  }

  // Function to delete client
  function deleteClient() {
    //  The finally delete the client
    db.query(deleteClientSql, [id], (err, deleteClientResult) => {
      if (err) {
        console.error("Error deleting client:", err);
        return next(new Error());
      }
      console.log("Client deleted:", deleteClientResult);
      return res.status(204).end();
    });
  }

  // Check if the client has an address
  db.query(addressSql, [id], (err, addressResult) => {
    if (err) {
      console.error("Error deleting client:", err);
      return next(new Error());
    }
    if (addressResult.length === 0) {
      deleteClient();
    } else {
      //  compare the password
      const sqlPassword = addressResult[0]?.password;
      comparePassword(inputPassword, sqlPassword, next, () => {
        deleteAddress();
      });
    }
  });
};

export default deleteWhetherOrNot;
