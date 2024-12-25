<script setup>
import AMapLoader from "@amap/amap-jsapi-loader";
import moment from "moment";
import { ref, onMounted, reactive, watch } from "vue";
import { useRoute } from "vue-router";
import { generateDateArray } from "@/utils/utils";
import request from "@/utils/request";
import taxiIcon from "@/assets/taxi.png";
import haixiaIcon from "@/assets/haixia.png";

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
  currentCarType.value = window.localStorage.getItem("CAR_TYPE") || type;
  if (type === "person") {
    currentDateType.value = "2";
    useCarTime.value[0] = [moment().format("MM-DD HH:mm")];
  } else {
    currentDateType.value = "1";
  }
};

const carList = ref([]);
const runInfo = reactive({
  duration: "",
  mileage: "",
});

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

const handleChoosePrice = (item) => {
  item.defaultChooseState = item.defaultChooseState == "1" ? "0" : "1";
};

const getBusinessList = () => {
  // request({
  //   url: "/app/hailing/business/list",
  //   method: "POST",
  //   headers: {
  //     Authorization: route.query.token,
  //   },
  // }).then((business) => {
  const business = {
    code: "00000",
    data: [
      {
        hailingType: "1",
        businessTypeList: [
          {
            businessType: "5",
            businessTypeStr: "掌上行专车",
            displayState: "1",
            defaultChooseState: "1",
            tag: "",
            tagColor: "858b9c",
            tripTips: null,
          },
          {
            businessType: "33",
            businessTypeStr: "海峡优享出租",
            displayState: "1",
            defaultChooseState: "1",
            tag: "仅限随车发票",
            tagColor: "ff5257",
            tripTips: null,
          },
        ],
      },
      {
        hailingType: "2",
        businessTypeList: [
          {
            businessType: "11",
            businessTypeStr: "派车",
            displayState: "1",
            defaultChooseState: "1",
            tag: "",
            tagColor: "ff7d1a",
            tripTips: null,
          },
        ],
      },
    ],
  };
  const businessData = business.data;
  if (businessData && businessData.length > 0) {
    carList.value = businessData[0].businessTypeList;
    // const businessTypeSet = carList.value.map((item) => item.businessType);
    // const query = route.query;
    // request({
    //   url: "/app/hailing/trip/estimate/get",
    //   method: "POST",
    //   headers: {
    //     Authorization: route.query.token,
    //   },
    //   data: {
    //     businessTypeSet,
    //     endLat: query.tlat,
    //     endLng: query.tlng,
    //     orderType: "1",
    //     passengerCount: 1,
    //     startLat: query.flat,
    //     startLng: query.flng,
    //     useCarTime: moment().format("YYYY-MM-DD HH:mm:ss"),
    //   },
    // }).then((res) => {
    const res = {
      useCarTime: "2024-12-19 12:49:38",
      mileage: 2.646,
      duration: 517,
      orderType: "1",
      taxiPushPlate: false,
      estimatePriceList: [
        {
          businessType: "33",
          orderType: "1",
          startAmount: 10.0,
          startMileage: 3.0,
          mileageAmount: null,
          remoteMileage: 8.0,
          remoteAmount: null,
          startTime: 10,
          timeAmount: null,
          basicAmount: 10.0,
          dispatchAmount: null,
          tripAmount: 10.0,
          priceList: null,
          hailingPriceDTO: {
            priceId: "1753619451492503553",
            businessType: "33",
            orderType: "1",
            orderTypeStr: "实时订单",
            startMileage: 3.0,
            startTime: 10,
            remoteMileage: 8.0,
            remotePrice: 1.0,
            freeWaitingTime: 5,
            latePrice: 0.98,
            cancelTimeBeforeUse: null,
            cancelTimeAfterDispatch: 5,
            cancelPrice: 0.0,
            basicPrice: 10.0,
            dispatchPrice: 0.0,
            startPrice: 10.0,
            mileagePrice: 2.0,
            timePrice: 0.2,
            timeIntervalPriceList: [
              {
                timeId: "1778579495334879234",
                priceId: "1753619451492503553",
                timeIntervalType: "2",
                timeIntervalStart: "1970-01-01 15:00:00",
                timeIntervalEnd: "1970-01-01 15:59:00",
                startPrice: 12.0,
                mileagePrice: 2.4,
                timePrice: 0.2,
              },
              {
                timeId: "1778579495343267842",
                priceId: "1753619451492503553",
                timeIntervalType: "2",
                timeIntervalStart: "1969-12-31 16:00:00",
                timeIntervalEnd: "1969-12-31 21:00:00",
                startPrice: 12.0,
                mileagePrice: 2.4,
                timePrice: 0.2,
              },
            ],
          },
          payAmount: 10,
          benAmount: 0.0,
          remark: "该车型为巡网融合车型，计费方式均与巡网出租车一致",
          chargeModel: 1,
          bestChooseData: {
            orderAmount: 10,
            payAmount: 10,
            discountAmountInfoList: [],
            integralCost: null,
            integralDeductionAmount: null,
            couponDiscountAmount: null,
            productSaleId: null,
            ruleId: null,
            productDiscountAmount: null,
          },
        },
        {
          businessType: "5",
          orderType: "1",
          startAmount: 10.0,
          startMileage: 3.0,
          mileageAmount: null,
          remoteMileage: 15.0,
          remoteAmount: null,
          startTime: 10,
          timeAmount: null,
          basicAmount: 10.0,
          dispatchAmount: null,
          tripAmount: 10.0,
          priceList: null,
          hailingPriceDTO: {
            priceId: "1699740258014633986",
            businessType: "5",
            orderType: "1",
            orderTypeStr: "实时订单",
            startMileage: 3.0,
            startTime: 10,
            remoteMileage: 15.0,
            remotePrice: 0.75,
            freeWaitingTime: 5,
            latePrice: 0.98,
            cancelTimeBeforeUse: null,
            cancelTimeAfterDispatch: 5,
            cancelPrice: 3.0,
            basicPrice: 10.0,
            dispatchPrice: 0.0,
            startPrice: 10.0,
            mileagePrice: 2.7,
            timePrice: 0.5,
            timeIntervalPriceList: [
              {
                timeId: "1775425357039763458",
                priceId: "1699740258014633986",
                timeIntervalType: "2",
                timeIntervalStart: "1970-01-01 14:00:00",
                timeIntervalEnd: "1970-01-01 15:59:00",
                startPrice: 10.0,
                mileagePrice: 3.0,
                timePrice: 1.0,
              },
              {
                timeId: "1775425357048152066",
                priceId: "1699740258014633986",
                timeIntervalType: "2",
                timeIntervalStart: "1969-12-31 16:00:00",
                timeIntervalEnd: "1969-12-31 21:00:00",
                startPrice: 10.0,
                mileagePrice: 3.0,
                timePrice: 1.0,
              },
            ],
          },
          payAmount: 10,
          benAmount: 0.0,
          remark: null,
          chargeModel: null,
          bestChooseData: {
            orderAmount: 10,
            payAmount: 10,
            discountAmountInfoList: [],
            integralCost: null,
            integralDeductionAmount: null,
            couponDiscountAmount: null,
            productSaleId: null,
            ruleId: null,
            productDiscountAmount: null,
          },
        },
      ],
    };
    carList.value.forEach((item) => {
      const price = res.estimatePriceList.find(
        (i) => i.businessType === item.businessType
      );
      item.benAmount = price.benAmount;
      item.payAmount = price.payAmount;
    });
    runInfo.duration = formatDuration(res.duration);
    runInfo.mileage = res.mileage;

    // 添加路程信息标记
    const centerText = new AMap.Text({
      text: `<div style="font-size:12px">${runInfo.mileage}公里 ${runInfo.duration}</div><div style="font-size:10px">*仅做参考示意，以实际行驶为准</div>`,
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
    // });
  }
  // });
};

const markerInfo = reactive({});
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
        // 调整地图视野以包含所有标记点和路线
        map.setFitView(
          [startMarker, endMarker, startText, endText],
          true,
          [90, 90, 90, 90],
          17
        );
      }
    }
  );
  getBusinessList();
  getNearByCar();
};

function getNearByCar() {
  // request({
  //   url: "/app/common/driver/v2/nearby",
  //   method: "POST",
  //   headers: {
  //     Authorization: route.query.token,
  //   },
  //   data: {
  //     businessType: "11",
  //     startLatitude: markerInfo.flat,
  //     startLongitude: markerInfo.flng,
  //   },
  // }).then((res) => {
  //   console.log(res);
  // });
}

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

const familyList = ref([]);
const familyStr = ref("帮人叫车");
const handleAddFamile = () => {
  let url = `/pages/chooseArea/addFamily`;
  if (familyList.value.length) {
    url += `?familyList=${encodeURIComponent(
      JSON.stringify(familyList.value)
    )}`;
  }
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
    if (route.query.familyList) {
      familyList.value = JSON.parse(route.query.familyList || "[]");
      if (familyList.value.length > 0) {
        familyStr.value = familyList.value[0].name;
      } else {
        familyStr.value = "帮人叫车";
      }
      if (familyList.value.length > 1) {
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
    if (familyList.value.length === 0) {
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
  const orderData = {
    businessType: currentCarType.value === "firm" ? "11" : "5",
    orderType: currentDateType.value,
    endAddress: markerInfo.tname,
    endLatitude: markerInfo.tlat,
    endLngtitude: markerInfo.tlng,
    endAddressFull: markerInfo.taddress,
    startAddress: markerInfo.fname,
    startLatitude: markerInfo.flat,
    startLngtitude: markerInfo.flng,
    startAddressFull: markerInfo.faddress,
    passengerName: passengerInfo.name,
    passengerPhone: passengerInfo.phone,
    useCarReason: useCarReason.value,
    rentDuration: useDateTypes.value === "4" ? "24" : "12",
    useCarTime: useCarTimeStr.value || moment().format("YYYY-MM-DD HH:mm:ss"),
    // planningPath: JSON.stringify(planningPath.value),
  };
  if (
    passengerInfo.companionInfos.length &&
    passengerInfo.companionInfos[0].companionPhone
  ) {
    orderData.companionInfos = passengerInfo.companionInfos;
    orderData.togetherOrder = ~~passengerInfo.companionInfos.length > 0;
  }
  if (familyList.value.length) {
    orderData.passengerName = familyList.value[0].name;
    orderData.passengerPhone = familyList.value[0].phone;
    // orderData.companionInfos = familyList.value.slice(1).map(item=>{

    // })
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
  setCarType("firm");
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
      <div v-for="item in carList" :key="item.businessType" class="car-item">
        <div class="car-info">
          <img
            :src="item.businessType === '33' ? taxiIcon : haixiaIcon"
            alt=""
          />
          <div>
            <div class="name">{{ item.businessTypeStr }}</div>
            <div class="price">约¥{{ item.payAmount }}</div>
          </div>
        </div>
        <div class="price-info">
          <div>
            <div>
              预估<span class="forecast">{{ item.benAmount }}</span
              >元
            </div>
            <div class="favorable">
              已优惠<span class="favorable-price">20.50</span>元
            </div>
          </div>
          <div
            class="car-checkbox"
            @click="handleChoosePrice(item)"
            :class="item.defaultChooseState === '1' ? 'checked' : ''"
          >
            <span v-if="item.defaultChooseState == '1'">✔</span>
          </div>
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
          <div>预估<span class="bottom-price">15.82-14.91</span>元</div>
          <div class="bottom-choose">已选2种车型</div>
        </div>
        <div class="bottom-btn" @click="handleOrder">下一步</div>
      </div>

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
  padding-bottom: 1.14rem;
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
  padding-top: 1.2rem;
  .date-type {
    background: #f5f7fb;
    min-width: 3.84rem;
    border-radius: 50px;
    padding: 4px 14px;
    margin-right: 1.2rem;
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
    padding: 1.1rem 0;
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
    padding: 12px;
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
      font-size: 0.86rem;
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
    padding-left: 1.14rem;
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
      font-size: 1.14rem;
      font-weight: 900;
      padding: 0 3px;
      margin-bottom: 2px;
    }
    .bottom-choose {
      font-size: 0.714rem;
    }
  }
}
#trajectory-wrap {
  position: relative;
  width: 100%;
  min-height: 13.93rem; /* 195/14 ≈ 13.93 */
  :deep(.amap-logo),
  :deep(.amap-copyright) {
    display: none !important;
    opacity: 0 !important;
  }
}
</style>
