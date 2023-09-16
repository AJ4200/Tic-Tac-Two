import express from "express";
import { createUser, updateUser } from "../controllers/userController";

const router = express.Router();

router.post("/create", createUser);
router.put("/update", updateUser);

export default router;
