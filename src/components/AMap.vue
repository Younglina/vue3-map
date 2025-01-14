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

    if (!route.query.name && !route.query.address) {
      geocoder.getAddress(location, (status, result) => {
        // const status = "complete";
        // const result = {
        //   status: "1",
        //   regeocode: {
        //     roads: [
        //       {
        //         id: "0571H51F0220022711",
        //         location: "120.222,30.2201",
        //         direction: "西北",
        //         name: "滨盛路",
        //         distance: "113.306",
        //       },
        //       {
        //         id: "0571H51F022002673590",
        //         location: "120.219,30.2196",
        //         direction: "东北",
        //         name: "建设河绿道",
        //         distance: "226.262",
        //       },
        //       {
        //         id: "0571H51F0220023053",
        //         location: "120.219,30.2191",
        //         direction: "东北",
        //         name: "西兴路",
        //         distance: "279.342",
        //       },
        //     ],
        //     roadinters: [
        //       {
        //         second_name: "建设河绿道",
        //         first_id: "0571H51F022002615911",
        //         second_id: "0571H51F022002673590",
        //         location: "120.217992,30.220459",
        //         distance: "307.546",
        //         first_name: "一号支路",
        //         direction: "东",
        //       },
        //     ],
        //     formatted_address: "浙江省杭州市滨江区西兴街道滨盛路",
        //     addressComponent: {
        //       city: "杭州市",
        //       province: "浙江省",
        //       adcode: "330108",
        //       district: "滨江区",
        //       towncode: "330108001000",
        //       streetNumber: {
        //         number: "126号",
        //         location: "120.222390,30.221221",
        //         direction: "东",
        //         distance: "125.268",
        //         street: "滨盛路",
        //       },
        //       country: "中国",
        //       township: "西兴街道",
        //       businessAreas: [
        //         {
        //           location: "120.221721,30.194076",
        //           name: "西兴",
        //           id: "330108",
        //         },
        //       ],
        //       building: {
        //         name: [],
        //         type: [],
        //       },
        //       neighborhood: {
        //         name: [],
        //         type: [],
        //       },
        //       citycode: "0571",
        //     },
        //     aois: [],
        //     pois: [
        //       {
        //         id: "B0J2FS1NZQ",
        //         direction: "西",
        //         businessarea: "西兴",
        //         address: "奥体街520号",
        //         poiweight: "0.306968",
        //         name: "杭州高级中学附属滨江中学",
        //         location: "120.218991,30.221297",
        //         distance: "214.479",
        //         tel: [],
        //         type: "科教文化服务;学校;中学",
        //       },
        //       {
        //         id: "B0FFF4AVAW",
        //         direction: "东南",
        //         businessarea: "西兴",
        //         address: "滨盛路附近",
        //         poiweight: "0.302125",
        //         name: "缤纷北苑",
        //         location: "120.222636,30.218547",
        //         distance: "292.216",
        //         tel: "0571-87165705",
        //         type: "商务住宅;住宅区;住宅小区",
        //       },
        //       {
        //         id: "B023B19OJH",
        //         direction: "东南",
        //         businessarea: "西兴",
        //         address: "缤纷北苑30号",
        //         poiweight: "0.183438",
        //         name: "杭州市滨江区缤纷幼儿园",
        //         location: "120.222917,30.219208",
        //         distance: "248.191",
        //         tel: "0571-85158139",
        //         type: "科教文化服务;学校;幼儿园",
        //       },
        //       {
        //         id: "B0H0LMEQBZ",
        //         direction: "东北",
        //         businessarea: "西兴",
        //         address: "奥体路333号",
        //         poiweight: "0.16605",
        //         name: "杭州交通资产管理有限公司",
        //         location: "120.223037,30.222827",
        //         distance: "284.71",
        //         tel: [],
        //         type: "政府机构及社会团体;交通车辆管理;交通管理机构",
        //       },
        //       {
        //         id: "B0FFJQ9T6K",
        //         direction: "东北",
        //         businessarea: "西兴",
        //         address: "奥体街333号",
        //         poiweight: "0.140821",
        //         name: "杭州交通资产综合楼",
        //         location: "120.223329,30.222557",
        //         distance: "282.181",
        //         tel: [],
        //         type: "商务住宅;楼宇;商务写字楼",
        //       },
        //       {
        //         id: "B0FFGAR5VX",
        //         direction: "东",
        //         businessarea: "西兴",
        //         address: "丹枫路86号",
        //         poiweight: "0.204238",
        //         name: "印月尚庭",
        //         location: "120.224984,30.220380",
        //         distance: "370.942",
        //         tel: [],
        //         type: "商务住宅;住宅区;住宅小区",
        //       },
        //       {
        //         id: "B0FFF5W73J",
        //         direction: "东南",
        //         businessarea: "西兴",
        //         address: "缤纷北苑",
        //         poiweight: "0.302125",
        //         name: "缤纷北苑(西北1门)",
        //         location: "120.222231,30.219765",
        //         distance: "158.094",
        //         tel: [],
        //         type: "通行设施;临街院门;临街院门",
        //       },
        //       {
        //         id: "B0JA7UXJZM",
        //         direction: "西南",
        //         businessarea: "西兴",
        //         address: "滨盛路972号",
        //         poiweight: "0.156173",
        //         name: "高新硅谷亚运保障基地",
        //         location: "120.219915,30.219893",
        //         distance: "159.819",
        //         tel: [],
        //         type: "公司企业;公司企业;公司企业",
        //       },
        //       {
        //         id: "B023B18D1K",
        //         direction: "东南",
        //         businessarea: "西兴",
        //         address: "缤纷北苑",
        //         poiweight: "0.310636",
        //         name: "缤纷北苑1幢",
        //         location: "120.221950,30.219397",
        //         distance: "177.974",
        //         tel: [],
        //         type: "地名地址信息;门牌信息;楼栋号",
        //       },
        //       {
        //         id: "B0FFIDOFDC",
        //         direction: "东",
        //         businessarea: "西兴",
        //         address: "丹枫路86号印月尚庭",
        //         poiweight: "0.230713",
        //         name: "印月尚庭(西北门)",
        //         location: "120.223401,30.220748",
        //         distance: "215.505",
        //         tel: [],
        //         type: "通行设施;临街院门;临街院门",
        //       },
        //       {
        //         id: "B023B18PMB",
        //         direction: "南",
        //         businessarea: "西兴",
        //         address: "滨盛路附近",
        //         poiweight: "0.076903",
        //         name: "缤纷北苑2幢",
        //         location: "120.221688,30.219090",
        //         distance: "201.617",
        //         tel: [],
        //         type: "地名地址信息;门牌信息;楼栋号",
        //       },
        //       {
        //         id: "B0IDA90UI9",
        //         direction: "东",
        //         businessarea: "西兴",
        //         address: "丹枫路86号",
        //         poiweight: "0.11304",
        //         name: "滨江区西兴街道水电社区退役军人服务站",
        //         location: "120.224570,30.219964",
        //         distance: "341.892",
        //         tel: "0571-87700087",
        //         type: "政府机构及社会团体;政府机关;乡镇以下级政府及事业单位",
        //       },
        //       {
        //         id: "B023B14FJB",
        //         direction: "西南",
        //         businessarea: "西兴",
        //         address: "西兴街道江南大道",
        //         poiweight: "0.327374",
        //         name: "中海·寰宇天下E区",
        //         location: "120.217203,30.218937",
        //         distance: "435.503",
        //         tel: [],
        //         type: "商务住宅;住宅区;住宅小区",
        //       },
        //       {
        //         id: "B0I6PSJYPF",
        //         direction: "西",
        //         businessarea: "西兴",
        //         address: "西兴路与科技馆街交叉口北100米",
        //         poiweight: "0.186082",
        //         name: "滨江区建设河排灌站",
        //         location: "120.217033,30.221364",
        //         distance: "400.826",
        //         tel: [],
        //         type: "政府机构及社会团体;政府机关;区县级政府及事业单位",
        //       },
        //       {
        //         id: "B0FFL1JRN3",
        //         direction: "东南",
        //         businessarea: "西兴",
        //         address: "丹枫路与九甲巷交叉口东北120米",
        //         poiweight: "0.249375",
        //         name: "西兴街道星民社区",
        //         location: "120.224066,30.218231",
        //         distance: "402.993",
        //         tel: [],
        //         type: "政府机构及社会团体;政府机关;乡镇以下级政府及事业单位",
        //       },
        //       {
        //         id: "B0FFL6PLNR",
        //         direction: "东北",
        //         businessarea: "西兴",
        //         address: "奥体街333号交通资产综合楼2号楼",
        //         poiweight: "0.167332",
        //         name: "杭州交通资产管理有限公司",
        //         location: "120.223485,30.222522",
        //         distance: "290.918",
        //         tel: [],
        //         type: "公司企业;公司;公司",
        //       },
        //       {
        //         id: "B023B14E3R",
        //         direction: "东南",
        //         businessarea: "西兴",
        //         address: "丹枫路与九甲巷交叉口东北120米",
        //         poiweight: "0.161521",
        //         name: "星民社区居委会",
        //         location: "120.224048,30.218226",
        //         distance: "402.195",
        //         tel: [],
        //         type: "政府机构及社会团体;政府机关;乡镇以下级政府及事业单位",
        //       },
        //       {
        //         id: "B0FFHKFZB9",
        //         direction: "西",
        //         businessarea: "西兴",
        //         address: "科技馆街626号",
        //         poiweight: "0.198959",
        //         name: "寰宇商务中心",
        //         location: "120.216000,30.220367",
        //         distance: "498.758",
        //         tel: "0571-87788168",
        //         type: "商务住宅;楼宇;商务写字楼",
        //       },
        //       {
        //         id: "B023B02712",
        //         direction: "东南",
        //         businessarea: "西兴",
        //         address: "滨江区",
        //         poiweight: "0.437922",
        //         name: "星民社区",
        //         location: "120.224129,30.218226",
        //         distance: "407.591",
        //         tel: [],
        //         type: "地名地址信息;普通地名;村庄级地名",
        //       },
        //       {
        //         id: "B0IDAC1FFM",
        //         direction: "东南",
        //         businessarea: "西兴",
        //         address: "丹枫路166号",
        //         poiweight: "0.11304",
        //         name: "滨江区西兴街道七甲闸社区退役军人服务站",
        //         location: "120.224231,30.218246",
        //         distance: "412.963",
        //         tel: "0571-86020130",
        //         type: "政府机构及社会团体;政府机关;乡镇以下级政府及事业单位",
        //       },
        //       {
        //         id: "B0JKJUM2VH",
        //         direction: "东南",
        //         businessarea: "西兴",
        //         address: "丹枫路136号缤纷社区党群服务中心(缤纷会客厅)2楼",
        //         poiweight: "0.166667",
        //         name: "小五心理(缤纷店)",
        //         location: "120.222907,30.217487",
        //         distance: "409.367",
        //         tel: "19034634619",
        //         type: "医疗保健服务;医疗保健服务场所;医疗保健服务场所",
        //       },
        //       {
        //         id: "B0H10XXTA4",
        //         direction: "南",
        //         businessarea: "西兴",
        //         address: "滨江金茂府东门旁",
        //         poiweight: "0.158165",
        //         name: "蒙玛美术",
        //         location: "120.220211,30.217214",
        //         distance: "413.97",
        //         tel: [],
        //         type: "科教文化服务;培训机构;培训机构",
        //       },
        //       {
        //         id: "B0JRVZNNVT",
        //         direction: "南",
        //         businessarea: "西兴",
        //         address: "滨盛路1039号滨盛金茂府10号商铺",
        //         poiweight: "0.166449",
        //         name: "本元丹心堂",
        //         location: "120.220214,30.217294",
        //         distance: "405.237",
        //         tel: [],
        //         type: "医疗保健服务;医疗保健服务场所;医疗保健服务场所",
        //       },
        //       {
        //         id: "B0H3DLXNHP",
        //         direction: "东南",
        //         businessarea: "西兴",
        //         address: "丹枫路62附近",
        //         poiweight: "0.112973",
        //         name: "缤纷未来社区综合治理中心",
        //         location: "120.224655,30.218512",
        //         distance: "424.283",
        //         tel: [],
        //         type: "政府机构及社会团体;政府机关;乡镇以下级政府及事业单位",
        //       },
        //       {
        //         id: "BV09010933",
        //         direction: "西南",
        //         businessarea: "西兴",
        //         address: "115路542路",
        //         poiweight: "0.40005",
        //         name: "滨盛路西兴路口(快速公交站)",
        //         location: "120.218707,30.217708",
        //         distance: "421.059",
        //         tel: [],
        //         type: "交通设施服务;公交车站;快速公交站",
        //       },
        //       {
        //         id: "B0FFHJ3UKQ",
        //         direction: "西",
        //         businessarea: "西兴",
        //         address: "闻涛路与西兴路交叉口南100米",
        //         poiweight: "0.287197",
        //         name: "中海·寰宇商务中心A座",
        //         location: "120.215903,30.220236",
        //         distance: "509.749",
        //         tel: [],
        //         type: "商务住宅;楼宇;商务写字楼",
        //       },
        //       {
        //         id: "B023B1EOY3",
        //         direction: "东南",
        //         businessarea: "西兴",
        //         address: "缤纷北苑",
        //         poiweight: "0.310636",
        //         name: "缤纷北苑(东南门)",
        //         location: "120.222972,30.217693",
        //         distance: "391.31",
        //         tel: [],
        //         type: "通行设施;临街院门;临街院门",
        //       },
        //       {
        //         id: "B023B1A39E",
        //         direction: "东南",
        //         businessarea: "西兴",
        //         address: "滨江区",
        //         poiweight: "0.287356",
        //         name: "七甲闸社区",
        //         location: "120.224783,30.218542",
        //         distance: "432.098",
        //         tel: [],
        //         type: "地名地址信息;普通地名;村庄级地名",
        //       },
        //       {
        //         id: "B0JUYUX8NA",
        //         direction: "东南",
        //         businessarea: "西兴",
        //         address: "杭州市缤纷未来社区载家书房",
        //         poiweight: "0.17531",
        //         name: "缤纷未来社区非遗艺术馆",
        //         location: "120.222856,30.217495",
        //         distance: "406.568",
        //         tel: [],
        //         type: "科教文化服务;科教文化场所;科教文化场所",
        //       },
        //       {
        //         id: "B023B14DGX",
        //         direction: "东南",
        //         businessarea: "西兴",
        //         address: "缤纷北苑23幢",
        //         poiweight: "0.127138",
        //         name: "七甲闸社区居委会",
        //         location: "120.224781,30.218539",
        //         distance: "432.15",
        //         tel: [],
        //         type: "政府机构及社会团体;政府机关;乡镇以下级政府及事业单位",
        //       },
        //     ],
        //   },
        //   info: "OK",
        //   infocode: "10000",
        // };
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
    } else {
      const data = route.query;
      currentAddress.value = {
        name: data.name,
      };
      emit("location-info", {
        ...data,
        cityInfo: {
          name: data.city,
        },
      });
    }
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
  height: 2.5rem;
  min-width: 2.5rem;
  background: #3475f5;
  border-radius: 50px;
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
