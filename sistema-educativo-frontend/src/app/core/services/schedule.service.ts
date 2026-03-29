import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/course-schedules`;

  getSchedules(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(this.apiUrl, { params: httpParams });
  }

  createSchedule(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateSchedule(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteSchedule(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
