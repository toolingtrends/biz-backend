"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const speakers_controller_1 = require("./speakers.controller");
const router = (0, express_1.Router)();
// List speakers
router.get("/speakers", speakers_controller_1.getSpeakersHandler);
// Single speaker profile
router.get("/speakers/:id", speakers_controller_1.getSpeakerHandler);
// Speaker events
router.get("/speakers/:id/events", speakers_controller_1.getSpeakerEventsHandler);
exports.default = router;
