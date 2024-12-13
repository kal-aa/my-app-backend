const notFound = (req, res, next) => {
  console.error("NOT FOUND");
  res.render("notFound", { message: req.originalUrl });
};
export default notFound;
