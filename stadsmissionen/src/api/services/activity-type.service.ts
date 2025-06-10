import type { ActivityType } from '@/types';
import type { HttpClient } from '../client/http-client';
import { BaseService } from '@/api/services/base.service';

export class ActivityTypeService extends BaseService<ActivityType> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/activity-types');
  }

  // ActivityType is typically read-only, so we only need basic CRUD
  // Additional methods can be added here if needed
}
