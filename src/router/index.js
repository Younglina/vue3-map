import { createRouter, createWebHashHistory } from "vue-router";
import AMap from "../components/AMap.vue";
import Home from "../views/home.vue";
import SearchPage from "../components/SearchPage.vue";
import Trajectory from "../views/trajectory.vue";

const routes = [
  {
    path: "/home",
    name: "Home",
    component: Home,
    meta: {
      title: "掌上行",
    },
  },
  {
    path: "/search",
    name: "Search",
    component: SearchPage,
    meta: {
      title: "掌上行",
    },
  },
  {
    path: "/trajectory/:id",
    name: "Trajectory",
    component: Trajectory,
    meta: {
      title: "车型选择",
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  next();
});
export default router;
