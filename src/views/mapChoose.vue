<script setup>
import { reactive } from "vue";
import AMap from "../components/AMap.vue";
import { useRoute } from "vue-router";

const route = useRoute();
const mapData = reactive({});
function handleSure(flag) {
  if (route.query.type === "addPoint") {
    let query = "";
    if (flag) {
      query = `?name=${encodeURIComponent(
        mapData.name
      )}&address=${encodeURIComponent(mapData.address)}&location=${
        mapData.longitude
      },${mapData.latitude}&idx=${route.query.idx}`;
    }
    wx.miniProgram.redirectTo({
      url: `/pages/trajectory/addPoint${query}`,
    });
  }
}

function handleLocationInfo(data) {
  Object.assign(mapData, data);
}
</script>
<template>
  <div class="map-choose-wrap">
    <AMap
      class="map-dom"
      @location-info="handleLocationInfo"
      :showLocationIcon="false"
    />
    <div class="bottom-wrap">
      <div @click="handleSure(false)">取消</div>
      <div @click="handleSure(true)">确定</div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.map-choose-wrap {
  width: 100%;
  height: 100%;
}
</style>
