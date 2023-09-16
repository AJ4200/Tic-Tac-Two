import express from "express";
import { createGame, joinGame } from "../controllers/gameController";

const router = express.Router();

router.post("/create", createGame);
router.post("/join", joinGame);

export default router;
