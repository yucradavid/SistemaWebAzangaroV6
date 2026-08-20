import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        Swal.fire({
          icon: 'warning',
          title: 'Acceso denegado',
          text: 'No tienes permisos para realizar esta acción.',
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        });
      }

      return throwError(() => error);
    })
  );
};
