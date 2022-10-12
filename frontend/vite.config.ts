import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Unocss from "unocss/vite";
import { presetAttributify, presetUno } from "unocss";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      reactivityTransform: true,
    }),
    AutoImport({
      imports: [
        "vue",
      ],
      vueTemplate: true,
      dts: "src/auto-imports.d.ts",
    }),
    Unocss({
      presets: [presetUno(), presetAttributify()],
      shortcuts: {
        btn: "w-20 h-20 rounded-full",
      },
    }),
  ],
});
