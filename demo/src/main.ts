import './polyfills';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './demo/app.config';
import { DemoComponent } from './demo/demo.component';

bootstrapApplication(DemoComponent, appConfig)
  .catch((err) => console.error(err));
