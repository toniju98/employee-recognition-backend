import { Request, Response } from "express";
import { AnalyticsService } from "../services/analyticsService";
import { UserService } from "../services/userService";

export class AnalyticsController {
  private analyticsService: AnalyticsService;
  private userService: UserService;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.userService = new UserService();
  }

  public getEngagementMetrics = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      const { timeframe } = req.query;
      const period = timeframe
        ? (String(timeframe) as "weekly" | "monthly" | "quarterly")
        : "monthly";

      const metrics = await this.analyticsService.getEngagementMetrics(
        organizationId,
        period
      );
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch engagement metrics" });
    }
  };

  public getPerformanceInsights = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const keycloakUser = (req as any).kauth?.grant?.access_token?.content;
      const organizationId = await this.userService.getUserOrganization(keycloakUser.sub);
      const { department } = req.query;

      const insights = await this.analyticsService.getPerformanceInsights(
        organizationId,
        department as string
      );
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch performance insights" });
    }
  };
}
