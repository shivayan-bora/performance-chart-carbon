import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, provideAppCheck } from '@angular/fire/app-check';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({ "projectId": "fir-angular-88a89", "appId": "1:310251604689:web:6c8a3b62cdf0ee5bd813f0", "storageBucket": "fir-angular-88a89.appspot.com", "apiKey": "AIzaSyAaH8wJR_xZnyFmxoTfywZ0ORC-YdVm6BM", "authDomain": "fir-angular-88a89.firebaseapp.com", "messagingSenderId": "310251604689" })), provideAppCheck(() => {
    // TODO get a reCAPTCHA Enterprise here https://console.cloud.google.com/security/recaptcha?project=_
    const provider = new ReCaptchaEnterpriseProvider("6LfwBQUqAAAAAFVvUxrzuebBqVJy8BGlC3PXnIQR");
    return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
  })]
};
