<script setup>
import AMapLoader from "@amap/amap-jsapi-loader";
import moment from "moment";
import { ref, onMounted, reactive, watch } from "vue";
import { useRoute } from "vue-router";
import { generateDateArray } from "@/utils/utils";
import request from "@/utils/request";
import taxiIcon from "@/assets/taxi.png";
import haixiaIcon from "@/assets/haixia.png";
import fastIcon from "@/assets/fast.png";

const vehicleModelLevel = {
  fastCar: fastIcon,
  specialCar: haixiaIcon,
  taxi: taxiIcon,
};

const route = useRoute();
const mapContainer = ref(null);
let AMap = null;
let map = null;
let driving = null;

window._AMapSecurityConfig = {
  securityJsCode: "9537a21ee34efb281c3fe92b4f1055bf",
};

// 时间选择
const useDateTypes = [
  { value: "1", label: "现在" },
  { value: "2", label: "预约" },
  { value: "4", label: "日租" },
  { value: "5", label: "半日租" },
];
const currentDateType = ref("1");
const useCarTime = ref([]);
const useCarTimeStr = ref("");
const showDatePicker = ref(false);
const dateColumns = generateDateArray();
const selectedDate = ref([]);
const columns = [
  dateColumns.dateArray,
  dateColumns.hourArray,
  dateColumns.minuteArray,
];
function changeDateType(v, dates) {
  currentDateType.value = v;
  let date = dates || new Date().getTime();
  if (v === "2") {
    useCarTime.value[0] = [moment(date).format("MM-DD HH:mm")];
  }
  if (v === "4") {
    useCarTime.value[0] = moment(date).format("MM-DD HH:mm");
    useCarTime.value[1] = moment(date + 86400000).format("MM-DD HH:mm");
  }
  if (v === "5") {
    useCarTime.value[0] = moment(date).format("MM-DD HH:mm");
    useCarTime.value[1] = moment(date + 43200000).format("MM-DD HH:mm");
  }
}
const onDateConfirm = (value) => {
  const v = value.selectedValues;
  changeDateType(
    currentDateType.value,
    new Date(`${v[0]} ${v[1]}:${v[2]}:00`).getTime()
  );
  useCarTimeStr.value = moment(`${v[0]} ${v[1]}:${v[2]}:00`).format(
    "YYYY-MM-DD HH:mm:ss"
  );
  showDatePicker.value = false;
};

// 用车事由
const useCarReason = ref("");
const toReason = () => {
  wx.miniProgram.navigateTo({
    url: `/pages/chooseArea/caruseCause?useCarReason=${useCarReason.value}`,
  });
};

// 用车类型
const currentCarType = ref("firm");
const setCarType = (type) => {
  currentCarType.value = type;
  if (type === "person") {
    currentDateType.value = "2";
    useCarTime.value[0] = [moment().format("MM-DD HH:mm")];
  } else {
    currentDateType.value = "1";
  }
};

const carList = ref([]);
const formatDuration = (seconds) => {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = (seconds / 60).toFixed(1);
    return `${minutes}分钟`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  }
};
const formatDistance = (distance) => {
  if (distance < 1000) {
    return `${distance}米`;
  } else {
    return `${(distance / 1000).toFixed(1)}公里`;
  }
};

const handleChoosePrice = (item) => {
  item.choosed = !item.choosed;
};

const getBusinessList = () => {
  // request({
  //   url: "/app/hailing/vehicle/model/level",
  //   method: "POST",
  //   headers: {
  //     Authorization: route.query.token,
  //   },
  // data: {
  //   businessType: "5",
  // },
  // }).then((businessData) => {
  const businessData = [
    {
      vehicleModelLevel: "fastCar",
      vehicleModelLevelName: "快车",
      carTypes: [{ carTypeId: "HS001", carTypeName: "滴滴快车" }],
    },
    {
      vehicleModelLevel: "specialCar",
      vehicleModelLevelName: "专车",
      carTypes: [
        { carTypeId: "HS002", carTypeName: "曹操专车" },
        { carTypeId: "ZSX001", carTypeName: "掌上行专车" },
      ],
    },
    {
      vehicleModelLevel: "taxi",
      vehicleModelLevelName: "出租车",
      carTypes: [{ carTypeId: "WXDW001", carTypeName: "优享出租" }],
    },
  ];
  if (businessData && businessData.length > 0) {
    businessData.forEach((item) => {
      item.choosedNum = 0;
      item.choosed = [];
      item.priceStr = "-";
      item.minPrice = Infinity;
      item.maxPrice = -Infinity;
      item.carTypes.forEach((i) => {
        i.choosed = "0";
      });
    });
    carList.value = businessData;
    // });
  }
  // });
};

// 点击外面的车请求运力类型以后缓存
const cacheCarType = reactive({});
// 当前大类车
const tempCarTypeInfo = ref({});
const showCarPicker = ref(false);
// 点击大类车
const handleChooseCar = (item) => {
  if (cacheCarType[item.vehicleModelLevel]) {
    tempCarTypeInfo.value = JSON.parse(
      JSON.stringify(cacheCarType[item.vehicleModelLevel])
    );
    showCarPicker.value = true;
    return;
  }
  // request({
  //   url: "/app/hailing/trip/estimate/v2/get",
  //   method: "POST",
  //   headers: {
  //     Authorization: route.query.token,
  //   },
  //   data: {
  //     businessType: currentCarType.value === "person" ? "5" : "11",
  //     carTypeIds: item.carTypes.map((i) => i.carTypeId),
  //     endLat: markerInfo.tlat,
  //     endLng: markerInfo.tlng,
  //     endAddress: markerInfo.tname,
  //     orderType: currentDateType.value,
  //     startLat: markerInfo.flat,
  //     startLng: markerInfo.flng,
  //     startAddress: markerInfo.fname,
  //     useCarTime: moment().format("YYYY-MM-DD HH:mm:ss"),
  //   },
  // })
  //   .then((res) => {
  const res = [
    {
      vehicleModelLevel: item.vehicleModelLevel,
      vehicleModelLevelName: item.vehicleModelLevelName,
      estimateMinPrice: 55.04,
      estimateMaxPrice: 55.04,
      discountMaxPrice: 0,
      estimateCarTypes: [
        {
          carTypeId: "ZSX001",
          carTypeName: "掌上行专车",
          taxiMetered: false,
          estimateId: null,
          estimateDistance: 3.011,
          estimateTime: 10,
          estimatePrice: 55.04,
          discountPrice: 0.0,
          fixedPriceType: null,
          fixedPrice: 0.0,
          travelPrice: 55.04,
          minPrice: 1.0,
          initPrice: 1.0,
          distancePrice: 2.02,
          timePrice: 50.0,
          nightPrice: 0.0,
          longDistance: 1.0,
          longDistancePrice: 2.02,
          dynamicPrice: 0.0,
          servicePrice: 0.0,
        },
        {
          carTypeId: "ZSX002",
          carTypeName: "专车",
          taxiMetered: false,
          estimateId: null,
          estimateDistance: 3.011,
          estimateTime: 10,
          estimatePrice: 50.04,
          discountPrice: 0.0,
          fixedPriceType: null,
          fixedPrice: 0.0,
          travelPrice: 50.04,
          minPrice: 1.0,
          initPrice: 1.0,
          distancePrice: 2.02,
          timePrice: 50.0,
          nightPrice: 0.0,
          longDistance: 1.0,
          longDistancePrice: 2.02,
          dynamicPrice: 0.0,
          servicePrice: 0.0,
        },
      ],
    },
  ];
  if (res && res.length) {
    res[0].choosedNum = 0;
    res[0].allChoosed = false;
    res[0].estimateCarTypes.forEach((ec) => {
      ec.choosed = "0";
      ec.vehicleModelLevel = ec.vehicleModelLevel;
    });
    tempCarTypeInfo.value = JSON.parse(JSON.stringify(res[0]));
    cacheCarType[item.vehicleModelLevel] = res[0];
    showCarPicker.value = true;
  } else {
    showToast("无可用车型");
  }
  // })
  // .catch(() => {
  //   showToast("无可用车型");
  // });
};
// 选择里面的小类车
const handleChooseSubCar = (car) => {
  car.choosed = car.choosed == "1" ? "0" : "1";
  tempCarTypeInfo.value.choosedNum =
    tempCarTypeInfo.value.estimateCarTypes.filter(
      (item) => item.choosed == "1"
    ).length;
  tempCarTypeInfo.value.allChoosed =
    tempCarTypeInfo.value.choosedNum ===
    tempCarTypeInfo.value.estimateCarTypes.length;
};
// 全选
const handleChooseAllSubCar = () => {
  tempCarTypeInfo.value.allChoosed = !tempCarTypeInfo.value.allChoosed;
  tempCarTypeInfo.value.choosedNum = tempCarTypeInfo.value.allChoosed
    ? tempCarTypeInfo.value.estimateCarTypes.length
    : 0;
  tempCarTypeInfo.value.estimateCarTypes.forEach((item) => {
    item.choosed = tempCarTypeInfo.value.allChoosed ? "1" : "0";
  });
};
// 已选的车型
const totalChooseCarTypeNum = ref(0);
const totalMinMaxPrice = reactive({
  min: Infinity,
  max: -Infinity,
});
const totalMinMaxPriceStr = ref("-");
// 确认选择里面的小类车
const handleSureChoose = () => {
  cacheCarType[tempCarTypeInfo.value.vehicleModelLevel] = JSON.parse(
    JSON.stringify(tempCarTypeInfo.value)
  );
  showCarPicker.value = false;
  const allChoosed = [];
  carList.value.forEach((item) => {
    // 更新当前选择小类车的状态，并更新大类车的预估价格范围
    if (item.vehicleModelLevel === tempCarTypeInfo.value.vehicleModelLevel) {
      let minPrice = 0,
        maxPrice = 0;
      const choosed = tempCarTypeInfo.value.estimateCarTypes.filter(
        (item) => item.choosed == "1"
      );
      if (choosed.length) {
        item.choosedNum = choosed.length;
        choosed.forEach((i) => {
          if (minPrice == 0 || minPrice > i.estimatePrice) {
            minPrice = i.estimatePrice;
          }
          if (maxPrice == 0 || maxPrice < i.estimatePrice) {
            maxPrice = i.estimatePrice;
          }
          i.vehicleModelLevel = item.vehicleModelLevel;
        });
        item.priceStr =
          minPrice == maxPrice ? `${minPrice}` : `${minPrice}~${maxPrice}`;
        item.minPrice = Math.min(minPrice, item.minPrice);
        item.maxPrice = Math.max(maxPrice, item.maxPrice);
        item.choosed = choosed;
      } else {
        item.choosed = [];
        item.choosedNum = 0;
        item.priceStr = "-";
        item.minPrice = Infinity;
        item.maxPrice = -Infinity;
      }
    }
    allChoosed.push(...item.choosed);
  });
  console.log({ allChoosed });
  // 每次选择以后 重新计算总的选择车型数量，以及总的预估价格范围
  totalChooseCarTypeNum.value = allChoosed.length;
  totalMinMaxPrice.min = Infinity;
  totalMinMaxPrice.max = -Infinity;
  totalMinMaxPriceStr.value = "-";
  if (allChoosed.length) {
    allChoosed.forEach((item) => {
      totalMinMaxPrice.min = Math.min(item.estimatePrice, totalMinMaxPrice.min);
      totalMinMaxPrice.max = Math.max(item.estimatePrice, totalMinMaxPrice.max);
    });
    totalMinMaxPriceStr.value =
      totalMinMaxPrice.min == totalMinMaxPrice.max
        ? `${totalMinMaxPrice.min}`
        : `${totalMinMaxPrice.min}~${totalMinMaxPrice.max}`;
  }
};
const toPriceInfoPage = (item, vehicleModelLevel) => {
  localStorage.setItem(
    "ZSX_PRICEINFO",
    JSON.stringify({ ...item, vehicleModelLevel })
  );
  wx.miniProgram.redirectTo({
    url: `/pages/transfer/index?page=ZSX_PRICEINFO`,
  });
};

const markerInfo = reactive({});
const runInfo = reactive({
  duration: "",
  mileage: "",
});

const initMap = async () => {
  if (route.query.flng && route.query.flat) {
    Object.assign(markerInfo, route.query);
  }
  // 初始化地图
  AMap = await AMapLoader.load({
    key: "0f20018974e4ab2189ad2d9f8b0a5702",
    version: "2.0",
    plugins: ["AMap.Driving"],
  });

  // 创建地图实例
  map = new AMap.Map(mapContainer.value, {
    zoom: 17,
    center: [markerInfo.flng, markerInfo.flat],
  });

  // 创建起点和终点标记
  const startMarker = new AMap.Marker({
    position: [markerInfo.flng, markerInfo.flat],
    icon: new AMap.Icon({
      size: new AMap.Size(25, 34),
      image: "@/assets/startIcon.png",
      imageSize: new AMap.Size(25, 34),
    }),
    offset: new AMap.Pixel(-12, -34),
  });

  const endMarker = new AMap.Marker({
    position: [markerInfo.tlng, markerInfo.tlat],
    icon: new AMap.Icon({
      size: new AMap.Size(25, 34),
      image: "@/assets/endIcon.png",
      imageSize: new AMap.Size(25, 34),
    }),
    offset: new AMap.Pixel(-12, -34),
  });

  // 创建文本标记
  const startText = new AMap.Text({
    text: `<div style="display:flex;align-items:center;"><div style="font-size:0.86rem;width: 100px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;font-weight: 700">${markerInfo.fname}</div><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#858b9c" d="M12.6 12L8 7.4L9.4 6l6 6l-6 6L8 16.6z"/></svg></div>`,
    anchor: "bottom-center",
    position: [markerInfo.flng, markerInfo.flat],
    style: {
      padding: "5px 10px",
      "background-color": "#fff",
      "border-radius": "16px",
      "border-width": 0,
      "box-shadow": "0 2px 6px rgba(0,0,0,0.1)",
      color: "#333",
      "font-size": "12px",
      "min-width": "116px",
      "text-align": "center",
    },
    offset: new AMap.Pixel(0, -45),
  });

  const endText = new AMap.Text({
    text: `<div style="display:flex;align-items:center;"><div style="font-size:0.86rem;width: 100px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;font-weight: 700">${markerInfo.tname}</div><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#858b9c" d="M12.6 12L8 7.4L9.4 6l6 6l-6 6L8 16.6z"/></svg></div>`,
    anchor: "bottom-center",
    position: [markerInfo.tlng, markerInfo.tlat],
    style: {
      padding: "5px 10px",
      "background-color": "#fff",
      "border-radius": "16px",
      "border-width": 0,
      "box-shadow": "0 2px 6px rgba(0,0,0,0.1)",
      color: "#333",
      "font-size": "12px",
      "min-width": "80px",
      "text-align": "center",
    },
    offset: new AMap.Pixel(0, -45),
  });

  // 将标记和文本添加到地图
  map.add([startMarker, endMarker, startText, endText]);

  // 路径规划
  driving = new AMap.Driving({
    map: map,
    panel: false,
  });

  // 途径点
  const opts = {
    waypoints: [],
  };
  if (route.query.pointList) {
    const points = JSON.parse(route.query.pointList);
    points.forEach((item) => {
      const [lng, lat] = item.location.split(",");
      opts.waypoints.push([lng, lat]);
    });
  }

  // 规划路线
  driving.search(
    [markerInfo.flng, markerInfo.flat],
    [markerInfo.tlng, markerInfo.tlat],
    opts,
    (status, result) => {
      if (status === "complete") {
        console.log(result);
        const distance = result.routes[0].distance;
        const duration = result.routes[0].time;
        runInfo.duration = formatDuration(duration);
        runInfo.mileage = formatDistance(distance);

        // 添加路程信息标记
        const centerText = new AMap.Text({
          text: `<div style="font-size:12px">${runInfo.mileage} ${runInfo.duration}</div><div style="font-size:10px">*仅做参考示意，以实际行驶为准</div>`,
          anchor: "center",
          position: [
            (Number(route.query.flng) + Number(route.query.tlng)) / 2,
            (Number(route.query.flat) + Number(route.query.tlat)) / 2,
          ],
          style: {
            padding: "2px 4px",
            "background-color": "#666f83",
            opacity: "80%",
            "border-radius": "4px",
            "border-width": 0,
            color: "#ffffff",
            "min-width": "128px",
          },
        });

        map.add(centerText);
        // 调整地图视野以包含所有标记点和路线
        map.setFitView(
          [startMarker, endMarker, centerText, startText, endText],
          true,
          [75, 75, 75, 80],
          17
        );
      }
    }
  );
  getBusinessList();
};

const passengerInfo = reactive({
  name: "",
  nameStr: "",
  phone: "",
  companionInfos: [],
});

const handleSelectPassenger = () => {
  wx.miniProgram.navigateTo({
    url: `/pages/chooseArea/addPerson?phone=${
      passengerInfo.phone
    }&name=${encodeURIComponent(
      passengerInfo.name
    )}&companionInfos=${encodeURIComponent(
      JSON.stringify(passengerInfo.companionInfos)
    )}`,
  });
};

const familyInfo = reactive({
  familyList: [],
  remark: "",
  isCallme: "1",
});
const familyStr = ref("帮人叫车");
const handleAddFamile = () => {
  let url = `/pages/chooseArea/addFamily`;
  url += `?familyInfo=${encodeURIComponent(JSON.stringify(familyInfo))}`;
  wx.miniProgram.navigateTo({
    url: url,
  });
};

const pointList = ref([]);
const toAddPoint = () => {
  wx.miniProgram.navigateTo({
    url: `/pages/trajectory/addPoint`,
  });
};

watch(
  () => route.params,
  () => {
    console.log(route.query);
    const query = route.query;
    if (query.phone && query.name) {
      passengerInfo.name = query.name;
      passengerInfo.phone = query.phone;
      passengerInfo.nameStr = query.name;
    }
    if (query.companionInfos) {
      const companionInfos = JSON.parse(query.companionInfos || "[]");
      passengerInfo.companionInfos = companionInfos;
      if (companionInfos.length > 0) {
        passengerInfo.nameStr += `等`;
      }
    }
    if (route.query.useCarReason) {
      useCarReason.value = route.query.useCarReason;
    }
    if (route.query.familyInfo) {
      Object.assign(familyInfo, JSON.parse(route.query.familyInfo || "{}"));
      if (familyInfo.familyList.length > 0) {
        familyStr.value = familyInfo.familyList[0].name;
      } else {
        familyStr.value = "帮人叫车";
      }
      if (familyInfo.familyList.length > 1) {
        familyStr.value += `等`;
      }
    }
    if (route.query.pointList) {
      pointList.value = JSON.parse(decodeURIComponent(route.query.pointList));
      initMap();
    }
  },
  { deep: true, immediate: true }
);

const handleOrder = () => {
  if (currentCarType.value === "person") {
    if (useCarTime.value[0] === "预约") {
      showToast("请选择时间");
      return;
    }
    if (familyInfo.familyList.length === 0) {
      showToast("请输入乘车人");
      return;
    }
  } else {
    if (!passengerInfo.phone) {
      showToast("请输入乘车人");
      return;
    }
    if (!useCarReason.value) {
      showToast("选输入用车事由");
      return;
    }
  }
  if (totalChooseCarTypeNum.value === 0) {
    showToast("请选择车型");
    return;
  }
  const choosedCarType = carList.value.reduce((acc, cur) => {
    return acc.concat(cur.choosed);
  }, []);
  const orderData = {
    businessType: currentCarType.value === "firm" ? "11" : "5",
    orderType: 1 || currentDateType.value,
    endAddress: markerInfo.tname,
    endLatitude: markerInfo.tlat,
    endLngtitude: markerInfo.tlng,
    endLat: markerInfo.tlat,
    endLng: markerInfo.tlng,
    endAddressFull: markerInfo.taddress,
    startAddress: markerInfo.fname,
    startLatitude: markerInfo.flat,
    startLngtitude: markerInfo.flng,
    startLng: markerInfo.flng,
    startLat: markerInfo.flat,
    startAddressFull: markerInfo.faddress,
    passengerName: passengerInfo.name,
    passengerPhone: passengerInfo.phone,
    useCarReason: useCarReason.value,
    rentDuration: useDateTypes.value === "4" ? "24" : "12",
    useCarTime: useCarTimeStr.value || moment().format("YYYY-MM-DD HH:mm:ss"),
    totalChooseCarTypeNum: totalChooseCarTypeNum.value,
    totalMinMaxPriceStr: totalMinMaxPriceStr.value,
    addCarTypes: choosedCarType.map((item) => {
      return {
        carTypeId: item.carTypeId,
        estimateAmount: item.estimatePrice,
        estimateId: item.estimateId,
        vehicleModelLevel: item.vehicleModelLevel,
      };
    }),
    // planningPath: JSON.stringify(planningPath.value),
  };
  console.log(orderData);
  if (
    passengerInfo.companionInfos.length &&
    passengerInfo.companionInfos[0].companionPhone
  ) {
    orderData.companionInfos = passengerInfo.companionInfos;
    orderData.togetherOrder = ~~passengerInfo.companionInfos.length > 0;
  }
  if (familyInfo.familyList) {
    orderData.passengerName = familyInfo.familyList[0].name;
    orderData.passengerPhone = familyInfo.familyList[0].phone;
    orderData.remark = familyInfo.remark;
    orderData.isCallme = familyInfo.isCallme || "1";
    orderData.companionInfos = familyInfo.familyList.slice(1).map((item) => {
      return {
        companionName: item.name,
        companionPhone: item.phone,
      };
    });
    orderData.togetherOrder = ~~orderData.companionInfos.length > 0;
  }
  if (pointList.value.length) {
    orderData.midwayList = pointList.value.map((item, idx) => {
      return {
        midwayAddress: item.address,
        midwayLongitude: item.location.split(",")[0],
        midwayLatitude: item.location.split(",")[1],
        midwayIndex: idx + 1,
      };
    });
  }
  localStorage.setItem("ZSX_ORDER_CONFIRM", JSON.stringify(orderData));
  wx.miniProgram.navigateTo({
    url: `/pages/transfer/index?page=ZSX_ORDER_CONFIRM`,
  });
};
// const mountedData = ref("");
onMounted(() => {
  initMap();
  setCarType(window.localStorage.getItem("CAR_TYPE") || "firm");
  // mountedData.value = new Date();
});
</script>

<template>
  <div class="trajectory-page">
    <div class="map-wrap">
      <div class="map-container" id="trajectory-wrap" ref="mapContainer"></div>
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
    <div class="car-list">
      <div class="date-type-wrap" v-if="currentCarType === 'firm'">
        <span
          v-for="item in useDateTypes"
          class="date-type"
          :key="item"
          :class="{ active: item.value === currentDateType }"
          @click="changeDateType(item.value)"
          >{{ item.label }}</span
        >
      </div>
      <div
        v-for="item in carList"
        :key="item.vehicleModelLevel"
        class="car-item"
      >
        <div class="car-info">
          <img
            :src="vehicleModelLevel[item.vehicleModelLevel]"
            alt="vehicleModelLevel"
          />
          <div>
            <div class="name">{{ item.vehicleModelLevelName }}</div>
            <div class="choose-car" @click="handleChooseCar(item)">
              <div>
                已选<span class="choose"
                  >{{ item.choosedNum }}/{{ item.carTypes.length }}</span
                >个
              </div>
              <div class="right"></div>
            </div>
          </div>
        </div>
        <div class="price-info">
          <div>
            <div>
              预估<span class="forecast">{{ item.priceStr }}</span
              >元
            </div>
            <!-- <div class="favorable">
              优惠<span class="favorable-price">20.50</span>元
            </div> -->
          </div>
          <!-- <div
            class="car-checkbox"
            @click="handleChoosePrice(item)"
            :class="item.choosed ? 'checked' : ''"
          >
            <span v-if="item.choosed">✔</span>
          </div> -->
        </div>
      </div>
      <div v-if="currentCarType === 'firm'">
        <div class="options">
          <div class="item" @click="showDatePicker = true">
            <span class="title">{{
              currentDateType == 1 ? "现在出发" : useCarTime.join(" ~ ")
            }}</span>
            <img
              v-if="currentDateType != 1"
              class="right-icon"
              src="@/assets/right.png"
              alt=""
            />
          </div>
          <div class="item text-right" @click="handleSelectPassenger">
            <span class="title">{{
              passengerInfo.nameStr || "乘车人/同行人"
            }}</span>
            <img class="right-icon" src="@/assets/right.png" alt="" />
          </div>
        </div>
        <div class="options">
          <div class="item" @click="toReason('reason')">
            <span class="title">
              {{ useCarReason || "用车事由" }}
            </span>
            <img class="right-icon" src="@/assets/right.png" alt="" />
          </div>
          <div class="item text-right" @click="toAddPoint">
            <span class="title">添加途径点</span>
            <img class="right-icon" src="@/assets/right.png" alt="" />
          </div>
        </div>
      </div>
      <div v-else class="options">
        <div class="item" @click="showDatePicker = true">
          <span class="title">{{ useCarTime.join(" ~ ") }}</span>
          <img class="right-icon" src="@/assets/right.png" alt="" />
        </div>
        <div class="item text-right" @click="handleAddFamile">
          <span class="title">{{ familyStr || "帮人叫车" }}</span>
          <img class="right-icon" src="@/assets/right.png" alt="" />
        </div>
      </div>
      <div class="btns">
        <div class="bottom-price-wrap">
          <div>
            预估<span class="bottom-price">{{ totalMinMaxPriceStr }}</span
            >元
          </div>
          <div class="bottom-choose">已选{{ totalChooseCarTypeNum }}种车型</div>
        </div>
        <div class="bottom-btn" @click="handleOrder">下一步</div>
      </div>

      <!-- 日期时间选择 -->
      <van-popup
        v-model:show="showDatePicker"
        position="bottom"
        :style="{ height: '30%' }"
      >
        <van-picker
          v-model="selectedDate"
          title="标题"
          :columns="columns"
          @confirm="onDateConfirm"
          @cancel="showDatePicker = false"
        />
      </van-popup>

      <!-- 车辆类型选择 -->
      <van-popup
        v-model:show="showCarPicker"
        position="bottom"
        :close-on-click-overlay="false"
        class="popup-carlist"
      >
        <div class="total-price">
          <span
            >{{ tempCarTypeInfo.estimateMinPrice }}-{{
              tempCarTypeInfo.estimateMaxPrice
            }}元</span
          >
          <img
            @click="showCarPicker = false"
            src="@/assets/close.svg"
            alt=""
            srcset=""
          />
        </div>
        <div class="car-list subcar-list">
          <div class="choosed-car">
            <span>已选以下{{ tempCarTypeInfo.choosedNum }}个服务商</span>
            <div class="all-choose">
              <span>全选</span>
              <div
                class="car-checkbox"
                @click="handleChooseAllSubCar"
                :class="tempCarTypeInfo.allChoosed ? 'checked' : ''"
              >
                <span v-if="tempCarTypeInfo.allChoosed">✔</span>
              </div>
            </div>
          </div>
          <div
            v-for="item in tempCarTypeInfo.estimateCarTypes"
            :key="item.carTypeId"
            class="car-item"
          >
            <div class="car-info">
              <img class="car-img" src="@/assets/carIcon.png" alt="" />
              <div class="name">{{ item.carTypeName }}</div>
            </div>
            <div class="price-info">
              <img
                @click="
                  toPriceInfoPage(item, tempCarTypeInfo.vehicleModelLevel)
                "
                class="info-icon"
                src="@/assets/info.svg"
                alt=""
              />
              <div class="favorable">
                <span class="forecast">{{ item.estimatePrice }}</span
                >元
                <div v-if="item.discountPrice" class="favorable">
                  优惠<span class="favorable-price"
                    >-{{ item.discountPrice }}</span
                  >元
                </div>
              </div>
              <div
                class="car-checkbox"
                @click="handleChooseSubCar(item)"
                :class="item.choosed === '1' ? 'checked' : ''"
              >
                <span v-if="item.choosed == '1'">✔</span>
              </div>
            </div>
          </div>
        </div>
        <div class="div-btn" @click="handleSureChoose(true)">确认</div>
      </van-popup>
    </div>
  </div>
</template>

<style scoped lang="scss">
.trajectory-page {
  width: 100%;
  height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
}

.map-wrap {
  width: 100%;
  height: 100%;
  flex: 1;
  position: relative;
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
}
.map-container {
  width: 100%;
  height: 100%;
}

.date-type-wrap {
  display: flex;
  align-items: center;
  padding-top: 12px;
  .date-type {
    background: #f5f7fb;
    min-width: 54px;
    border-radius: 50px;
    padding: 4px 14px;
    margin-right: 16px;
    color: #858b9c;
    font-size: 12px;
    text-align: center;
  }
  .active {
    background: #1985fb;
    color: #ffffff;
  }
}
.car-list {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 20px 20px 0px 0px;
  box-shadow: 0px -5px 10px rgba(0, 0, 0, 0.1);
  padding: 0 16px;
  .car-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f5f7fb;
    .car-info {
      display: flex;
      align-items: center;
      img {
        width: 50px;
        height: 32px;
        margin-right: 8px;
      }
    }
    .choose-car {
      display: flex;
      align-items: center;
      color: #858b9c;
      font-size: 12px;
      .choose {
        color: #1985fb;
      }
      .right {
        height: 0;
        width: 0;
        margin: 2px 0 0 4px;
        border-left: 5px solid #858b9c;
        border-right: 5px solid transparent;
        border-top: 5px solid transparent;
        border-bottom: 5px solid transparent;
      }
    }
    .name {
      font-weight: 700;
      color: #41485d;
      font-size: 14px;
      margin-bottom: 2px;
    }
    .price-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .price,
    .favorable {
      color: #858b9c;
      font-size: 12px;
    }
    .forecast {
      font-weight: 700;
      color: #41485d;
      font-size: 20px;
      padding: 0 2px;
    }
    .favorable-price {
      font-weight: 700;
      color: #ff7d1a;
      font-size: 14px;
      padding: 0 4px;
    }
  }
  .options {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 10px;
    font-weight: 700;
    color: #41485d;
    border-bottom: 1px solid #f5f7fb;
    // .divider {
    //   width: 1px;
    //   height: 100%;
    //   background-color: #f5f7fb;
    // }
    .title {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 12px;
    }
    .item {
      display: flex;
      align-items: center;
      color: #41485d;
      font-size: 14px;
      flex: 1;
      img {
        width: 12px;
        height: 12px;
        margin-right: 8px;
      }
      .right-icon {
        width: 24px;
        height: 24px;
        margin-right: 0px;
      }
    }
    .text-right {
      justify-content: flex-end;
    }
  }
  .btns {
    display: flex;
    justify-content: space-between;
    border-radius: 10px;
    color: #fff;
    background: #3d1a00;
    padding-left: 16px;
    .bottom-btn {
      border-radius: 10px;
      background: linear-gradient(90deg, #f3741f 0%, #f4b809 100%);
      padding: 1rem 2.14rem;
      font-size: 1rem;
      text-align: center;
    }
    .bottom-price-wrap {
      font-size: 0.86rem;
      padding: 4px 0;
    }
    .bottom-price {
      font-size: 16px;
      font-weight: 900;
      padding: 0 3px;
      margin-bottom: 2px;
    }
    .bottom-choose {
      font-size: 12px;
    }
  }
}
.popup-carlist {
  padding: 12px;
  border-radius: 6px;
  background: #f5f7fb;
  height: fit-content;
  max-height: 50%;
  .total-price {
    font-weight: 700;
    font-size: 16px;
    display: flex;
    justify-content: space-between;
    padding-bottom: 8px;
    img {
      width: 16px;
      height: 16px;
    }
  }
  .choosed-car {
    color: #858b9c;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    margin-bottom: 8px;
    border-bottom: 1px solid #f5f7fb;
    .all-choose {
      display: flex;
      align-items: center;
    }
  }
  .subcar-list {
    border-radius: 6px;
    .car-img {
      width: 30px;
      height: 30px;
    }
    .info-icon {
      width: 14px;
      height: 14px;
    }
  }
  .div-btn {
    margin-top: 10px;
    text-align: center;
    background-color: #003f93;
    border-radius: 10px;
    color: #ffffff;
    padding: 6px 8px;
  }
}
#trajectory-wrap {
  position: relative;
  width: 100%;
  min-height: 195px;
  :deep(.amap-logo),
  :deep(.amap-copyright) {
    display: none !important;
    opacity: 0 !important;
  }
}
.car-checkbox {
  height: 20px;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  box-sizing: border-box;
  border-radius: 4px;
  border: 2px solid #c5cad5;
  margin-left: 14px;
}
.checked {
  background-color: #467ef7;
  color: #ffffff;
  border: unset;
}
</style>
