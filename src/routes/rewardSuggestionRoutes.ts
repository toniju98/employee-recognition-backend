import express from "express";
import { RewardSuggestionController } from "../controllers/rewardSuggestionController";
import { isAdmin } from "../middleware/roleMiddleware";

//TODO: maybe suggestion should be deleted after some time automatically or there needs to be an option to delete it

const router = express.Router();
const suggestionController = new RewardSuggestionController();

router.post(
  "/organization/suggestions",
  suggestionController.createSuggestion
);

router.get(
  "/organization/suggestions",
  suggestionController.getOrganizationSuggestions
);

router.post(
  "/suggestions/:id/vote",
  suggestionController.toggleVote
);

router.patch(
  "/suggestions/:id/review",
  isAdmin,
  suggestionController.reviewSuggestion
);

export default router;
