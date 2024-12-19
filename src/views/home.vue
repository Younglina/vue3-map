<script setup>
import AMap from "../components/AMap.vue";
import request from "@/utils/request";
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";

const currentCity = ref("");
const currentType = ref("firm");
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
};

const handleNavigator = (type) => {
  if (type === "from" || type === "to") {
    wx.miniProgram.navigateTo({
      url: `/pages/commonChooseArea/index?type=${type}&city=${currentCity.value}&longitude=${mapData.longitude}&latitude=${mapData.latitude}&name=${mapData.currentAreaName}&address=${mapData.address}`,
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

const route = useRoute();
onMounted(() => {
  currentCity.value = localStorage.getItem("CURRENT_CITY") || "";
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
      <div class="car-type">
        <div>
          <div
            :class="currentType === 'firm' ? 'car-wrap current' : 'car-wrap'"
            @click="currentType = 'firm'"
          >
            <img src="@/assets/firm.png" alt="" />
          </div>
          <div>企业用车</div>
        </div>
        <div>
          <div
            :class="currentType === 'person' ? 'car-wrap current' : 'car-wrap'"
            @click="currentType = 'person'"
          >
            <img src="@/assets/person.png" alt="" />
          </div>
          <div>个人用车</div>
        </div>
      </div>
      <a-map
        class="map-dom"
        @loaded="mapLoaded"
        @location-info="handleLocationInfo"
      ></a-map>
      <div class="current-city">{{ currentCity }}</div>
    </div>
    <div class="area-wrap">
      <div class="ticket-wrap">
        <img src="@/assets/ticket.png" alt="" />
        <span>新用户送福利券</span>
        <div class="btn">查看</div>
      </div>
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
      <img src="@/assets/banner1.png" class="banner" alt="" />
      <img src="@/assets/banner2.png" class="banner" alt="" />
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
  padding: 0 12px;
  position: relative;
  background: linear-gradient(180deg, #1168e2 0%, #92c0ff 50.2%, #f4f5f7 100%);
}

.current-city {
  position: absolute;
  top: 10px;
  left: 12px;
  color: #ffffff;
  font-size: 14px;
}

.car-type {
  display: flex;
  justify-content: space-around;
  color: #ffffff;
  padding: 42px 16px 16px;
  > div {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .car-wrap {
    width: 48px;
    height: 48px;
    background: #ffffff;
    border-radius: 50px;
    padding: 14px 12px;
    opacity: 0.3;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 4px;
    img {
      width: 100%;
      height: 100%;
    }
  }
  .current {
    opacity: 1;
  }
}

.map-dom {
  border-radius: 20px 20px 0px 0px;
  overflow: hidden;
}

.ticket-wrap {
  padding-bottom: 12px;
  color: #ff7d1a;
  display: flex;
  align-items: center;
  img {
    width: 16px;
    height: 16px;
    margin-right: 4px;
  }
  span {
    font-weight: 700;
    font-size: 12px;
  }
  .btn {
    border: 1px solid #ff7d1a;
    border-radius: 50px;
    margin-left: auto;
    padding: 4px 14px;
    font-weight: 900;
    font-size: 12px;
  }
}

.area-wrap {
  height: 15rem;
  background: linear-gradient(180deg, #ffe9dc 0%, #fef4ef 14.64%, #f5f7fb 100%);
  border-radius: 20px;
  padding: 12px;
  .banner {
    width: 100%;
    margin-top: 8px;
  }
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
    border-radius: 10px;
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
