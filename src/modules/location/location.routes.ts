import { Router } from "express";
import * as ctrl from "./location.controller";

const router = Router();

router.get("/countries", ctrl.listCountries);
router.get("/cities", ctrl.listCities);

export default router;
