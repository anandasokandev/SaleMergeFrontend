import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
        <div>
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            Account Creation
          </h2>
          <p class="mt-4 text-lg text-gray-600">
            Self account creation is not possible.
          </p>
          <p class="mt-2 text-sm text-gray-500">
            Please contact <a href="mailto:info.salemerge@gmail.com" class="font-medium text-blue-600 hover:text-blue-500">info.salemerge@gmail.com</a> to create an account.
          </p>
        </div>
        <div class="mt-6">
          <a routerLink="/login" class="font-medium text-blue-600 hover:text-blue-500">
            &larr; Back to Login
          </a>
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class Signup { }
