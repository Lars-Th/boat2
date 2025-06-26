import { BaseService } from './base.service';
import type { ApiResponse } from '../client/types';

export interface ActivityCompletion {
  id: number;
  aktivitetId: number;
  genomfordDatum: string;
  antalInbjudna: number;
  antalNarvarande: number;
  frånvarande: number[];
  resultat: ParticipantResult[];
  uppföljningsbehov: FollowUpNeed[];
  personalAnteckningar: string;
  genomfordAv: string;
  skapadDatum: string;
  anonymaBesökare?: AnonymousVisitors;
}

export interface ParticipantResult {
  deltagarId: number | string;
  svar: QuestionAnswer[];
}

export interface QuestionAnswer {
  fragaId: number;
  svar: number | boolean | string;
  kommentar?: string;
}

export interface FollowUpNeed {
  deltagarId: number | string;
  anledning: string;
  åtgärd: string;
  prioritet: 'låg' | 'medium' | 'hög';
}

export interface AnonymousVisitors {
  totalBesökare: number;
  demografi: {
    åldersgrupper: Record<string, number>;
    kön: Record<string, number>;
  };
}

export class ActivityCompletionService extends BaseService<ActivityCompletion> {
  constructor(httpClient: any) {
    super(httpClient, '/activity-completions');
  }

  async getByActivityId(activityId: string): Promise<ApiResponse<ActivityCompletion[]>> {
    return this.get<ActivityCompletion[]>(`${this.endpoint}/by-activity/${activityId}`);
  }

  async getCompletionStats(): Promise<
    ApiResponse<{
      totalCompletions: number;
      completionRate: number;
      averageRating: number;
      participantSatisfaction: number;
      followUpNeeded: number;
    }>
  > {
    return this.get<{
      totalCompletions: number;
      completionRate: number;
      averageRating: number;
      participantSatisfaction: number;
      followUpNeeded: number;
    }>(`${this.endpoint}/stats`);
  }
}
