import { Router, type IRouter } from "express";
import healthRouter from "./health";
import portalRouter from "./portal";
import learningViewsRouter from "./learning-views";

const router: IRouter = Router();

router.use(healthRouter);
router.use(portalRouter);
router.use(learningViewsRouter);

export default router;
