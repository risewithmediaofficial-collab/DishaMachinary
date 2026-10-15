const downloadPdf = require('@/handlers/downloadHandler/downloadPdf');
const express = require('express');

const router = express.Router();

router.route('/:directory/:file').get(function (req, res) {
  try {
    const { directory, file } = req.params;
    let format = req.query.format || 'a4';
    let id = '';

    if (file.includes('-thermal-')) {
      format = 'thermal';
      id = file.replace(`${directory}-thermal-`, '').replace(/\.pdf$/i, '');
    } else {
      id = file.replace(`${directory}-`, '').replace(/\.pdf$/i, '');
    }

    downloadPdf(req, res, { directory, id, format });
  } catch (error) {
    return res.status(503).json({
      success: false,
      result: null,
      message: error.message,
      error: error,
    });
  }
});

module.exports = router;
