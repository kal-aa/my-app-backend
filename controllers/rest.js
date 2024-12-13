import bcrypt from "bcrypt";
import createConnection from "../reUses/createConnection.js";
import comparePassword from "../middlewares/comparePassword.js";
import constErr from "../middlewares/constErr.js";
import hashPassword from "../middlewares/hashPassword.js";
import checkClientSql from "../middlewares/checkClientSql.js";
import checkOrderSql from "../middlewares/checkOrderSql.js";
import checkAddressSql from "../middlewares/checkAddressSql.js";

const db = createConnection();

//  POST >>>
//  INSERT INTO
//  /fb/insert-client
export const insertClient = (req, res, next) => {
  const { full_name, gender, age, password, email } = req.body;
  const reqGender = gender || null;
  const reqAge = age || null;
  if ((!full_name, !email, !password)) {
    console.log("Please enter full_name, email and password for the client");
    return constErr(
      400,
      "Please insert full_name, email and password for the client",
      next
    );
  }
  const fullName = full_name.trim().split(" ");
  if (fullName.length !== 2) {
    return constErr(400, "Please add your full name", next);
  }
  const clientSql = "INSERT INTO clients SET ?";
  const addressSql = `INSERT INTO addresses SET ?;`;
  const address_id = `SELECT address_id FROM addresses WHERE email = ?;`;

  //  Check if the Email already exists
  function emailSqlF() {
    const emailSql = `SELECT email FROM addresses WHERE email = ?`;
    db.query(emailSql, [email], (err, emailResult) => {
      if (err) {
        console.error("Error fetcing email");
        return next(new Error());
      }
      if (emailResult.length >= 1) {
        console.error("This email already exists");
        return constErr(409, "This email already exists", next);
      }

      // if the email doesn't exist in the database add it
      clientSqlF();
    });
  }

  //  Add full_name, age, and gender to the clients table
  function clientSqlF() {
    const clientValues = {
      first_name: fullName[0],
      last_name: fullName[1],
      gender: reqGender,
      age: reqAge,
    };
    db.query(clientSql, clientValues, (err) => {
      if (err) {
        console.error("Error fetching client:", err);
        return next(new Error());
      }

      checkClientSql(fullName, next, (clientResult) => {
        hashPasswordF(clientResult);
      });
    });
  }

  // Hash the password
  function hashPasswordF(clientResult) {
    hashPassword(password, next, (hashedPassword) => {
      const addressValues = {
        email,
        password: hashedPassword,
        client_id: clientResult[0].id,
      };
      addressSqlF(clientResult, addressValues, hashedPassword);
    });
  }

  // Add email and password to the addresses table
  function addressSqlF(clientResult, addressValues, hashedPassword) {
    db.query(addressSql, addressValues, (err) => {
      if (err) {
        console.error("Error Posting an address:", err);
        return constErr(500, "Erorr posting an address", next);
      }

      const clientData = {
        ...clientResult[0],
        password: hashedPassword,
        email,
      };

      addressIdSqlF(email, clientData);
    });
  } //

  // send the address_id back to the client side for better routing
  function addressIdSqlF(email, clientData) {
    db.query(address_id, [email], (err, addressResult) => {
      if (err) {
        console.error("Error fetching address_id,:", err);
        return next(new Error());
      }
      const address_id = addressResult[0].address_id;
      console.log(`Address_id:${address_id} signed-up successfully`);
      res.status(201).send({ address_id: address_id });
    });
  }

  emailSqlF();
};

//  POST >>>
//  INSERT INTO
//   /fb/insert-order
export const insertOrder = (req, res, next) => {
  const { address_id, json_id, who, type, color, size, quantity, price } =
    req.body;
  if (!address_id) {
    console.error(
      "No order_id sent from the client side with add order request"
    );
    return constErr(
      400,
      "Sorry! we couldn't found your account please log-in again or ",
      next
    );
  }

  const orderSql = `INSERT INTO orders SET ?;`;
  const addressSql = `SELECT * FROM addresses WHERE address_id = ?`;

  function addressSqlF() {
    checkAddressSql(address_id, next, (addressResult) => {
      const client_id = addressResult[0]?.client_id;
      const values = {
        address_id,
        client_id,
        who,
        type,
        json_id,
        color,
        size,
        price,
        quantity,
      };
      orderSqlF(values);
    });
  }

  function orderSqlF(values) {
    db.query(orderSql, values, (err, orderResult) => {
      if (err) {
        console.error("Error Posting order:", err);
        return next(new Error());
      }

      console.log("Order Added successfully!");
      return res.status(201).end();
    });
  }

  addressSqlF();
};

//  READ >>> for log-in
//  SELECT *
//  fb/select-client
export const selectClient = (req, res, next) => {
  const { password, full_name } = req.query;
  if (!full_name || !password) {
    console.error("Please insert your full name and Password");
    return constErr(400, "Please insert your full name and password", next);
  }
  const fullName = full_name.trim().split(" ");
  if (fullName.length !== 2) {
    console.log("fullname.length !== 2");
    return constErr(
      400,
      "Please provide both first name and last name, like: John Doe",
      next
    );
  }

  const addressSqlF = (addressesSql, clients) => {
    db.query(addressesSql, clients, async (err, addressResult) => {
      if (err) {
        console.error("Error fetching addresses:", err);
        return next(new Error());
      }

      try {
        let passwordMatch = false;
        for (const each of addressResult) {
          const isMatch = await bcrypt.compare(password, each.password);
          if (isMatch) {
            passwordMatch = true;
            console.log(`Address_id:${each.address_id} logged-in successfully`);
            return res.send({ address_id: each.address_id });
          }
        }

        if (!passwordMatch) {
          console.error("Password doesn't match");
          return constErr(401, "Password doesn't match", next);
        }
      } catch (error) {
        console.error("Error Comparing password:", error);
        return next(new Error());
      }
    });
  };

  checkClientSql(fullName, next, (idResult) => {
    const clients = idResult.map((result) => result.id);
    const placeholders = idResult.map(() => "?").join(", ");
    const addressesSql = `SELECT * FROM addresses  WHERE client_id in(${placeholders})`;
    addressSqlF(addressesSql, clients);
  });
};

//  READ >>>
//  SELECT *
//  fb/select-order
export const selectOrder = (req, res, next) => {
  const { address_id } = req.query;
  if (!address_id) {
    console.error("no address_id found to fetch orders");
    return constErr(
      400,
      "Oops! we couldn't find your account, please log-in/sign-up again",
      next
    );
  }
  const addressSql = `SELECT * FROM addresses WHERE address_id = ?;`;
  db.query(addressSql, [address_id], (err, addressResult) => {
    if (err) {
      console.error("Error Checking the address", err);
      return next(new Error());
    }
    const client_id = addressResult[0]?.client_id;
    if (!client_id) {
      console.error("No address found");
      return constErr(404, "No client found, please sign-up", next);
    }

    checkOrderSql(client_id, next, (orderResult) => {
      console.log("Order(s) selected successfully!");
      return res.send(orderResult);
    });
  });
};

//  READ >>>  ensure the password is correct in managing account's page
//  SELECT password FROM ...
//  fb/manage-account-password/:id
export const manageAccountPasswod = (req, res, next) => {
  const address_id = req.params.id;
  const { password } = req.query;
  const inputPassword = password;
  if (!inputPassword || !address_id) {
    console.error("No address_id and/or password to manage account");
    return constErr(400, "Please log-in/sign-up and try agin", next);
  }

  const addressSql = `SELECT password FROM addresses WHERE address_id = ?;`;
  db.query(addressSql, [address_id], (err, addressResult) => {
    if (err) {
      console.error("Error fetching password", err);
      return next(new Error());
    }

    if (addressResult.length === 0) {
      console.error("No client found with the given address_id");
      return constErr(400, "Oops no data found please sign-up first", next);
    }

    const sqlPassword = addressResult[0]?.password;
    comparePassword(inputPassword, sqlPassword, next, (hashedPassword) => {
      res.status(201).end();
    });
  });
};

//  READ >>> to fill the form in managing account's page
//  SELECT *
//  fb/select-to-manage/:id
export const selectToManage = (req, res, next) => {
  const address_id = req.params.id;
  const { password } = req.query;
  if (!address_id) {
    console.error(
      "Client didn't include the address_id inorder to manage account"
    );
    return constErr(
      400,
      "Oops we couldn find your data please log-in/sign-up again",
      next
    );
  }

  const addressSql = `SELECT * FROM addresses WHERE address_id = ?;`;
  const clientSql = `SELECT * FROM clients WHERE id = ?`;

  function addressSqlF() {
    db.query(addressSql, [address_id], (err, addressResult) => {
      if (err) {
        console.error("Error fetchind address", err);
        return next(new Error());
      }
      if (addressResult.length === 0) {
        console.error("No data found with the given address_id");
        return constErr(
          400,
          "Oops we couldn't find your data please log-in/sign-up again",
          next
        );
      }

      const sqlPassword = addressResult[0]?.password;
      comparePassword(password, sqlPassword, next, () => {
        const client_id = addressResult[0]?.client_id;
        clientSqlF(client_id, addressResult);
      });
    });
  }

  function clientSqlF(client_id, addressResult) {
    db.query(clientSql, [client_id], (err, clientResult) => {
      if (err) {
        console.error("Error fetchind client", err);
        return next(new Error());
      }
      const client = clientResult[0];
      const address = addressResult[0];
      const data = {
        full_name: client.first_name + " " + client.last_name,
        gender: client.gender,
        age: client.age,
        email: address.email,
        password: password,
      };
      console.log("Data selected and set up in the form element");
      res.send(data);
    });
  }

  addressSqlF();
};

//  UPDATE >>>
//  UPDATE ... SET...
//  fb/manage-account-update/:id
export const manageAccountUpdate = (req, res, next) => {
  const address_id = req.params.id;
  const { full_name, email, password, new_gender, new_age } = req.body;

  if (!address_id) {
    console.error("Couldn't find the address_id to update client data");
    return constErr(
      400,
      "Couldn't find your data, please log-in/sign-up again",
      next
    );
  }

  if (!full_name || !email || !password) {
    console.error("Please insert the new full name, email, and password");
    return constErr(
      400,
      "Please insert the new full name, email, and password",
      next
    );
  }

  const fullName = full_name.trim().split(" ");
  const age = new_age || null;
  const gender = new_gender || null;
  if (fullName.length !== 2) {
    console.error("Please enter your full name");
    return constErr(200, "Enter your full name like: John Doe", next);
  }
  if (isNaN(age)) {
    console.error("Age Must  a number");
    return constErr(400, "Age must be a number", next);
  }

  //  Check if the email the client is updating to is the same as his/her previous email
  const checkIfIsPrevEmailSql = `SELECT email FROM addresses WHERE email = ? AND address_id = ?;`;

  //  check all emails and reject the update if an email exists
  const checkEmailsSql = `SELECT email FROM addresses WHERE email = ?;`;
  const checkAddressSql = `SELECT * FROM addresses WHERE address_id = ?;`;
  const updateAddressSql = `UPDATE addresses SET email = ?, password = ? WHERE address_id = ?;`;
  const updateClientSql = `UPDATE clients SET first_name = ?, last_name = ?, age = ?, gender = ? WHERE id = ?;`;

  function checkIfIsPrevEmailF() {
    db.query(
      checkIfIsPrevEmailSql,
      [email, address_id],
      (err, checkIfIsPrevEmailResult) => {
        if (err) {
          console.error("Error fetching email", err);
          return next(new Error());
        }
        checkIfEmailExistsF(checkIfIsPrevEmailResult);
      }
    );
  }

  function checkIfEmailExistsF(checkIfIsPrevEmailResult) {
    db.query(checkEmailsSql, [email], (err, emailSqlResult) => {
      if (err) {
        console.error("Error checking similar email", err);
        return next(new Error());
      }

      if (
        emailSqlResult.length === 1 &&
        checkIfIsPrevEmailResult.length
      ) {
        console.log("Went this way");
        checkAddressF();
        return;
      } else if (emailSqlResult.length > 0) {
        console.error("Email already Exists");
        return constErr(409, "This Email address Already exists!", next);
      } else {
        checkAddressF();
      }
      checkAddressF();
    });
  }

  function checkAddressF() {
    db.query(checkAddressSql, [address_id], (err, checkAddressResult) => {
      if (err) {
        console.error("Error checking the address to be updated", err);
        return next(new Error());
      }

      if (checkAddressResult.length === 0) {
        console.error("No data found to be updated with the given address_id");
        return constErr(
          404,
          "No data found to be updated, please log-in/sign-up again",
          next
        );
      }

      hashPassword(password, next, (hashPassword) => {
        const addressValue = [email, hashPassword, address_id];
        updateAddressF(addressValue, checkAddressResult);
      });
    });
  }

  function updateAddressF(addressValue, checkAddressResult) {
    db.query(updateAddressSql, addressValue, (err, addressResult) => {
      if (err) {
        console.log(addressResult);
        console.error("Error updating address", err);
        return next(new Error());
      }

      const client_id = checkAddressResult[0]?.client_id;
      const clientValue = [fullName[0], fullName[1], age, gender, client_id];
      updateClientF(clientValue);
    });
  }

  function updateClientF(clientValue) {
    db.query(updateClientSql, clientValue, (err) => {
      if (err) {
        console.error("Error updating client data", err);
        return next(new Error());
      }

      console.log("Client data updated successfully!");
      res.status(201).end();
    });
  }

  checkIfIsPrevEmailF();
};

//  DELETE >>>
//  DELETE order FROM...
//  fb/delete-order
export const deleteOrder = (req, res, next) => {
  const { order_id } = req.query;
  if (!order_id) {
    console.error("Client doesn't send the order_id to be deleted");
    return constErr(
      400,
      "We couldn't find your account, Please sign-up/log-in again"
    );
  }

  if (isNaN(order_id)) {
    console.error("the address id should be number");
    return constErr(
      400,
      "Oops we couldn't find your account please sing-up/log-in",
      next
    );
  }

  const orderSql = `DELETE FROM orders WHERE order_id = ?`;
  db.query(orderSql, [order_id], (err, orderResult) => {
    if (err) {
      console.error("Error deleting order", err);
      return next(new Error());
    }

    console.log("Order deleted successfully!");
    res.status(204).end();
  });
};

//  DELETE >>>
//  DELETE FROM ...
//  fb/manage-account-delete/:id
export const manageAccountDelete = (req, res, next) => {
  const address_id = req.params.id;
  if (!address_id) {
    console.error("No address_id found to delete an account");
    return constErr(
      400,
      "Oops we couldn't find your data refresh or open the website again",
      next
    );
  }

  const deleteClientSql = `DELETE FROM clients WHERE id = ?;`;
  const deleteAddressSql = `DELETE FROM addresses WHERE address_id = ?;`;
  const deleteOrdersSql = `DELETE FROM orders WHERE address_id = ?;`;

  function deleteClientF(client_id) {
    db.query(deleteClientSql, [client_id], (err) => {
      if (err) {
        console.error("Error deleting address", err);
        return next(new Error());
      }

      console.log("Account deleted successfully!");
      res.status(201).end();
    });
  }

  function deleteAddressF(client_id) {
    db.query(deleteAddressSql, [address_id], (err) => {
      if (err) {
        console.error("Error deleting address", err);
        return next(new Error());
      }

      deleteClientF(client_id);
    });
  }

  function deleteOrderF(client_id) {
    db.query(deleteOrdersSql, [address_id], (err) => {
      if (err) {
        console.error("Error deleting order(s)", err);
        return next(new Error());
      }

      deleteAddressF(client_id);
    });
  }
  checkAddressSql(address_id, next, (addressResult) => {
    const client_id = addressResult[0]?.client_id;
    deleteOrderF(client_id);
  });
};
