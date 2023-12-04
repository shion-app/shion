/// <reference types="vite/client" />

import VChart from 'vue-echarts'

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    VChart: typeof VChart,
  }
}
