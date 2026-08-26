import { Router } from 'express';
import { listFacilities, getFacility } from '../controllers/facility.controller';

const router = Router();
router.get('/', listFacilities);
router.get('/:id', getFacility);
export default router;
