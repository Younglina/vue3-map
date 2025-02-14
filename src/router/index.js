import { createRouter, createWebHashHistory } from "vue-router";
import MapChoose from "../views/mapChoose.vue";
import Home from "../views/home.vue";
import SearchPage from "../components/SearchPage.vue";
import Transfer from "../views/transfer.vue";
import Trajectory from "../views/trajectory.vue";
import OrderDetail from "../views/orderDetail.vue";

const routes = [
  {
    path: "/home/:id",
    name: "Home",
    component: Home,
    meta: {
      title: "首页",
    },
  },
  {
    path: "/mapChoose",
    name: "MapChoose",
    component: MapChoose,
    meta: {
      title: "地图选点",
    },
  },
  {
    path: "/search",
    name: "Search",
    component: SearchPage,
    meta: {
      title: "地址搜索",
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
  {
    path: "/transfer",
    name: "Transfer",
    component: Transfer,
    meta: {
      title: "加载中",
    },
  },
  {
    path: "/orderDetail/:id",
    name: "OrderDetail",
    component: OrderDetail,
    meta: {
      title: "订单详情",
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    if (to.query.type === "to") {
      document.title = "下车地点选择";
    } else if (to.query.type === "from") {
      document.title = "上车地点选择";
    } else {
      document.title = to.meta.title;
    }
  }
  next();
});
export default router;
