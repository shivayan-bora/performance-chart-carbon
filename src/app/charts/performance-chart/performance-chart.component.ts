import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { LineChart, LineChartOptions, ChartTabularData, ScaleTypes } from '@carbon/charts';
import '@carbon/charts/styles.css';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-performance-chart',
  standalone: true,
  imports: [],
  templateUrl: './performance-chart.component.html',
  styleUrls: ['./performance-chart.component.css']
})
export class PerformanceChartComponent implements OnInit, OnDestroy {
  chart!: LineChart;
  data: ChartTabularData = [];
  isDarkTheme: boolean = false;
  subscription!: Subscription;

  constructor(private renderer: Renderer2) { }

  get options(): LineChartOptions {
    return {
      title: 'Performance Testing Chart',
      axes: {
        bottom: {
          title: 'Time Elapsed',
          mapsTo: 'date',
          scaleType: ScaleTypes.TIME,
        },
        left: {
          title: 'Value',
          mapsTo: 'value',
          scaleType: ScaleTypes.LINEAR,
        }
      },
      curve: 'curveMonotoneX',
      height: '400px',
      color: {
        scale: {
          Load: 'blue',
          Success: 'green',
          Error: 'red'
        }
      },
      tooltip: {
        showTotal: true // Ensures the tooltip is descriptive
      },
      theme: this.isDarkTheme ? 'g100' : 'g10' // g100 for dark theme, g10 for light theme
    };
  }

  ngOnInit(): void {
    // Initialize the chart
    const chartContainer = this.getChartContainer();
    if (chartContainer) {
      this.chart = new LineChart(chartContainer, {
        data: this.data,
        options: this.options
      });

      // Set ARIA labels and roles for accessibility
      chartContainer.setAttribute('role', 'img');
      chartContainer.setAttribute('aria-label', 'Live line chart displaying load, success, and error data over time');
    }

    // Start fetching data
    this.startFetchingData();
  }

  ngOnDestroy(): void {
    // Unsubscribe from the polling when the component is destroyed
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  getChartContainer(): HTMLDivElement | null {
    return document.getElementById('chart-container') as HTMLDivElement;
  }

  private startFetchingData(): void {
    console.log('Starting data fetch');
    this.subscription = interval(5000)
      .pipe(
        switchMap(() => {
          console.log('Fetching data');
          return fetch('https://performance-chart-backend.adaptable.app/data').then(response => response.json());
        })
      )
      .subscribe(
        newData => {
          const formattedLoadData = {
            group: 'Load',
            date: new Date(newData.load.date),
            value: newData.load.value
          };
          const formattedErrorData = {
            group: 'Error',
            date: new Date(newData.errors.date),
            value: newData.errors.value
          };
          const formattedSuccessData = {
            group: 'Success',
            date: new Date(newData.success.date),
            value: newData.success.value
          };
          this.data.push(formattedLoadData, formattedErrorData, formattedSuccessData);
          this.chart.model.setData(this.data);
          this.addClickListeners();
          console.log('Fetched data:', this.data);
        },
        error => {
          console.error('Error fetching data:', error);
        }
      );
  }

  addClickListeners(): void {
    const points = document.querySelectorAll('.dot');
    points.forEach(point => {
      point.removeEventListener('click', this.handleClick);
      point.addEventListener('click', this.handleClick.bind(this));
    });
  }

  handleClick(event: Event): void {
    const target = event.target as any;
    const dataPoint = target.__data__;
    if (dataPoint) {
      alert(`Group: ${dataPoint.group}, Date: ${dataPoint.date}, Value: ${dataPoint.value}`);
    }
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.chart.model.setOptions(this.options);
    if (this.isDarkTheme) {
      this.renderer.addClass(document.body, 'dark');
    } else {
      this.renderer.removeClass(document.body, 'dark');
    }
  }
}
