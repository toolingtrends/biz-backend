import { Router } from "express";
import {
  listHandler,
  getByIdHandler,
  createHandler,
  deleteHandler,
  updateHandler,
} from "./exhibitor-manuals.controller";

const router = Router();

router.get("/exhibitor-manuals", listHandler);
router.get("/exhibitor-manuals/:id", getByIdHandler);
router.post("/exhibitor-manuals", createHandler);
router.delete("/exhibitor-manuals/:id", deleteHandler);
router.patch("/exhibitor-manuals/:id", updateHandler);

export default router;
