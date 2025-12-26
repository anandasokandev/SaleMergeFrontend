import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Home } from './components/home/home';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { UsersComponent } from './components/users/users';
import { Videos } from './components/videos/videos';

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
        component: Home
    },
    {
        path: 'forgot-password',
        component: ForgotPassword
    },
    {
        path: 'users',
        component: UsersComponent
    },
    {
        path: 'videos',
        component: Videos
    }
];
