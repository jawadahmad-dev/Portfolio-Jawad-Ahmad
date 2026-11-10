import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Shared } from '../Services/shared';
import { Rest } from '../Services/rest';

export const mainGuard: CanActivateFn = async () => {
  const sharedService = inject(Shared);
  const restService = inject(Rest);
  const router = inject(Router);

  try {
    const snapshot = await restService.getLoggedInUser();
    const loggedInUser = snapshot.val();

    if (loggedInUser?.loggedIn === true) {
      return true;
    }

    sharedService.toaster('error', 'Access Denied', 'You must be logged in to access this page.');
  } catch (error) {
    console.error('Error checking logged-in user:', error);
    sharedService.toaster('error', 'Error', 'An error occurred while checking login status.');
  }

  return router.createUrlTree(['/**']);
};