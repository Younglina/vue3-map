<template>
  <router-view></router-view>
</template>

<style lang="scss">
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

.bottom-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  padding: 10px;
  box-sizing: border-box;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 56px;
  background-color: #ffffff;
  box-shadow: 5px -5px 10px #e8e8e8, -5px 5px 10px #ffffff;

  & > div {
    display: flex;
    position: relative;
    flex: 1;
    align-items: center;
    justify-content: center;
    height: 100%;
    background-color: #003f93;
    border-radius: 10px;
    color: #ffffff;
    margin: 0 10px;
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
