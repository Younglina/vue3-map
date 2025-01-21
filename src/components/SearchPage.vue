<script setup>
import AMapLoader from "@amap/amap-jsapi-loader";
import Empty from "./Empty.vue";
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import request from "../utils/request";
import { showToast } from "vant";
import towgs84 from "@/utils/towgs84";

const currentCity = ref("");
const currentAreaType = ref("");
const route = useRoute();

const historySearchList = ref([]);
let AMap = null;
window._AMapSecurityConfig = {
  securityJsCode: "9537a21ee34efb281c3fe92b4f1055bf",
};
const inputValue = ref("");
onMounted(() => {
  AMapLoader.load({
    key: "0f20018974e4ab2189ad2d9f8b0a5702",
    version: "2.0",
  }).then((Map) => {
    AMap = Map;
    // getPOIByLocation([route.query.longitude, route.query.latitude]);
  });
  currentCity.value =
    route.query.city && route.query.city !== "undefined"
      ? route.query.city
      : localStorage.getItem("CURRENT_CITY");
  const selectHistory = JSON.parse(
    localStorage.getItem("ZSX_SELECT_HISTORY") || "[]"
  );
  inputValue.value =
    route.query.searchName && route.query.searchName !== "undefined"
      ? route.query.searchName
      : "";
  historySearchList.value = selectHistory;
  const t = {
    from: "请输入起点",
    to: "请输入终点",
  };
  currentAreaType.value = t[route.query.type] || "请输入";
});

const searchPOIList = ref([]);
const getPOIByKeyword = (keyword) => {
  AMap.plugin("AMap.PlaceSearch", () => {
    const placeSearch = new AMap.PlaceSearch({
      city: currentCity.value,
    });
    placeSearch.search(keyword, (status, result) => {
      if (status === "complete" && result.info === "OK") {
        let p1;
        if (
          route.query.longitude &&
          route.query.latitude &&
          route.query.longitude !== "undefined" &&
          route.query.latitude !== "undefined"
        ) {
          p1 = [route.query.longitude, route.query.latitude];
        }
        searchPOIList.value = result.poiList.pois.slice(0, 12).map((item) => {
          if (p1) {
            item.distance = AMap.GeometryUtil.distance(p1, [
              item.location.lng,
              item.location.lat,
            ]);
            item.unit = item.distance > 1000 ? "km" : "m";
            item.distance =
              item.distance > 1000
                ? (item.distance / 1000).toFixed(1)
                : (+item.distance).toFixed(1);
          }
          item.location = `${item.location.lng},${item.location.lat}`;
          return item;
        });
      }
    });
  });
};
const handleInput = (v) => {
  let timer = null;
  return function (v) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      getPOIByKeyword(v);
    }, 500);
  };
};
watch(inputValue, handleInput(inputValue));

const pois = ref([]);
const router = useRouter();
const handleSelectPOI = (item) => {
  console.log(item, route.query);
  let longitude, latitude;
  if (item.location) {
    [longitude, latitude] = item.location.split(",");
  }
  if (route.query.type === "from") {
    router.push({
      path: `/home/${new Date().getTime()}`,
      query: {
        longitude,
        latitude,
        city: currentCity.value,
        address: item.address,
        name: item.name,
        type: "from",
      },
    });
  } else if (route.query.type === "to") {
    wx.miniProgram.navigateTo({
      url: `/pages/trajectory/index?flng=${route.query.longitude}&flat=${
        route.query.latitude
      }&fname=${encodeURIComponent(
        route.query.name
      )}&faddress=${encodeURIComponent(
        route.query.address
      )}&tlng=${longitude}&tlat=${latitude}&tname=${encodeURIComponent(
        item.name
      )}&taddress=${encodeURIComponent(item.address)}`,
    });
  } else if (route.query.type === "addPoint") {
    wx.miniProgram.redirectTo({
      url: `/pages/trajectory/addPoint?name=${encodeURIComponent(
        item.name
      )}&address=${encodeURIComponent(item.address)}&location=${
        item.location
      }&idx=${route.query.idx}`,
    });
  } else if (["home", "company", "custom"].includes(route.query.type)) {
    let url = "/app/hailing/passenger/address/add";
    const areaData = {
      addressName: item.name,
      placeName: item.name,
      address: item.address,
      lngtitude: longitude,
      latitude,
      placeType:
        route.query.type === "home"
          ? 1
          : route.query.type === "company"
          ? 2
          : 3,
    };
    if (route.query.addressId && route.query.addressId !== "undefined") {
      areaData.addressId = route.query.addressId;
      url = "/app/hailing/passenger/address/update";
    }
    request({
      url,
      method: "POST",
      headers: {
        Authorization: route.query.token,
      },
      data: areaData,
    }).then((res) => {
      wx.miniProgram.navigateBack();
    });
  } else if (route.query.type === "changeEndAddress") {
    const [changeLatitude, changeLngtitude] = towgs84.transformWGS2GCJ(
      latitude,
      longitude
    );
    request({
      url: "/app/hailing/order/address/update",
      method: "POST",
      headers: {
        Authorization: localStorage.getItem("ZSX_WX_TOKEN"),
      },
      data: {
        orderNo: route.query.orderNo,
        address: item.name,
        endAddressFull: item.address,
        latitude: changeLngtitude,
        longitude: changeLatitude,
      },
    }).then((res) => {
      showToast("修改成功");
      wx.miniProgram.redirectTo({
        url: `/pages/order/detail/${new Date().getTime()}?type=changeEndAddress&orderNo=${
          route.query.orderNo
        }&logId=${route.query.logId}`,
      });
    });
  }
  const selectHistory = JSON.parse(
    localStorage.getItem("ZSX_SELECT_HISTORY") || "[]"
  );
  if (!selectHistory.some((h) => h.id === item.id)) {
    selectHistory.push(item);
  }
  localStorage.setItem("ZSX_SELECT_HISTORY", JSON.stringify(selectHistory));
};
</script>
<template>
  <div class="search-page">
    <div class="search-wrap">
      <div class="search">
        <div class="search-input">
          <div class="current-city">{{ currentCity }}</div>
          <div class="triangle"></div>
          <input
            v-model="inputValue"
            class="input-wrap"
            :placeholder="currentAreaType"
            type="text"
          />
        </div>
        <span class="btn">取消</span>
      </div>
      <!-- <div class="address-actions">
        <div class="item">
          <img src="@/assets/home.png" />
          <div class="address-info">
            <span class="title">设置家庭住址</span>
            <span class="address">家庭住址占位</span>
          </div>
        </div>
        <div class="item">
          <img src="@/assets/company.png" />
          <div class="address-info">
            <span class="title">设置公司</span>
            <span class="address">公司占位</span>
          </div>
        </div>
        <div class="item">
          <img class="location-icon" src="@/assets/locationColorIcon.png" />
          <div class="address-info">
            <span class="title">地图选点</span>
          </div>
        </div>
      </div> -->
    </div>
    <div v-if="searchPOIList.length" class="around-wrap">
      <div
        v-for="item in searchPOIList"
        :key="item.id"
        class="poi-item"
        @click="handleSelectPOI(item)"
      >
        <img src="@/assets/locationIcon.png" alt="" />
        <div class="poi-info">
          <div class="poi-name">{{ item.name }}</div>
          <div class="poi-address">
            <span v-if="item.distance"
              >{{ item.distance }}{{ item.unit }} |
            </span>
            {{ item.address }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="!inputValue && historySearchList.length" class="around-wrap">
      <div class="title">历史记录</div>
      <div
        v-for="item in historySearchList"
        :key="item.id"
        class="poi-item"
        @click="handleSelectPOI(item)"
      >
        <img class="clock-icon" src="@/assets/clock.png" alt="" />
        <div class="poi-info">
          <div class="poi-name">{{ item.name }}</div>
          <div class="poi-address">
            {{ item.address }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="!inputValue && pois.length" class="around-wrap">
      <div class="title">推荐地点</div>
      <div
        v-for="item in pois"
        :key="item.id"
        class="poi-item"
        @click="handleSelectPOI(item)"
      >
        <img src="@/assets/locationIcon.png" alt="" />
        <div class="poi-info">
          <div class="poi-name">{{ item.name }}</div>
          <div class="poi-address">
            {{ item.distance }}{{ item.unit }} | {{ item.address }}
          </div>
        </div>
      </div>
    </div>

    <Empty
      v-if="!searchPOIList.length && !pois.length && !historySearchList.length"
    ></Empty>
  </div>
</template>
<style scoped lang="scss">
.search-page {
  min-height: 100vh;
  overflow-y: auto;
  background: #f5f7fb;
}
.search-wrap {
  padding: 12px;
  background: #ffffff;
  border-radius: 0px 0px 20px 20px;
}
.search {
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .btn {
    font-weight: 700;
    color: #858b9c;
    min-width: 40px;
    text-align: center;
  }
  .search-input {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 8px;
    background: #f5f7fb;
    border-radius: 10px;
    border: 1px solid #3475f5;
    &::before {
      content: "";
      background-color: #f49629;
      border-radius: 50%;
      margin-right: 6px;
      width: 10px;
      max-width: 10px;
      height: 10px;
      max-height: 10px;
    }
    .current-city {
      font-weight: 700;
      color: #41485d;
      font-size: 14px;
      padding: 0 4px;
      white-space: nowrap;
    }
    .input-wrap {
      font-weight: 700;
      color: #3475f5;
      font-size: 16px;
      padding: 0 4px;
      border: none;
      background: transparent;
      min-height: 50px;
      outline: none;
      flex: 1;
      width: 100%;
      &::placeholder {
        font-weight: 700;
        color: #3475f5;
        font-size: 16px;
      }
    }
    .triangle {
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 8px solid #41485d;
      margin: 0 4px;
    }
  }
}
.address-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 14px;
  > div {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
  }
  .item + .item {
    border-left: 1px solid #f5f7fb;
  }
  img {
    width: 12px;
    height: 12px;
    margin-right: 8px;
  }
  .location-icon {
    width: 12px;
    height: 15px;
  }
  .address-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    .title {
      color: #41485d;
      font-size: 14px;
    }
    .address {
      color: #858b9c;
      font-size: 12px;
    }
  }
}

.around-wrap {
  background: #ffffff;
  border-radius: 20px;
  margin: 14px 10px 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
  overflow: hidden;
  .title {
    background-color: #f5f7fb;
    padding: 12px;
    font-weight: 700;
  }
  .poi-item {
    padding: 12px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #f5f7fb;
    img {
      width: 12px;
      height: 16px;
      margin-right: 10px;
    }
    .clock-icon {
      width: 16px;
    }
    .poi-name {
      font-weight: 700;
      color: #41485d;
      font-size: 14px;
    }
    .poi-address {
      color: #858b9c;
      font-size: 12px;
    }
  }
}
</style>
