<script setup>
import AMapLoader from "@amap/amap-jsapi-loader";
import moment from "moment";
import { ref, onMounted, reactive, watch } from "vue";
import { useRoute } from "vue-router";
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

const useDateTypes = ["现在", "预约", "日租", "半日租"];
const currentDateType = ref(0);
const changeDateType = (v) => {
  currentDateType.value = v;
};

const handleSelectPassenger = () => {
  wx.miniProgram.navigateTo({
    url: "/pages/chooseArea/addPerson",
  });
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

const initMap = async () => {
  // 初始化地图
  AMap = await AMapLoader.load({
    key: "0f20018974e4ab2189ad2d9f8b0a5702",
    version: "2.0",
    plugins: ["AMap.Driving"],
  });

  // 创建地图实例
  map = new AMap.Map(mapContainer.value, {
    zoom: 17,
    center: [route.query.flng, route.query.flat],
  });
  console.log(route.query);

  // 创建起点和终点标记
  const startMarker = new AMap.Marker({
    position: [route.query.flng, route.query.flat],
    icon: new AMap.Icon({
      size: new AMap.Size(25, 34),
      image: "@/assets/startIcon.png",
      imageSize: new AMap.Size(25, 34),
    }),
    offset: new AMap.Pixel(-12, -34),
  });

  const endMarker = new AMap.Marker({
    position: [route.query.tlng, route.query.tlat],
    icon: new AMap.Icon({
      size: new AMap.Size(25, 34),
      image: "@/assets/endIcon.png",
      imageSize: new AMap.Size(25, 34),
    }),
    offset: new AMap.Pixel(-12, -34),
  });

  // 创建文本标记
  const startText = new AMap.Text({
    text: `<div style="display:flex;align-items:center"><div style="font-size:0.86rem;max-width: 76px;white-space: pre-wrap;">${route.query.fname}</div><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#858b9c" d="M12.6 12L8 7.4L9.4 6l6 6l-6 6L8 16.6z"/></svg></div>`,
    anchor: "bottom-center",
    position: [route.query.flng, route.query.flat],
    style: {
      padding: "5px 10px",
      "background-color": "#fff",
      "border-radius": "5px",
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
    text: `<div style="display:flex;align-items:center"><div style="font-size:0.86rem;max-width: 76px;white-space: pre-wrap;">${route.query.tname}</div><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#858b9c" d="M12.6 12L8 7.4L9.4 6l6 6l-6 6L8 16.6z"/></svg></div>`,
    anchor: "bottom-center",
    position: [route.query.tlng, route.query.tlat],
    style: {
      padding: "5px 10px",
      "background-color": "#fff",
      "border-radius": "5px",
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

  // 规划路线
  driving.search(
    [route.query.flng, route.query.flat],
    [route.query.tlng, route.query.tlat],
    (status, result) => {
      if (status === "complete") {
        // 调整地图视野以包含所有标记点和路线
        map.setFitView(
          [startMarker, endMarker, startText, endText],
          true,
          [60, 60, 90, 90],
          17
        );
      }
    }
  );
  getBusinessList();
};

const passengerInfo = reactive({
  name: "",
  phone: "",
  companionList: [],
});

watch(
  () => route.params,
  () => {
    const query = route.query;
    if (query.phone && query.name) {
      passengerInfo.name = query.name;
      passengerInfo.phone = query.phone;
      const companionList = JSON.parse(query.companionList) || [];
      console.log(companionList);
    }
  },
  { deep: true }
);

const handleOrder = () => {
  // request({
  //   url: "/app/passenger/info/get",
  //   method: "POST",
  //   headers: {
  //     Authorization: route.query.token,
  //   },
  // }).then((res) => {
  //   console.log(res);
  // });
  console.log(route.query);
  const query = route.query;
  // request({
  //   url: "/app/common/order/add",
  //   method: "POST",
  //   headers: {
  //     Authorization: query.token,
  //   },
  //   data: {
  //     businessType: "33",
  //     endAddress: query.tname,
  //     endLatitude: query.tlat,
  //     endLngtitude: query.tlng,
  //     endAddressFull: query.taddress,
  //     startAddress: query.fname,
  //     startLatitude: query.flat,
  //     startLngtitude: query.flng,
  //     startAddressFull: query.faddress,
  //     orderType: "1",
  //     passengerName: query.name,
  //     passengerPhone: query.phone,
  //   },
  // }).then((res) => {
  //   console.log(res);
  // });

  request({
    url: "/app/common/order/page",
    method: "POST",
    headers: {
      Authorization: query.token,
    },
    data: {
      orderState: 0,
      pageNum: 1,
      pageSize: 10,
    },
  }).then((res) => {
    console.log("orderPage: ", res);
  });
};

const mountedData = ref("");
onMounted(() => {
  initMap();
  mountedData.value = new Date();
  showToast("No need to import showToast");
});
</script>

<template>
  <div class="trajectory-page">
    <div class="map-container" id="trajectory-wrap" ref="mapContainer"></div>
    <div class="car-list">
      <div class="date-type-wrap">
        <span
          v-for="(item, idx) in useDateTypes"
          class="date-type"
          :key="item"
          :class="{ active: idx === currentDateType }"
          @click="changeDateType(idx)"
          >{{ item }}</span
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
      <div class="options">
        <div>
          <img src="@/assets/clock.png" alt="" />
          <span>现在出发</span>
          <img src="@/assets/right.png" alt="" />
        </div>
        <div @click="handleSelectPassenger">
          <img src="@/assets/clock.png" alt="" />
          <span>{{
            passengerInfo.name ? passengerInfo.name : "选择乘车人"
          }}</span>
          <img src="@/assets/right.png" alt="" />
        </div>
      </div>
      <div class="btns">
        <!-- <div class="div-btn person">个人用车</div>
        <div class="div-btn company">企业派车</div> -->
        <div class="bottom-price-wrap">
          <div>预估<span class="bottom-price">15.82-14.91</span>元</div>
          <div class="bottom-choose">已选2种车型</div>
        </div>
        <div class="bottom-btn" @click="handleOrder">立即打车</div>
      </div>
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

.map-container {
  width: 100%;
  height: 100%;
  flex: 1;
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
    font-size: 14px;
    > div {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #41485d;
      font-size: 14px;
      img {
        width: 12px;
        height: 12px;
        margin-right: 8px;
      }
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

    // .person {
    //   background: #3d1a00;
    // }
    // .company {
    //   background: linear-gradient(90deg, #f3741f 0%, #f4b809 100%);
    // }
  }
}
#trajectory-wrap {
  position: relative;
  width: 100%;
  height: 13.93rem; /* 195/14 ≈ 13.93 */
  :deep(.amap-logo),
  :deep(.amap-copyright) {
    display: none !important;
    opacity: 0 !important;
  }
}
</style>
