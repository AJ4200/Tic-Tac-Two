const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { registerPlayer } = require("../services/gameService");

const router = express.Router();

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const player = await registerPlayer({
      playerId: req.body.playerId,
      name: req.body.name,
    });
    res.json(player);
  })
);

module.exports = router;
