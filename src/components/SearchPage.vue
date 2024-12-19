<script setup>
import AMapLoader from "@amap/amap-jsapi-loader";
import Empty from "./Empty.vue";
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const currentCity = ref("");
const route = useRoute();

let AMap = null;
window._AMapSecurityConfig = {
  securityJsCode: "9537a21ee34efb281c3fe92b4f1055bf",
};
onMounted(() => {
  AMapLoader.load({
    key: "0f20018974e4ab2189ad2d9f8b0a5702",
    version: "2.0",
  }).then((Map) => {
    AMap = Map;
    currentCity.value = route.query.city;
    getPOIByLocation([route.query.longitude, route.query.latitude]);
  });
});

const inputValue = ref("");
const searchPOIList = ref([]);
const getPOIByKeyword = (keyword) => {
  AMap.plugin("AMap.PlaceSearch", () => {
    const placeSearch = new AMap.PlaceSearch({
      city: currentCity.value,
    });
    placeSearch.search(keyword, (status, result) => {
      if (status === "complete" && result.info === "OK") {
        const p1 = [route.query.longitude, route.query.latitude];
        searchPOIList.value = result.poiList.pois.slice(0, 12).map((item) => {
          item.distance = AMap.GeometryUtil.distance(p1, [
            item.location.lng,
            item.location.lat,
          ]);
          item.location = `${item.location.lng},${item.location.lat}`;
          item.unit = item.distance > 1000 ? "km" : "m";
          item.distance =
            item.distance > 1000
              ? (item.distance / 1000).toFixed(1)
              : (+item.distance).toFixed(1);
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

const historySearchList = ref([]);
const pois = ref([]);
// 获取POI信息
const getPOIByLocation = async (location) => {
  // 创建地理编码插件
  // AMap.plugin("AMap.Geocoder", () => {
  //   const geocoder = new AMap.Geocoder({
  //     radius: 1000,
  //     extensions: "all",
  //   });

  //   geocoder.getAddress(location, (status, result) => {
  const status = "complete";
  const result = {
    status: "1",
    regeocode: {
      roads: [
        {
          id: "0571H51F0220022711",
          location: "120.222,30.2201",
          direction: "西北",
          name: "滨盛路",
          distance: "113.306",
        },
        {
          id: "0571H51F022002673590",
          location: "120.219,30.2196",
          direction: "东北",
          name: "建设河绿道",
          distance: "226.262",
        },
        {
          id: "0571H51F0220023053",
          location: "120.219,30.2191",
          direction: "东北",
          name: "西兴路",
          distance: "279.342",
        },
      ],
      roadinters: [
        {
          second_name: "建设河绿道",
          first_id: "0571H51F022002615911",
          second_id: "0571H51F022002673590",
          location: "120.217992,30.220459",
          distance: "307.546",
          first_name: "一号支路",
          direction: "东",
        },
      ],
      formatted_address: "浙江省杭州市滨江区西兴街道滨盛路",
      addressComponent: {
        city: "杭州市",
        province: "浙江省",
        adcode: "330108",
        district: "滨江区",
        towncode: "330108001000",
        streetNumber: {
          number: "126号",
          location: "120.222390,30.221221",
          direction: "东",
          distance: "125.268",
          street: "滨盛路",
        },
        country: "中国",
        township: "西兴街道",
        businessAreas: [
          {
            location: "120.221721,30.194076",
            name: "西兴",
            id: "330108",
          },
        ],
        building: {
          name: [],
          type: [],
        },
        neighborhood: {
          name: [],
          type: [],
        },
        citycode: "0571",
      },
      aois: [],
      pois: [
        {
          id: "B0J2FS1NZQ",
          direction: "西",
          businessarea: "西兴",
          address: "奥体街520号",
          poiweight: "0.306968",
          name: "杭州高级中学附属滨江中学",
          location: "120.218991,30.221297",
          distance: "214.479",
          tel: [],
          type: "科教文化服务;学校;中学",
        },
        {
          id: "B0FFF4AVAW",
          direction: "东南",
          businessarea: "西兴",
          address: "滨盛路附近",
          poiweight: "0.302125",
          name: "缤纷北苑",
          location: "120.222636,30.218547",
          distance: "292.216",
          tel: "0571-87165705",
          type: "商务住宅;住宅区;住宅小区",
        },
        {
          id: "B023B19OJH",
          direction: "东南",
          businessarea: "西兴",
          address: "缤纷北苑30号",
          poiweight: "0.183438",
          name: "杭州市滨江区缤纷幼儿园",
          location: "120.222917,30.219208",
          distance: "248.191",
          tel: "0571-85158139",
          type: "科教文化服务;学校;幼儿园",
        },
        {
          id: "B0H0LMEQBZ",
          direction: "东北",
          businessarea: "西兴",
          address: "奥体路333号",
          poiweight: "0.16605",
          name: "杭州交通资产管理有限公司",
          location: "120.223037,30.222827",
          distance: "284.71",
          tel: [],
          type: "政府机构及社会团体;交通车辆管理;交通管理机构",
        },
        {
          id: "B0FFJQ9T6K",
          direction: "东北",
          businessarea: "西兴",
          address: "奥体街333号",
          poiweight: "0.140821",
          name: "杭州交通资产综合楼",
          location: "120.223329,30.222557",
          distance: "282.181",
          tel: [],
          type: "商务住宅;楼宇;商务写字楼",
        },
        {
          id: "B0FFGAR5VX",
          direction: "东",
          businessarea: "西兴",
          address: "丹枫路86号",
          poiweight: "0.204238",
          name: "印月尚庭",
          location: "120.224984,30.220380",
          distance: "370.942",
          tel: [],
          type: "商务住宅;住宅区;住宅小区",
        },
        {
          id: "B0FFF5W73J",
          direction: "东南",
          businessarea: "西兴",
          address: "缤纷北苑",
          poiweight: "0.302125",
          name: "缤纷北苑(西北1门)",
          location: "120.222231,30.219765",
          distance: "158.094",
          tel: [],
          type: "通行设施;临街院门;临街院门",
        },
        {
          id: "B0JA7UXJZM",
          direction: "西南",
          businessarea: "西兴",
          address: "滨盛路972号",
          poiweight: "0.156173",
          name: "高新硅谷亚运保障基地",
          location: "120.219915,30.219893",
          distance: "159.819",
          tel: [],
          type: "公司企业;公司企业;公司企业",
        },
        {
          id: "B023B18D1K",
          direction: "东南",
          businessarea: "西兴",
          address: "缤纷北苑",
          poiweight: "0.310636",
          name: "缤纷北苑1幢",
          location: "120.221950,30.219397",
          distance: "177.974",
          tel: [],
          type: "地名地址信息;门牌信息;楼栋号",
        },
        {
          id: "B0FFIDOFDC",
          direction: "东",
          businessarea: "西兴",
          address: "丹枫路86号印月尚庭",
          poiweight: "0.230713",
          name: "印月尚庭(西北门)",
          location: "120.223401,30.220748",
          distance: "215.505",
          tel: [],
          type: "通行设施;临街院门;临街院门",
        },
        {
          id: "B023B18PMB",
          direction: "南",
          businessarea: "西兴",
          address: "滨盛路附近",
          poiweight: "0.076903",
          name: "缤纷北苑2幢",
          location: "120.221688,30.219090",
          distance: "201.617",
          tel: [],
          type: "地名地址信息;门牌信息;楼栋号",
        },
        {
          id: "B0IDA90UI9",
          direction: "东",
          businessarea: "西兴",
          address: "丹枫路86号",
          poiweight: "0.11304",
          name: "滨江区西兴街道水电社区退役军人服务站",
          location: "120.224570,30.219964",
          distance: "341.892",
          tel: "0571-87700087",
          type: "政府机构及社会团体;政府机关;乡镇以下级政府及事业单位",
        },
      ],
    },
    info: "OK",
    infocode: "10000",
  };
  if (status === "complete" && result.info === "OK") {
    console.log(result.regeocode.pois);
    pois.value = result.regeocode.pois.slice(0, 12).map((item) => {
      item.unit = item.distance > 1000 ? "km" : "m";
      item.distance =
        item.distance > 1000
          ? (item.distance / 1000).toFixed(1)
          : (+item.distance).toFixed(1);
      return item;
    });
  }
  // });
  // });
};

const router = useRouter();
const handleSelectPOI = (item) => {
  console.log(item, route.query);
  const [longitude, latitude] = item.location.split(",");
  if (route.query.type === "from") {
    router.push({
      path: "/home",
      query: {
        longitude,
        latitude,
        city: currentCity.value,
        address: item.address,
        name: item.name,
        type: "from",
      },
    });
  }
  if (route.query.type === "to") {
    wx.miniProgram.navigateTo({
      url: `/pages/trajectory/index?flng=${route.query.longitude}&flat=${route.query.latitude}&fname=${route.query.name}&faddress=${route.query.address}&tlng=${longitude}&tlat=${latitude}&tname=${item.name}&taddress=${item.address}`,
    });
  }
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
            placeholder="你要去哪儿"
            type="text"
          />
        </div>
        <span class="btn">取消</span>
      </div>
      <div class="address-actions">
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
      </div>
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
            {{ item.distance }}{{ item.unit }} | {{ item.address }}
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
        <img src="@/assets/clock.png" alt="" />
        <div class="poi-info">
          <div class="poi-name">{{ item.name }}</div>
          <div class="poi-address">
            {{ item.distance }}{{ item.unit }} | {{ item.address }}
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
  background: #f5f7fb;
}
.search-wrap {
  padding: 16px;
  background: #ffffff;
  border-radius: 0px 0px 20px 20px;
}
.search {
  min-height: 3.57rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .btn {
    font-weight: 700;
    color: #858b9c;
    font-size: 14px;
  }
  .search-input {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 10px;
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
    }
    .input-wrap {
      font-weight: 700;
      color: #3475f5;
      font-size: 16px;
      padding: 0 4px;
      border: none;
      background: transparent;
      min-height: 3.57rem;
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
