import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Home } from './components/home/home';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { UsersComponent } from './components/users/users';
import { Videos } from './components/videos/videos';
import { Profile } from './components/profile/profile';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'dashboard',
        component: Home,
        canActivate: [authGuard]
    },
    {
        path: 'forgot-password',
        component: ForgotPassword
    },
    {
        path: 'users',
        component: UsersComponent,
        canActivate: [authGuard]
    },
    {
        path: 'videos',
        component: Videos,
        canActivate: [authGuard]
    },
    {
        path: 'profile',
        component: Profile,
        canActivate: [authGuard]
    }
];
