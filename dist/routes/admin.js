"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const events_controller_1 = require("../modules/events/events.controller");
const router = (0, express_1.Router)();
// POST /api/admin/events - create event (admin only)
router.post("/events", auth_middleware_1.requireAdmin, events_controller_1.createEventAdminHandler);
exports.default = router;
