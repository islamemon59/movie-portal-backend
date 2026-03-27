import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { ReviewsService } from './reviews.service';

const service = new ReviewsService();

export class ReviewsController {
  async create(req: Request, res: Response): Promise<void> {
    const created = await service.create(req.params.titleId, req.authUser!.id, req.body);
    res.status(201).json({ data: created });
  }

  async update(req: Request, res: Response): Promise<void> {
    const updated = await service.update(req.params.id, req.authUser!.id, req.body);
    sendSuccess(res, updated);
  }

  async remove(req: Request, res: Response): Promise<void> {
    await service.remove(req.params.id, req.authUser!.id, req.authUser!.role === 'ADMIN');
    res.status(204).send();
  }

  async listApprovedByTitle(req: Request, res: Response): Promise<void> {
    const result = await service.listApprovedByTitle(req.params.titleId, req.query as Record<string, string>);
    sendSuccess(res, result.data, result.meta);
  }

  async listForAdmin(req: Request, res: Response): Promise<void> {
    const result = await service.listForAdmin(req.query as { page?: string; limit?: string; status?: 'PENDING' | 'APPROVED' | 'UNPUBLISHED' });
    sendSuccess(res, result.data, result.meta);
  }

  async approve(req: Request, res: Response): Promise<void> {
    const review = await service.approve(req.params.id, req.authUser!.id);
    sendSuccess(res, review);
  }

  async unpublish(req: Request, res: Response): Promise<void> {
    const review = await service.unpublish(req.params.id, req.authUser!.id, req.body?.reason);
    sendSuccess(res, review);
  }
}
