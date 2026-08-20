import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login-mock',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-mock.component.html',
})
export class LoginMockComponent implements OnInit {
  email = '';
  password = '';
  error = '';
  loading = false;
  private returnUrl = '/app';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.authService.getHomeRoute());
    }
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/app';
  }

  async handleSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Por favor ingresa correo y contraseña.';
      return;
    }

    this.error = '';
    this.loading = true;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        if (!res.success) {
          this.error = res.error || 'Autenticación fallida.';
          this.loading = false;
        } else {
          const target = (this.returnUrl && this.returnUrl !== '/app')
            ? this.returnUrl
            : this.authService.getHomeRoute();
          this.router.navigateByUrl(target);
        }
      },
      error: (err) => {
        console.error('Error inesperado en login', err);
        this.error = 'Error al conectar con el servidor. Verifica que el backend esté corriendo.';
        this.loading = false;
      }
    });
  }
}
