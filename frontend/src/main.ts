import "uno.css";
import "@unocss/reset/tailwind.css";
import "vuetify/styles";

import { createRouter, createWebHashHistory } from "vue-router";
import { createVuetify } from "vuetify";
import { createI18n } from "vue-i18n";
import messages from "@intlify/vite-plugin-vue-i18n/messages";

import routes from "~pages";
import App from "./App.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

const vuetify = createVuetify();

const i18n = createI18n({
  locale: "zh",
  messages,
});

createApp(App).use(router).use(vuetify).use(i18n).mount("#app");
