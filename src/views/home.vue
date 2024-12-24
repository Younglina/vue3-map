<script setup>
import AMap from "../components/AMap.vue";
import request from "@/utils/request";
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";

const currentCity = ref("");
const mapData = reactive({
  currentAreaName: "",
  address: "",
  longitude: "",
  latitude: "",
  markerData: [],
});

let map = null;
const mapLoaded = (m) => {
  map = m;
  if (route.query.longitude && route.query.latitude) {
    map.setCenter([route.query.longitude, route.query.latitude]);
    setArea(route.query);
  }
};

const handleLocationInfo = (info) => {
  currentCity.value =
    localStorage.getItem("CURRENT_CITY") || info.cityInfo.name;
  localStorage.setItem("CURRENT_CITY", info.cityInfo.name);
  mapData.currentAreaName = info.name;
  if (info.longitude && info.latitude) {
    [mapData.longitude, mapData.latitude] = [info.longitude, info.latitude];
  }
  mapData.markerData[0] = {
    name: info.name,
    longitude: info.longitude,
    latitude: info.latitude,
    address: info.address,
  };
  getNearByCar();
};

function getNearByCar() {
  request({
    url: "/app/common/driver/v2/nearby",
    method: "POST",
    headers: {
      Authorization: route.query.token,
    },
    data: {
      businessType: "11",
      startLatitude: mapData.latitude,
      startLongitude: mapData.longitude,
    },
  }).then((res) => {
    console.log(res);
  });
}

const handleNavigator = (type) => {
  if (type === "from" || type === "to") {
    wx.miniProgram.navigateTo({
      url: `/pages/commonChooseArea/index?type=${type}&city=${
        currentCity.value
      }&longitude=${mapData.longitude}&latitude=${
        mapData.latitude
      }&name=${encodeURIComponent(
        mapData.currentAreaName
      )}&address=${encodeURIComponent(mapData.address)}`,
    });
  }
};

function setArea(data) {
  console.log(data);
  if (data.type === "from") {
    mapData.currentAreaName = data.name;
    mapData.longitude = data.longitude;
    mapData.latitude = data.latitude;
    mapData.address = data.address;
  }
  if (data.type === "home") {
    commonHome.value = data.name;
  }
  if (data.type === "company") {
    commonCompany.value = data.name;
  }
}

const currentCarType = ref("firm");
const setCarType = (type) => {
  currentCarType.value = type;
  window.localStorage.setItem("CAR_TYPE", type);
};

const route = useRoute();
onMounted(() => {
  currentCity.value = localStorage.getItem("CURRENT_CITY") || "";
  window.localStorage.setItem("ZSX_WX_TOKEN", route.query.token);
  // request({
  //   url: "/v1/common/miscellaneous/weather",
  // }).then((res) => {
  //   console.log(res);
  // });
});
</script>
<template>
  <div class="home">
    <div class="map-wrap">
      <a-map
        class="map-dom"
        @loaded="mapLoaded"
        @location-info="handleLocationInfo"
      ></a-map>
      <div class="current-city">{{ currentCity }}</div>
      <div class="car-type">
        <div
          :class="currentCarType === 'firm' ? 'active' : ''"
          @click="setCarType('firm')"
        >
          企业用车
        </div>
        <div
          :class="currentCarType === 'person' ? 'active' : ''"
          @click="setCarType('person')"
        >
          个人用车
        </div>
      </div>
    </div>
    <div class="area-wrap">
      <div class="area-list">
        <div class="from-area" @click="handleNavigator('from')">
          <div>您将在</div>
          <div class="address">{{ mapData.currentAreaName }}</div>
          <div>上车</div>
          <img src="@/assets/right.png" alt="" />
        </div>
        <div class="to-area" @click="handleNavigator('to')">
          <div class="address">你要去哪儿</div>
        </div>
        <div class="address-actions">
          <div>
            <img src="@/assets/home.png" />
            <span>设置家庭住址</span>
          </div>
          <div>
            <img src="@/assets/company.png" />
            <span>设置公司</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.home {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f4f5f7;
}
.map-wrap {
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 1;
}

.current-city {
  position: absolute;
  top: 10px;
  left: 12px;
  color: #ffffff;
  font-size: 14px;
}

.car-type {
  position: absolute;
  bottom: 0;
  left: 0;
  color: #ffffff;
  display: flex;
  div {
    background: #858b9c;
    border-radius: 10px 10px 0 0;
    padding: 6px 14px;
    font-size: 12px;
    text-align: center;
  }
  .active {
    background: #1985fb;
    color: #ffffff;
  }
}
.area-wrap {
  height: 15rem;
  background: linear-gradient(180deg, #ffe9dc 0%, #fef4ef 14.64%, #f5f7fb 100%);
  border-radius: 20px;
  padding: 12px;
}
.from-area,
.to-area {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 8px;
  img {
    height: 32px;
    width: 32px;
  }
  > div {
    padding: 0 4px;
  }
  .address {
    color: #1985fb;
  }
}

.to-area {
  background: #f5f7fb;
  border: 2px solid;
  border-color: #1985fb;
  border-radius: 10px;
  .address {
    font-weight: 700;
    font-size: 16px;
  }
}

.from-area::before,
.to-area::before {
  content: "";
  border-radius: 50%;
  margin-right: 6px;
  width: 12px;
  max-width: 12px;
  height: 12px;
  max-height: 12px;
}

.from-area::before {
  background-color: #1168e2;
}
.to-area::before {
  background-color: #f49629;
}

.area-list {
  height: 11.42rem;
  background: #ffffff;
  border-radius: 10px;
  padding: 0 12px;
}

.address-actions {
  display: flex;
  gap: 10px;
  padding-top: 10px;
  > div {
    padding: 8px 10px;
    background: #f2f5fa;
    border-radius: 8px;
    color: #858b9c;
    font-size: 12px;
  }
  img {
    width: 12px;
    height: 12px;
    margin-right: 4px;
  }
}
</style>
