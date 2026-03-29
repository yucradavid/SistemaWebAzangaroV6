import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles: UserRole[] = route.data['roles'];
  const currentRole = authService.getRole();

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (expectedRoles && currentRole && expectedRoles.includes(currentRole)) {
    return true;
  }

  // If user is authenticated but not authorized for route, redirect to root dashboard
  return router.createUrlTree(['/app/dashboard']);
};
