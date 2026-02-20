const express = require("express");
const { cleanStudentNotes } = require("../services/openaiService");

const router = express.Router();

router.post("/clean-notes", async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes || typeof notes !== "string") {
      return res.status(400).json({
        error: "Please send notes as text in the request body."
      });
    }

    const cleanedResult = await cleanStudentNotes(notes);

    return res.json(cleanedResult);
  } catch (error) {
    console.error("AI route error:", error);

    return res.status(500).json({
      error: "Could not clean notes right now. Please try again."
    });
  }
});

module.exports = router;
