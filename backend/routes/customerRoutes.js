const router = require("express").Router();
const customers = require("../controllers/customerController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.use(requireAuth, requireAdmin);
router.get("/", customers.list);
router.post("/", customers.create);
router.get("/:id", customers.getById);
router.put("/:id", customers.update);
router.delete("/:id", customers.remove);

module.exports = router;
