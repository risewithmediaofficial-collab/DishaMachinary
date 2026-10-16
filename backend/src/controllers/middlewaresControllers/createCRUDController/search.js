const escapeRegex = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const search = async (Model, req, res) => {
  const fieldsArray = req.query.fields ? req.query.fields.split(',') : ['name'];
  const q = req.query.q !== undefined ? String(req.query.q).trim() : '';

  const fields = { $or: [] };

  if (q) {
    const escaped = escapeRegex(q);
    for (const field of fieldsArray) {
      fields.$or.push({ [field]: { $regex: new RegExp(escaped, 'i') } });
    }
  }

  const queryCondition = fields.$or.length > 0 ? { ...fields, removed: false } : { removed: false };

  const results = await Model.find(queryCondition)
    .limit(20)
    .exec();

  return res.status(200).json({
    success: true,
    result: results || [],
    message: results && results.length >= 1 ? 'Successfully found all documents' : 'No document found by this request',
  });
};

module.exports = search;
