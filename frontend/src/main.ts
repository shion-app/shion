import "uno.css";
import "@unocss/reset/tailwind.css";
import "vuetify/styles";

import { createRouter, createWebHashHistory } from "vue-router";
import { createVuetify } from "vuetify";

import routes from "~pages";
import App from "./App.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

const vuetify = createVuetify();

createApp(App).use(router).use(vuetify).mount("#app");
