import { Router } from "express";
import { requireUser } from "../../middleware/auth.middleware";
import {
  getConnectionsHandler,
  getConnectionRequestsHandler,
  requestConnectionHandler,
  acceptConnectionHandler,
  rejectConnectionHandler,
  deleteConnectionHandler,
} from "./connections.controller";

const router = Router();

// All connection routes require authentication
router.use(requireUser);

// POST /api/connections/request — send connection request (body: { receiverId })
router.post("/request", requestConnectionHandler);

// GET /api/connections/requests — list pending requests (received by current user)
// Must be before /:id so "requests" is not captured as id
router.get("/requests", getConnectionRequestsHandler);

// POST /api/connections/:id/accept — accept a connection request
router.post("/:id/accept", acceptConnectionHandler);

// POST /api/connections/:id/reject — reject a connection request
router.post("/:id/reject", rejectConnectionHandler);

// DELETE /api/connections/:id — cancel/remove connection
router.delete("/:id", deleteConnectionHandler);

// GET /api/connections — list my connections (accepted only)
router.get("/", getConnectionsHandler);

export default router;
