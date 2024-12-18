<template>
  <router-view></router-view>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  width: 100%;
  font-size: 14px;
}

#app {
  height: 100%;
}

/* 添加 rem 适配 */
@media screen and (max-width: 750px) {
  html {
    font-size: calc(100vw / 375 * 14);
  }
}
</style>

<script setup>
import AMap from "./components/AMap.vue";
const handleCenterChanged = (center) => {
  console.log("地图中心点变化:", center); // {lng: xxx, lat: xxx}
};

const handleLocationInfo = (info) => {
  console.log("位置信息:", info); // {address: xxx, addressComponent: xxx, pois: [...]}
};
</script>
