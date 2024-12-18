import { createRouter, createWebHistory } from "vue-router";
import AMap from "../components/AMap.vue";
import Home from "../views/home.vue";
import SearchPage from "../components/SearchPage.vue";

const routes = [
  {
    path: "/home",
    name: "Home",
    component: Home,
  },
  {
    path: "/search",
    name: "Search",
    component: SearchPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
