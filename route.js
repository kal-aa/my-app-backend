import express from "express";
import {
  insertClient,
  insertOrder,
  selectClient,
  selectOrder,
  deleteOrder,
  manageAccountPasswod,
  selectToManage,
  manageAccountDelete,
  manageAccountUpdate,
} from "./controllers/rest.js";
const route = express.Router();

//  fb/insert-client
route.post("/insert-client", insertClient);

//  fb/insert-order
route.post("/insert-order", insertOrder);

//  fb/select-client
route.get("/select-client", selectClient);

//  fb/select-order
route.get("/select-order", selectOrder);

//  fb/select-to-manage
route.get("/select-to-manage/:id", selectToManage);

//  fb/manage-acc-password
route.get("/manage-account-password/:id", manageAccountPasswod);

//  fb/manage-account-update
route.put("/manage-account-update/:id", manageAccountUpdate);

//  fb/delete-order
route.delete("/delete-order", deleteOrder);

//  fb/manage-account-delete
route.delete("/manage-account-delete/:id", manageAccountDelete);

export default route;
