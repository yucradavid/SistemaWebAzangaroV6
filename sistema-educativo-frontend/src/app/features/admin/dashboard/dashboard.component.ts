import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  
  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => this.user = u);
  }
}
