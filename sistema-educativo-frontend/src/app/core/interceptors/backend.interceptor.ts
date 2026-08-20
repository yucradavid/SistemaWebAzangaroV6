import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';

export const backendInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
          confirmButtonText: 'Entendido',
        });
      } else if (error.status === 404) {
        Swal.fire({
          icon: 'info',
          title: 'Recurso no encontrado',
          text: 'El recurso solicitado no existe o fue eliminado.',
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        });
      } else if (error.status >= 500) {
        Swal.fire({
          icon: 'error',
          title: 'Error del servidor',
          text: 'Ocurrió un error interno. Intenta nuevamente más tarde.',
          confirmButtonText: 'Entendido',
        });
      }

      return throwError(() => error);
    })
  );
};
