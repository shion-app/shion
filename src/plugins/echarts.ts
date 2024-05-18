import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, HeatmapChart, LineChart, PieChart } from 'echarts/charts'
import {
  CalendarComponent,
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  HeatmapChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  GraphicComponent,
  DataZoomComponent,
  VisualMapComponent,
  CalendarComponent,
])
