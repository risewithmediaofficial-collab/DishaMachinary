const deleteMany = async (Model, req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'No IDs provided for batch deletion',
    });
  }

  const result = await Model.updateMany(
    { _id: { $in: ids } },
    { $set: { removed: true } }
  ).exec();

  return res.status(200).json({
    success: true,
    result,
    message: `Successfully deleted ${result.modifiedCount || ids.length} items`,
  });
};

module.exports = deleteMany;
