import { createApp } from "vue";
import App from "./App.vue";

createApp(App)
  .use((app) => {
    app.provide("Another", { name: "sfsfsf" });
  })
  .mount("#app");
