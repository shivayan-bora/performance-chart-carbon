import { Component } from '@angular/core';
import { PerformanceChartComponent } from './charts/performance-chart/performance-chart.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PerformanceChartComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'performance-chart-carbon';
}
