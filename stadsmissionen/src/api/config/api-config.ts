import { HttpClient } from '../client/http-client';
import {
  ActivityService,
  ActivityTypeService,
  AttendanceService,
  AuthService,
  ContactService,
  CustomerService,
  ParticipantService,
} from '../services';

export class ApiConfiguration {
  private httpClient: HttpClient;

  public readonly activities: ActivityService;
  public readonly activityTypes: ActivityTypeService;
  public readonly attendances: AttendanceService;
  public readonly participants: ParticipantService;
  public readonly auth: AuthService;
  public readonly customers: CustomerService;
  public readonly contacts: ContactService;

  constructor(baseURL?: string) {
    this.httpClient = new HttpClient({
      baseURL: baseURL ?? (import.meta.env['VITE_API_BASE_URL'] as string) ?? '/api',
    });

    // Initialize all services
    this.activities = new ActivityService(this.httpClient);
    this.activityTypes = new ActivityTypeService(this.httpClient);
    this.attendances = new AttendanceService(this.httpClient);
    this.participants = new ParticipantService(this.httpClient);
    this.auth = new AuthService(this.httpClient);
    this.customers = new CustomerService(this.httpClient);
    this.contacts = new ContactService(this.httpClient);
  }

  setBaseURL(baseURL: string): void {
    this.httpClient.setBaseURL(baseURL);
  }

  setTimeout(timeout: number): void {
    this.httpClient.setTimeout(timeout);
  }

  setCustomHeader(key: string, value: string): void {
    this.httpClient.setHeader(key, value);
  }

  removeCustomHeader(key: string): void {
    this.httpClient.removeHeader(key);
  }
}
