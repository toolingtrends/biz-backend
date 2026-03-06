"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const venues_controller_1 = require("./venues.controller");
const router = (0, express_1.Router)();
// List venues
router.get("/venues", venues_controller_1.getVenuesHandler);
// Events for a specific venue
router.get("/venues/:id/events", venues_controller_1.getVenueEventsHandler);
exports.default = router;
