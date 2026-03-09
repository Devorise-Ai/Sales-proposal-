import { Request, Response, NextFunction } from 'express';
import * as proposalService from '../services/proposal.service';
import { calculate } from '../services/pricing.service';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const proposal = await proposalService.createProposal({
      userId: req.user!.sub,
      ...req.body,
    });
    res.status(201).json(proposal);
  } catch (err) {
    next(err);
  }
}

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, page, limit } = req.query;
    const result = await proposalService.getProposals(
      req.user!.sub,
      status as string | undefined,
      page ? parseInt(page as string, 10) : undefined,
      limit ? parseInt(limit as string, 10) : undefined,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const proposal = await proposalService.getProposalById(
      req.params.id,
      req.user!.sub,
    );
    res.json(proposal);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const proposal = await proposalService.updateProposal(
      req.params.id,
      req.user!.sub,
      req.body,
    );
    res.json(proposal);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await proposalService.deleteProposal(req.params.id, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function calculatePricing(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { moduleIds, infrastructureType, bulkMessaging } = req.body;
    const result = await calculate(moduleIds, infrastructureType, bulkMessaging);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
