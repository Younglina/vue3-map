<template>
  <div class="amap-wrap" id="amap-wrap">
    <div id="map-container" class="map"></div>
    <div v-if="showCenterMarker" class="center-marker">
      <div class="text" @click="goToSearch">{{ currentAddress.name }}</div>
      <div class="line"></div>
      <div class="marker">
        <div class="marker-triangle"></div>
        <div class="marker-point"></div>
      </div>
    </div>
    <div
      v-if="showLocationIcon"
      class="location-icon"
      @click="getCurrentLocation"
    >
      <img src="@/assets/location.png" mode="widthFix" />
    </div>
  </div>
</template>

<script setup>
import AMapLoader from "@amap/amap-jsapi-loader";
import axios from "axios";
import EndIcon from "@/assets/endIcon.png";
import StratIcon from "@/assets/startIcon.png";
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

const props = defineProps({
  center: {
    type: Object,
    default: () => ({
      longitude: 116.397428,
      latitude: 39.90923,
    }),
  },
  zoom: {
    type: Number,
    default: 13,
  },
  showCenterMarker: {
    type: Boolean,
    default: true,
  },
  showLocationIcon: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  "loaded",
  "location-selected",
  "route-planned",
  "center-changed",
  "location-info",
]);

let AMap = null;
let map = null;
const currentAddress = ref({});
const currentLocation = ref(null);
const startPoint = ref(null);
const endPoint = ref(null);

window._AMapSecurityConfig = {
  securityJsCode: "9537a21ee34efb281c3fe92b4f1055bf",
};
// 初始化地图
const initMap = async ({ longitude, latitude }) => {
  // axios("/api/signature?url=" + encodeURIComponent(window.location.href))
  //   .then((response) => response.json())
  //   .then((data) => {
  // const data = {
  //   appId: "wx78eaa63b82d9edf1",
  //   nonceStr: "nCCb7U7xB6pD6jI8",
  //   timestamp: 1734667874,
  //   signature: "a314dd844f175c1af63464c2d45d5d5631c17f2f",
  //   url: "http://localhost:5173/#/home?token=MTUxNzk4MTY4ODN8emgwMDAwMnwyMDI0LTEyLTE4IDE0OjE0OjMx&longitude=120.21201&latitude=30.2084",
  // };
  // console.log(data);
  // wx.config({
  //   debug: false,
  //   appId: data.appId,
  //   timestamp: data.timestamp,
  //   nonceStr: data.nonceStr,
  //   signature: data.signature,
  //   jsApiList: ["getLocation"], // 根据需要配置所需接口
  // });
  // });
  AMapLoader.load({
    key: "0f20018974e4ab2189ad2d9f8b0a5702",
    version: "2.0",
    plugins: ["AMap.Driving"],
  })
    .then((Map) => {
      AMap = Map;
      map = new Map.Map("map-container", {
        zoom: 17, // 初始化地图级别
        center: [longitude, latitude], // 初始化地图中心点位置
      });
      // 监听地图移动结束事件
      map.on("dragstart", () => {
        currentAddress.value = { name: "正在定位." };
      });
      map.on("dragend", handleMapDragEnd);
      emit("loaded", { AMap, map });
      getPOIByLocation([longitude, latitude]);
    })
    .catch((e) => {
      console.log(e);
    });
};

const getCurrentLocation = () => {
  wx.checkJsApi({
    jsApiList: ["getLocation"], // 需要检测的JS接口列表，所有JS接口列表见附录2,
    success: function (res) {
      console.log(res);
    },
    fail: (err) => {
      console.log(err);
    },
  });
  wx.getLocation({
    success: (res) => {
      console.log(res);
    },
    fail: (err) => {
      console.log(err);
    },
  });
  // AMap.plugin("AMap.Geolocation", function () {
  //   const geolocation = new AMap.Geolocation({
  //     enableHighAccuracy: true, // 是否使用高精度定位，默认：true
  //     timeout: 10000, // 设置定位超时时间，默认：无穷大
  //     offset: [10, 20], // 定位按钮的停靠位置的偏移量
  //     zoomToAccuracy: true, //  定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
  //     position: "RB", //  定位按钮的排放位置,  RB表示右下
  //   });

  //   geolocation.getCurrentPosition(function (status, result) {
  //     if (status == "complete") {
  //       console.log("定位成功", result);
  //       map.setCenter([result.position.lng, result.position.lat]);
  //       getPOIByLocation([result.position.lng, result.position.lat]);
  //     } else {
  //       console.log("定位失败", result);
  //     }
  //   });
  // });
};

// 处理地图移动结束事件
const handleMapDragEnd = () => {
  setTimeout(() => {
    const center = map.getCenter();
    currentLocation.value = {
      lng: center.lng,
      lat: center.lat,
    };
    getPOIByLocation([center.lng, center.lat]);
  }, 300);
};

// 获取POI信息
const getPOIByLocation = async (location) => {
  // 创建地理编码插件
  AMap.plugin("AMap.Geocoder", () => {
    const geocoder = new AMap.Geocoder({
      radius: 1000,
      extensions: "all",
    });

    // if (!route.query.name && !route.query.address) {
      geocoder.getAddress(location, (status, result) => {
        if (status === "complete" && result.info === "OK") {
          console.log({ result });
          const address = result.regeocode;
          currentAddress.value = address.pois[0];
          const [longitude, latitude] = [
            address.pois[0].location.lng,
            address.pois[0].location.lat,
          ];
          emit("location-info", {
            address: address.pois[0].address,
            name: address.pois[0].name,
            point: address.pois[0],
            longitude,
            latitude,
            cityInfo: {
              name: address.addressComponent.city,
              code: address.addressComponent.citycode,
            },
          });
          localStorage.setItem("CURRENT_CITY", address.addressComponent.city);
        }
      });
    // } else {
    //   const data = route.query;
    //   currentAddress.value = {
    //     name: data.name,
    //   };
    //   emit("location-info", {
    //     ...data,
    //     cityInfo: {
    //       name: data.city,
    //     },
    //   });
    // }
  });
};

// 跳转到搜索页面
const goToSearch = () => {
  // const center = AMap.getCenter();
  // router.push({
  //   path: "/search",
  //   query: {
  //     lat: center.lat,
  //     lng: center.lng,
  //     address: currentAddress.value,
  //   },
  // });
};

const route = useRoute();
onMounted(() => {
  initMap(route.query.latitude ? route.query : props.center);
});
</script>

<style scoped lang="scss">
#amap-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 13.93rem; /* 195/14 ≈ 13.93 */
  :deep(.amap-logo),
  :deep(.amap-copyright) {
    display: none !important;
    opacity: 0 !important;
  }
}
.map {
  width: 100%;
  height: 100%;
  min-height: 13.93rem;
}

.center-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.center-marker .text {
  background-color: #3475f5;
  color: #ffffff;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 12px;
  height: 36px;
  min-width: 36px;
  max-width: 200px;
  background: #3475f5;
  border-radius: 50px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.center-marker .line {
  height: 24px;
  width: 2px;
  background-color: #3475f5;
}
.center-marker .marker {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.marker-triangle {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 12px solid #3475f5;
  filter: drop-shadow(0 3px 6px #3475f5);
  margin-bottom: -3px;
  z-index: 1;
}

.marker-point {
  width: 1.7rem;
  height: 1.7rem;
  background: #3475f5;
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 5px rgba(52, 117, 245, 0.5);
  z-index: 2;
}

.address-info {
  position: absolute;
  bottom: 30px;
  left: 20px;
  right: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.address-text {
  font-size: 14px;
  margin-bottom: 10px;
}

.address-actions {
  display: flex;
  gap: 10px;
}

.address-actions button {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  background: #1890ff;
  color: white;
  cursor: pointer;
}

.address-actions button:hover {
  background: #40a9ff;
}
.location-icon {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  padding: 8px;
  border-radius: 6px;
  z-index: 1;
  img {
    width: 16px;
    height: 16px;
  }
}
</style>
