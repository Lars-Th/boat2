import { HttpClient } from '../client/http-client';
import { UserService } from '../services';

export class ApiConfiguration {
  private httpClient: HttpClient;

  public readonly users: UserService;

  constructor(baseURL?: string) {
    this.httpClient = new HttpClient({
      baseURL:
        baseURL ??
        (import.meta.env as unknown as { VITE_API_BASE_URL: string }).VITE_API_BASE_URL ??
        '/api',
    });

    // Initialize all services
    this.users = new UserService(this.httpClient);
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
