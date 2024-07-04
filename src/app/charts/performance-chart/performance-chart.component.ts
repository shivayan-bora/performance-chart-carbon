import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { LineChart, LineChartOptions, ChartTabularData, ScaleTypes, LineEvent, ToolbarControlTypes, ZoomDomainEvent, getDomain } from '@carbon/charts';
import '@carbon/charts/styles.css';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import * as d3 from 'd3';

interface ChartData {
  group: string;
  date: Date;
  value: number;
}

@Component({
  selector: 'app-performance-chart',
  standalone: true,
  templateUrl: './performance-chart.component.html',
  styleUrls: ['./performance-chart.component.css'],
  imports: []
})
export class PerformanceChartComponent implements OnInit, OnDestroy {
  chart!: LineChart;
  data: ChartTabularData = [];
  isDarkTheme: boolean = false;
  subscription!: Subscription;
  zoomDuration: number = 25 * 1000; // 25 seconds in milliseconds
  showTable: boolean = false;
  autoSliding: boolean = true;

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
      theme: this.isDarkTheme ? 'g100' : 'g10', // g100 for dark theme, g10 for light theme,
      zoomBar: {
        top: {
          enabled: true,
          type: 'graph_view'
        }
      },
      toolbar: {
        enabled: true,
        controls: [
          {
            type: ToolbarControlTypes.ZOOM_IN
          },
          {
            type: ToolbarControlTypes.ZOOM_OUT
          },
          {
            type: 'Custom',
            id: 'toggleTable',
            text: 'Toggle Table',
            title: 'Show or hide data table',
            clickFunction: () => this.toggleTable()
          },
          {
            type: 'Custom',
            id: 'toggleSlidingWindow',
            text: 'Toggle Sliding Window',
            title: 'Toggle automatic sliding window',
            clickFunction: () => this.toggleSlidingWindow()
          }
        ]
      }
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
      chartContainer.setAttribute('aria-label', 'Live line chart displaying performance and load testing data over time');

      this.chart.services.events.addEventListener(LineEvent.POINT_CLICK, (e: CustomEvent) => this.handleClick(e));
      this.chart.services.events.addEventListener(ZoomDomainEvent.CHANGE, () => this.handleZoomChange());
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
        switchMap(async () => {
          console.log('Fetching data');
          return fetch('https://pc-be.adaptable.app/data').then(response => response.json());
        })
      )
      .subscribe({
        next: newData => {
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

          this.updateChart();
          console.log('Fetched data:', this.data);
        },
        error: error => {
          console.error('Error fetching data:', error);
        }
      });
  }

  updateChart(): void {
    const focusedElementId = document.activeElement?.id;

    this.chart.model.setData(this.data);
    if (this.autoSliding) {
      this.updateZoomDomain();
    }
    this.addCustomLineStyles();

    if (focusedElementId) {
      setTimeout(() => {
        const focusedElement = document.getElementById(focusedElementId);
        if (focusedElement) {
          focusedElement.focus();
        }
      }, 0);
    }
  }

  updateZoomDomain(): void {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - this.zoomDuration); // sliding window based on zoomDuration in milliseconds
    this.chart.model.setOptions({
      zoomBar: {
        top: {
          initialZoomDomain: [startDate, endDate]
        }
      }
    });
  }

  handleZoomChange(): void {
    const zoomBarState = this.chart.services.zoom.model.get('zoomDomain');
    if (zoomBarState) {
      this.zoomDuration = zoomBarState[1].getTime() - zoomBarState[0].getTime(); // keep duration in milliseconds
      if (this.autoSliding) {
        this.updateZoomDomain();
      }
    }
  }

  handleClick(event: CustomEvent): void {
    const dataPoint = event?.detail?.datum;
    alert(`Group: ${dataPoint.group}, Date: ${dataPoint.date}, Value: ${dataPoint.value}`);
  }

  addCustomLineStyles(): void {
    const dataGroups = this.chart.model.getDisplayData().map((d: ChartData) => d.group);
    const lines = d3.selectAll('path.line').nodes();

    lines.forEach((line, index) => {
      const lineElement = line as SVGPathElement;
      const group = dataGroups[index];
      if (group === 'Load') {
        d3.select(lineElement).style('stroke-dasharray', '0');
      } else if (group === 'Success') {
        d3.select(lineElement).style('stroke-dasharray', '5,5');
      } else if (group === 'Error') {
        d3.select(lineElement).style('stroke-dasharray', '10,10');
      }
    });
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

  toggleTable(): void {
    this.showTable = !this.showTable;
  }

  toggleSlidingWindow(): void {
    this.autoSliding = !this.autoSliding;
    if (this.autoSliding) {
      this.updateZoomDomain();
    }
  }
}
