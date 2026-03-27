import { Request, Response } from 'express';
import { NotFoundError } from '../../utils/globalErrorHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { TitlesService } from './titles.service';

const service = new TitlesService();

export class TitlesController {
  async listTitles(req: Request, res: Response): Promise<void> {
    const result = await service.listTitles(req.query as Record<string, string | undefined>);
    sendSuccess(res, result.data, result.meta);
  }

  async getTitle(req: Request, res: Response): Promise<void> {
    const title = await service.getById(req.params.id);
    if (!title) {
      throw new NotFoundError('Title');
    }

    sendSuccess(res, title);
  }

  async getAggregate(req: Request, res: Response): Promise<void> {
    const aggregate = await service.getAggregate(req.params.id);
    sendSuccess(res, aggregate);
  }

  async create(req: Request, res: Response): Promise<void> {
    const created = await service.create(req.body);
    res.status(201).json({ data: created });
  }

  async update(req: Request, res: Response): Promise<void> {
    const updated = await service.update(req.params.id, req.body);
    sendSuccess(res, updated);
  }

  async softDelete(req: Request, res: Response): Promise<void> {
    await service.softDelete(req.params.id);
    res.status(204).send();
  }
}
