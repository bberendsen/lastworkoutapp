import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  birthdate?: string;
  email?: string;
  has_subscription?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api';

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: string, data: Partial<Pick<User, 'first_name' | 'last_name' | 'username'>>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, data);
  }
}
