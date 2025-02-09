<script setup>
import AMapLoader from "@amap/amap-jsapi-loader";
import { ref, onMounted, computed, reactive, watch } from "vue";
import { ORDER_STATUS } from "../utils/constant";
import moment from "moment";
import { useRoute, useRouter } from "vue-router";
import request from "@/utils/request";
import { showToast } from "vant";
import towgs84 from "@/utils/towgs84";
import startIcon from "@/assets/startIcon.png";
import endIcon from "@/assets/endIcon.png";

let map = null;
const mapContainer = ref(null);
let AMap = null;
window._AMapSecurityConfig = {
  securityJsCode: "9537a21ee34efb281c3fe92b4f1055bf",
};
const isFirst = ref(false)
async function initMap(order) {
  // 初始化地图
  AMap = await AMapLoader.load({
    key: "0f20018974e4ab2189ad2d9f8b0a5702",
    version: "2.0",
    plugins: ["AMap.Driving"],
  });
  // 创建地图实例
  map = new AMap.Map(mapContainer.value, {
    zoom: 17,
  });
  // 司机出发 司机到达都不用, 会有地方加载
  if (!["1", "2", "3"].includes(order.orderState)) {
    setStartAndEnd(order);
  }
}

const route = useRoute();
const setStartAndEnd = async (res) => {
  map.clearMap();
  // 创建起点和终点标记
  const startMarker = new AMap.Marker({
    position: [res.startLngtitude, res.startLatitude],
    icon: new AMap.Icon({
      size: new AMap.Size(34, 34),
      image: startIcon,
      imageSize: new AMap.Size(34, 34),
    }),
    offset: new AMap.Pixel(-16, -24),
  });

  let endMarker = new AMap.Marker({
    position: [res.endLngtitude, res.endLatitude],
    icon: new AMap.Icon({
      size: new AMap.Size(34, 34),
      image: endIcon,
      imageSize: new AMap.Size(34, 34),
    }),
    offset: new AMap.Pixel(-16, -24),
  });
  if (["2", "3"].includes(res.orderState)) {
    try {
      const { data } = await getDriverLocation(res);
      if (data) {
        const newPosition = new AMap.LngLat(
          data.driverPosition.lng,
          data.driverPosition.lat
        );
        endMarker.setPosition(newPosition);
      }
    } catch (e) {
      console.log(e);
    }
  }
  map.add(startMarker);
  map.add(endMarker);

  if (!["2", "3", "4", "5", "6"].includes(res.orderState)) {
    // 创建文本标记
    const startText = new AMap.Text({
      text: `<div style="display:flex;align-items:center;"><div style="font-size:0.86rem;width: 100px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;font-weight: 700">${res.startAddress}</div></div>`,
      anchor: "bottom-center",
      position: [res.startLngtitude, res.startLatitude],
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
      offset: new AMap.Pixel(0, -20),
    });

    const endText = new AMap.Text({
      text: `<div style="display:flex;align-items:center;"><div style="font-size:0.86rem;width: 100px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;font-weight: 700">${res.endAddress}</div></div>`,
      anchor: "bottom-center",
      position: [res.endLngtitude, res.endLatitude],
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
      offset: new AMap.Pixel(0, -20),
    });
    map.add(startText);
    map.add(endText);
  }

  // 行程中不用这里更新
  if (!["2", "3", "4"].includes(res.orderState)) {
    map.setFitView([startMarker, endMarker], true, [75, 75, 75, 80], 17);
  } else if (!isFirst.value) {
    map.setFitView([startMarker, endMarker], true, [75, 75, 75, 80], 19);
    isFirst.value = true;
  }
};

const businessData = {
  fastCar: "快车",
  specialCar: "专车",
  taxi: "出租车",
};

const orderDetail = reactive({});
function getOrderDetail(orderNo, logId) {
  let interval = setInterval(() => {
    request({
      url: "/app/common/order/get",
      method: "POST",
      headers: {
        Authorization:
          route.query.token || localStorage.getItem("ZSX_WX_TOKEN"),
      },
      data: {
        orderNo,
        logId,
      },
    }).then(async (res) => {
      console.log(res);
      const tempOrder = { ...res.order };
      [res.order.startLatitude, res.order.startLngtitude] =
        towgs84.transformWGS2GCJ(
          res.order.startLatitude,
          res.order.startLngtitude
        );
      [res.order.endLatitude, res.order.endLngtitude] =
        towgs84.transformWGS2GCJ(res.order.endLatitude, res.order.endLngtitude);
      res.orderTime = moment(new Date(res.orderTime + "Z")).format(
        "YYYY-MM-DD HH:mm:ss"
      );
      Object.assign(orderDetail, res);
      if (!AMap && mapContainer.value) {
        await initMap(tempOrder);
      }
      if (
        orderDetail.orderNo &&
        !["1", "2", "3"].includes(orderDetail.orderState)
      ) {
        clearInterval(interval);
        interval = null;
      }
      if (["2", "3"].includes(orderDetail.orderState)) {
        setStartAndEnd(orderDetail.order);
      }
      if (["4"].includes(orderDetail.orderState)) {
        map.clearMap();
        getPlanInfo(orderDetail.order);
      }
      if (["5", "6", "100"].includes(orderDetail.orderState)) {
        map.clearMap();
        clearInterval(interval);
        getRealTrip(orderDetail.order);
      }
    });
  }, 2000);
}

const router = useRouter();
function handleReOrder() {
  const postData = JSON.parse(localStorage.getItem("ZSX_ORDER_CONFIRM"));
  const orderData = orderDetail.order;
  console.log(postData);
  const fromwgs84 = towgs84.transformGCJ2WGS(
    postData.startLatitude,
    postData.startLngtitude
  );
  const endwgs84 = towgs84.transformGCJ2WGS(
    postData.endLatitude,
    postData.endLngtitude
  );
  postData.startLngtitude = fromwgs84[1];
  postData.startLatitude = fromwgs84[0];
  postData.startLng = fromwgs84[1];
  postData.startLat = fromwgs84[0];
  postData.endLngtitude = endwgs84[1];
  postData.endLatitude = endwgs84[0];
  postData.endLng = endwgs84[1];
  postData.endLat = endwgs84[0];
  if (!postData.passengerPhone) {
    postData.passengerPhone = orderData.passengerPhone;
    postData.passengerName = orderData.passengerName;
  }
  // if (orderData.orderState === "101") {
  //   orderData.overTimeOrder = "1";
  //   orderData.overTimeApprovalNo = orderData.approvalNo;
  // }
  // if (orderData.orderState === "101") {
  //   request({
  //     url: "/app/common/overTime/order/againAdd",
  //     method: "POST",
  //     headers: {
  //       Authorization: route.query.token,
  //     },
  //     data: {
  //       logId: orderData.logId,
  //     },
  //   })
  //     .then((res) => {
  //       router.replace({
  //         path: "/orderDetail",
  //         query: {
  //           logId: res.logId,
  //         },
  //       });
  //       getOrderDetail(res.orderNo, res.logId);
  //     })
  //     .catch((err) => {
  //       showToast(err.data.userTip);
  //     });
  // } else {
  request({
    url: "/app/common/order/v2/add",
    method: "POST",
    headers: {
      Authorization: route.query.token || localStorage.getItem("ZSX_WX_TOKEN"),
    },
    data: {
      ...postData,
    },
  }).then((res) => {
    // router.replace({
    //   path: `/orderDetail/${new Date().getTime()}`,
    //   query: {
    //     orderNo: res.orderNo,
    //     logId: res.logId,
    //   },
    // });
    window.location.hash = `#/orderDetail/${new Date().getTime()}?orderNo=${
      res.orderNo
    }&logId=${res.logId}&token=${
      route.query.token || localStorage.getItem("ZSX_WX_TOKEN")
    }`;
    // window.location.reload();
    getOrderDetail(res.orderNo, res.logId);
  });
  // }
}

// 获取司机位置
function getDriverLocation(order) {
  return request({
    url: "/app/common/driver/position/get",
    method: "POST",
    headers: {
      Authorization: route.query.token || localStorage.getItem("ZSX_WX_TOKEN"),
    },
    data: {
      driverId: order.driverId,
    },
  });
}

function getPlanInfo(orderDetail) {
  request({
    url: "/app/hailing/order/path/planning/info",
    method: "POST",
    headers: {
      Authorization: route.query.token || localStorage.getItem("ZSX_WX_TOKEN"),
    },
    data: {
      phone: orderDetail.passengerPhone,
      orderNo: orderDetail.orderNo,
    },
  }).then((res) => {
    const { path, ...rest } = res;
    if (path) {
      const pathArray = path
        .split(";")
        .map(function (item) {
          var coords = item.split(",");
          return [parseFloat(coords[1]), parseFloat(coords[0])];
        })
        .filter(function (item) {
          return item[0] && item[1];
        });
      updatePosition(pathArray, { ...rest, ...orderDetail });
    } else {
      if (orderDetail.orderState === "100") {
        setStartAndEnd(orderDetail);
        showToast("未获取到路径信息");
        return;
      }
      getOrderDetail(route.query.orderNo, route.query.logId);
    }
  });
}

function getRealTrip(orderDetail) {
  request({
    url: "/app/hailing/order/real/trip",
    method: "GET",
    headers: {
      Authorization: route.query.token || localStorage.getItem("ZSX_WX_TOKEN"),
    },
    params: {
      orderNo: orderDetail.orderNo,
    },
  }).then((res) => {
    const { polyline, ...rest } = res;
    const pathArray = polyline
      .split(";")
      .map(function (item) {
        var coords = item.split(",");
        return [parseFloat(coords[0]), parseFloat(coords[1])];
      })
      .filter(function (item) {
        return item[0] && item[1];
      });
    updatePosition(pathArray, { ...rest, ...orderDetail });
  });
}

const polyline = ref(null);
let driving = null;
function updatePosition(pathArray, info) {
  setStartAndEnd({
    ...info,
    startLngtitude: pathArray[0][0] || info.longitude,
    startLatitude: pathArray[0][1] || info.latitude,
    endLngtitude: pathArray[pathArray.length - 1][0],
    endLatitude: pathArray[pathArray.length - 1][1],
    orderState: info.orderState,
  });
  if (!polyline.value) {
    polyline.value = new AMap.Polyline({
      map: map,
      path: pathArray,
      strokeColor: "#28aa91", //线颜色
      strokeOpacity: 1, //线透明度
      strokeWeight: 5, //线宽
      strokeStyle: "solid", //线样式
      showDir: true, //是否显示箭头
    });
    polyline.value.setMap(map);
  } else {
    polyline.value.setPath(pathArray);
    polyline.value.setMap(map);
  }
  if (!["100"]){
    // 添加路程信息标记
    const centerText = new AMap.Text({
      text: `<div style="font-size:12px">距离目的地估计${(
        info.arriveMileage / 1000
      ).toFixed(1)}公里 ${formatDuration(info.arriveTime)}`,
      anchor: "center",
      position: [info.longitude, info.latitude],
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
  }
  if (!["5", "6", "100"].includes(info.orderState)) {
    setTimeout(() => {
      getPlanInfo(info);
    }, 3000);
  }
}
const formatDuration = (seconds) => {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  }
};

const showStateInfo = computed(() => {
  const s = ORDER_STATUS[orderDetail.orderState];
  if (s) {
    return {
      text: s.text,
      subtext:
        orderDetail.order.cancelDesc ||
        s.subtext(orderDetail?.order.partnerCarTypeName || ""),
    };
  }
  return {
    text: orderDetail.orderStateStr || ORDER_STATUS[-1].text,
    subtext: ORDER_STATUS[-1].subtext(),
  };
});

const cancelReason = ref([]);
const chooseReason = ref("");
const showCancleDialog = ref(false);
function getCancelReason() {
  request({
    url: "/app/common/syscode/list",
    method: "POST",
    headers: {
      Authorization: route.query.token || localStorage.getItem("ZSX_WX_TOKEN"),
    },
    data: {
      typeCode: "HAILING_ORDER_CANCEL_DESC_TYPE",
    },
  }).then((res) => {
    cancelReason.value = res.map((item) => item.codeName);
  });
}
function getCancelAmount() {
  request({
    url: "/app/hailing/order/cancel/amount",
    method: "POST",
    headers: {
      Authorization: route.query.token || localStorage.getItem("ZSX_WX_TOKEN"),
    },
    data: {
      logId: orderDetail.order.logId,
    },
  }).then((res) => {
    console.log(res);
  });
}
function cancelOrder(type) {
  if (type === "show") {
    showCancleDialog.value = true;
  }
  if (type === "confirm") {
    request({
      url: "/app/common/order/cancel",
      method: "POST",
      headers: {
        Authorization:
          route.query.token || localStorage.getItem("ZSX_WX_TOKEN"),
      },
      data: {
        orderNo: orderDetail.orderNo,
        businessType: orderDetail.businessType,
        cancelDesc: chooseReason.value,
        logId: orderDetail.order.logId,
      },
    }).then((res) => {
      console.log(res);
      if (res.logId) {
        showToast("取消成功");
        getOrderDetail(res.orderNo, res.logId);
      }
    });
  }
  if (type === "cancel") {
    showCancleDialog.value = false;
    chooseReason.value = "";
  }
}

function changeEndAddress() {
  wx.miniProgram.navigateTo({
    url: `/pages/commonChooseArea/index?type=changeEndAddress&orderNo=${orderDetail.orderNo}&logId=${orderDetail.order.logId}`,
  });
}

function orderAddPoint() {
  wx.miniProgram.navigateTo({
    url: `/pages/trajectory/addPoint?isOrderAddPoint=orderAddPoint&orderNo=${orderDetail.orderNo}&logId=${orderDetail.order.logId}`,
  });
}

function callDriver() {
  wx.miniProgram.navigateTo({
    url: `/pages/transfer/index?makePhoneCall=${
      orderDetail.order.driverPhone || "968845"
    }`,
  });
}

function callPolice() {
  request({
    url: "/app/hailing/passenger/alarm/oneTouch",
    method: "POST",
    headers: {
      Authorization: route.query.token || localStorage.getItem("ZSX_WX_TOKEN"),
    },
    data: {
      alarmTime: moment().format("YYYY-MM-DD HH:mm:ss"),
      // todo 获取当前经纬度
      latitude: orderDetail.order.startLatitude,
      lngtitude: orderDetail.order.startLngtitude,
      address: orderDetail.order.startAddress,
      orderNo: orderDetail.orderNo,
    },
  }).then((res) => {
    console.log(res);
    showToast("报警成功");
  });
}

// // 分享行程
const shareTrip = () => {
  // uni.showShareMenu({
  //   withShareTicket: true,
  //   menus: ["shareAppMessage", "shareTimeline"],
  // });
  // wx.miniProgram.postMessage({
  //   data: {
  //     url: `http://localhost:5173/?url=${encodeURIComponent(
  //       "#/orderDetail?logId=1871799246868889602&token=MTUxNzk4MTY4ODN8emgwMDAwMnwyMDI0LTEyLTI1IDE3OjI1OjA4"
  //     )}`,
  //     title: "分享行程",
  //   },
  // });
  wx.miniProgram.navigateTo({
    url: `/pages/order/share?orderNo=${orderDetail.orderNo}&logId=${orderDetail.order.logId}`,
  });
};

// // 联系客服
const contactService = () => {
  showDialog({
    title: "温馨提示",
    message: "是否拨打服务电话968845",
    confirmButtonText: "拨打电话",
    showCancelButton: true,
  })
    .then((res) => {
      wx.miniProgram.navigateTo({
        url: `/pages/transfer/index?makePhoneCall=968845`,
      });
    })
    .catch(() => {
      console.log("用户点击取消");
    });
};

const pingjia = (level) => {
  request({
    url: "/app/common/comment/add",
    method: "POST",
    headers: {
      Authorization: route.query.token || localStorage.getItem("ZSX_WX_TOKEN"),
    },
    data: {
      orderNo: orderDetail.orderNo,
      businessType: orderDetail.businessType,
      content: "",
      commentLevel: level,
    },
  }).then((res) => {
    console.log(res);
    showToast("评价成功");
  });
}

watch(
  () => route.params,
  () => {
    console.log("orderDetail watch", route.query);
    if (route.query.type === "changeEndAddress") {
      getOrderDetail(route.query.orderNo, route.query.logId);
    }
  },
  { deep: true, immediate: true }
);

onMounted(async () => {
  getOrderDetail(route.query.orderNo, route.query.logId);
  getCancelReason();
});

// ("1", "微信"),
// ("2", "支付宝"),
// ("5", "现金"),
// ("8", "单位结算"),
// ("11", "银联云闪付"),
// ("24","全民付-微信"),
// ("25","全民付-支付宝"),
// ("26","全民付-云闪付"),
const isShowPriceDetail = ref(false);
const showPayTypeDialog = ref(false);
const choosePayType = ref("1");
const payTypeList = [
  { name: "微信", value: "1" },
  { name: "现金支付", value: "5" },
  // { name: "支付宝", value: "2" },
  // { name: "银联云闪付", value: "11" },
  // { name: "全民付-微信", value: "24" },
  // { name: "全民付-支付宝", value: "25" },
  // { name: "全民付-云闪付", value: "26" },
];

function cancelPay(type) {
  if (type === "cancel") return (showPayTypeDialog.value = false);
  const order = orderDetail.order;
  wx.miniProgram.navigateTo({
    url: `/pages/pay/index?orderNo=${order.orderNo}&logId=${order.logId}&businessType=${
      order.businessType
    }&payAmount=${order.orderAmount}&subject=${encodeURIComponent(
      `${order.startAddress} - ${order.endAddress}出行费用`
    )}&payType=${choosePayType.value}&payAction=4`,
  });
}
</script>
<template>
  <div class="order-detail-wrap">
    <div
      class="map-container"
      style="min-height: 35vh"
      id="order-wrap"
      ref="mapContainer"
    ></div>
    <template v-if="orderDetail.orderNo">
      <div class="state-wrap">
        <div class="state-info-wrap">
          <div class="state-info">
            <div class="title">{{ showStateInfo.text }}</div>
            <div class="info">{{ showStateInfo.subtext }}</div>
          </div>
          <img src="@/assets/haixia.png" alt="" />
        </div>
        <div
          v-if="['5', '6'].includes(orderDetail.orderState)"
          class="c-card price-wrap"
        >
          <div>价格明细</div>
          <div class="item">
            <span>订单总额</span>
            <div>
              <span class="price">{{ orderDetail.order.orderAmount }}</span
              >元
            </div>
          </div>
          <div v-show="isShowPriceDetail">
            <div
              v-for="item in orderDetail.order.orderAmountList"
              :key="item.priceType"
              class="item"
            >
              <span>{{ item.priceName }}</span>
              <div>
                <span class="price">{{ item.amount }}</span
                >元
              </div>
            </div>
          </div>
          <div
            @click="isShowPriceDetail = !isShowPriceDetail"
            :class="['showprice-btn', { 'isshow-price': isShowPriceDetail }]"
          >
            {{ isShowPriceDetail ? "收起" : "展开" }}详情
          </div>
        </div>
        <div
          class="car-info-wrap"
          v-if="
            ['0', '2', '3', '4', '5', '6', '100'].includes(
              orderDetail.orderState
            )
          "
        >
          <div>
            <div
              class="car-type-info"
              v-if="orderDetail.order.vehicleModelLevel"
            >
              <span class="car-type">{{
                businessData[orderDetail.order.vehicleModelLevel]
              }}</span>
              <span class="car-type-name">{{
                orderDetail.order.vehicleType
              }}</span>
            </div>
            <div class="car-num">{{ orderDetail.order.plateNum }}</div>
            <div>
              <span class="car-name"
                >{{ orderDetail.order.vehicleModel }}
                <span v-if="orderDetail.order.vehicleColor"
                  >·
                  {{ orderDetail.order.vehicleColor }}
                </span>
              </span>
              <span class="car-dirver">
                {{ orderDetail.order.driverName }}</span
              >
            </div>
          </div>
          <div class="car-phone" @click="callDriver">
            <img src="@/assets/phoneCall.svg" alt="" />
            <span>打电话</span>
          </div>
        </div>
        <div class="paidan-wrap" v-if="orderDetail.orderState == '1'">
          <div>
            <div>正在同时呼叫{{ orderDetail.totalChooseCarTypeNum }}个车型</div>
            <!-- <div>经济型1</div> -->
          </div>
          <div class="div-btn" @click="cancelOrder('show')">取消订单</div>
        </div>
      </div>
      <div
        v-if="
          ['0', '2', '3', '4', '5', '6', '100'].includes(orderDetail.orderState)
        "
        class="order-btns"
      >
        <div
          v-if="!['4', '5', '6', '100'].includes(orderDetail.orderState)"
          class="action-btn"
          @click="cancelOrder('show')"
        >
          <img src="@/assets/close.svg" alt="" />
          <span>取消订单</span>
        </div>
        <div
          v-if="orderDetail.orderState == 4"
          class="action-btn"
          @click="orderAddPoint"
        >
          <img
            class="locationColorIcon"
            src="@/assets/locationColorIcon.png"
            alt=""
          />
          <span>+途径点</span>
        </div>
        <div
          v-if="orderDetail.orderState == 4"
          class="action-btn"
          @click="changeEndAddress"
        >
          <img
            class="locationColorIcon"
            src="@/assets/locationColorIcon.png"
            alt=""
          />
          <span>更改目的地</span>
        </div>
        <div class="action-btn" @click="callPolice">
          <img src="@/assets/110.png" alt="" />
          <span>110报警</span>
        </div>
        <div class="action-btn" @click="shareTrip">
          <img src="@/assets/share.png" alt="" />
          <span>分享行程</span>
        </div>
        <div class="action-btn" @click="contactService">
          <img src="@/assets/kefu.png" alt="" />
          <span>客服</span>
        </div>
      </div>

      <div v-if="orderDetail.orderState == 100" class="order-info">
        <div class="c-card">
          您对本次行程还满意吗？（匿名）
          <div class="order-btns">
            <div
              class="action-btn"
              @click="pingjia(0)"
            >
              <img src="@/assets/hzg.svg" alt="" />
              <span>很糟糕</span>
            </div>
            <div
              class="action-btn"
              @click="pingjia(1)"
            >
              <img src="@/assets/ybb.svg" alt="" />
              <span>一般般</span>
            </div>
            <div
              class="action-btn"
              @click="pingjia(2)"
            >
              <img src="@/assets/tbl.svg" alt="" />
              <span>太棒了</span>
            </div>
          </div>
        </div>
      </div>

      <div class="order-info">
        <!-- 出行信息 -->
        <div class="road-card">
          <div class="card-title">出行信息</div>
          <div class="info-item">
            <img src="@/assets/company.png" class="icon" />
            <span>
              {{
                orderDetail.order.carUseType === "firm"
                  ? "企业用车"
                  : "个人用车"
              }}
              {{
                orderDetail.order.orderType === "4"
                  ? "日租"
                  : orderDetail.order.orderType === "5"
                  ? "半日租"
                  : ""
              }}
            </span>
          </div>
          <div class="info-item from-area">
            <span>{{ orderDetail.order.startAddress }}</span>
          </div>
          <div class="info-item to-area">
            <span>{{ orderDetail.order.endAddress }}</span>
          </div>
          <div class="info-item time">
            <img src="@/assets/clock.png" class="icon" />
            <span v-if="orderDetail.orderTime"
              >{{ moment(orderDetail.orderTime).format("MM月DD日 HH:mm") }}
              {{ orderDetail.order.orderType === "2" ? "预约用车" : "" }}</span
            >
          </div>
        </div>

        <div class="info-card">
          <!-- 乘车人信息 -->
          <div class="info-card_item">
            <div class="card-title">乘车人信息</div>
            <div class="user-info">
              <span class="name">{{ orderDetail.order.passengerName }}</span>
              <span class="tag">乘车联系人</span>
            </div>
            <span class="phone"
              >手机号
              {{
                orderDetail.order.passengerPhone.slice(0, 3) +
                "****" +
                orderDetail.order.passengerPhone.slice(7)
              }}
            </span>
          </div>

          <!-- 同行人信息 -->
          <div
            class="info-card_item"
            v-if="
              orderDetail.order.companionInfos &&
              orderDetail.order.companionInfos.length
            "
          >
            <div class="card-title">同行人信息</div>
            <div
              v-for="item in orderDetail.order.companionInfos"
              :key="item.companionPhone"
            >
              <div class="user-info">
                <span class="name">{{ item.companionName }}</span>
              </div>
              <span class="phone"
                >手机号
                {{
                  item.companionPhone.slice(0, 3) +
                  "****" +
                  item.companionPhone.slice(7)
                }}</span
              >
            </div>
          </div>

          <!-- 用车信息 -->
          <div class="info-card_item" v-if="orderDetail.order.useCarReason">
            <div class="card-title">用车信息</div>
            <div class="info-item">
              <span class="label">用车事由</span>
              <span class="value">{{ orderDetail.order.useCarReason }}</span>
            </div>
          </div>
        </div>

        <!-- 订单信息 -->
        <div v-if="orderDetail.order.status != 1" class="c-card">
          <div class="card-title">订单信息</div>
          <div class="info-item">
            <span class="label">订单号</span>
            <span class="value">{{ orderDetail.orderNo }}</span>
          </div>
          <div class="info-item">
            <span class="label">下单时间</span>
            <span class="value">{{ orderDetail.orderTime }}</span>
          </div>
        </div>

        <!-- 取消规则 -->
        <div class="rules-card">
          <div class="rules-title">取消规则</div>
          <div class="rule-item">
            <span class="dot"></span>
            <span>企业用车审批单未通过，可以随时取消</span>
          </div>
          <div class="rule-item">
            <span class="dot"></span>
            <span>司机接单前可以免费取消</span>
          </div>
          <div class="rule-item">
            <span class="dot"></span>
            <span>司机接单后取消订单，您可能需要支付一定的违约金</span>
          </div>
          <div class="rule-item">
            <span class="dot"></span>
            <span>行程开始后不可取消订单</span>
          </div>
        </div>

        <!-- 用车规则 -->
        <div class="rules-card">
          <div class="rules-title">用车规则</div>
          <div class="rule-item">
            <span class="dot"></span>
            <span
              >同一司机联系人手机号，同时只能下一个立即用车行程和一个预约用车(包括预约用车/接送机/接送站)行程</span
            >
          </div>
        </div>
      </div>

      <div
        class="bottom-wrap"
        v-if="['101', '102'].includes(orderDetail.orderState)"
      >
        <div class="btn" @click="handleReOrder">重新寻车</div>
      </div>
      <div
        class="bottom-wrap"
        v-if="['5', '6'].includes(orderDetail.orderState)"
      >
        <div>
          总额<span class="price">{{ orderDetail.order.orderAmount }}</span
          >元
        </div>
        <div class="btn min-btn" @click="showPayTypeDialog = true">去支付</div>
        <!-- showPayTypeDialog = true cancelPay(true)-->
      </div>

      <van-dialog
        v-model:show="showCancleDialog"
        title="请选择取消原因"
        show-cancel-button
        @confirm="cancelOrder('confirm')"
        @cancel="cancelOrder('cancel')"
      >
        <div class="reason-wrap">
          <van-radio-group v-model="chooseReason">
            <van-radio
              v-for="item in cancelReason"
              :key="item"
              :name="item"
              class="cancel-reason"
              >{{ item }}</van-radio
            >
          </van-radio-group>
        </div>
      </van-dialog>

      <van-dialog
        v-model:show="showPayTypeDialog"
        title="请选择支付方式"
        show-cancel-button
        @confirm="cancelPay('confirm')"
        @cancel="cancelPay('cancel')"
      >
        <div class="reason-wrap">
          <van-radio-group v-model="choosePayType">
            <van-radio
              v-for="item in payTypeList"
              :key="item.value"
              :name="item.value"
              class="cancel-reason"
              >{{ item.name }}</van-radio
            >
          </van-radio-group>
        </div>
      </van-dialog>
    </template>
  </div>
</template>
<style scoped lang="scss">
.order-detail-wrap {
  height: 100vh;
  padding-bottom: 66px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: #f5f7fb;
}
.price-wrap {
  display: flex;
  flex-direction: column;
  .item {
    display: flex;
    justify-content: space-between;
  }
}
.price {
  font-size: 18px;
  font-weight: 700;
  padding: 0 2px;
}
.state-wrap {
  background-image: linear-gradient(
    180deg,
    #3475f5 0%,
    rgba(52, 117, 245, 0.01) 100%
  );
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  padding: 1rem 1rem 0;
  border-radius: 20px 20px 0 0;
  .state-info-wrap {
    padding-bottom: 1rem;
    img {
      width: 4.285rem;
      height: 2.571rem;
    }
    .state-info {
      color: #ffffff;
    }
    .title {
      font-weight: 700;
      font-size: 1.428rem;
      padding-bottom: 2px;
    }
    .info {
      font-size: 0.857rem;
    }
  }
  > div {
    display: flex;
    justify-content: space-between;
  }
}
.car-info-wrap {
  flex: 1;
  align-items: flex-start;
  padding: 1rem 1.428rem 0rem;
  border-radius: 12px 12px 0 0;
  background: #fff;
  font-size: 1rem;
  .car-type-info {
    border-radius: 6px;
    font-size: 0.857rem;
    background: #3475f5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1px;
    span {
      display: block;
      text-align: center;
      flex: 1;
      white-space: nowrap;
    }
    .car-type {
      color: #ffffff;
      border-radius: 4px;
      padding: 4px;
    }
    .car-type-name {
      color: #3475f5;
      font-size: 0.857rem;
      background-color: #ffffff;
      border-radius: 4px;
      padding: 4px;
    }
  }
  .car-num {
    font-size: 1.571rem;
    padding: 4px 0;
  }
  .car-phone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #1168e2;
    font-size: 0.857rem;
    img {
      background-color: #1168e2;
      border-radius: 50%;
      padding: 0.4rem;
      width: 2.6rem;
      height: 2.6rem;
    }
  }
}
.paidan-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.428rem;
  border-radius: 12px;
  background-color: #ffffff;
  .div-btn {
    padding: 6px 8px;
    border-radius: 6px;
    background-color: #ffffff;
    border: 1px solid #f5f7fa;
  }
}
.order-btns {
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.428rem;
  border-radius: 0 0 12px 12px;
  margin: 0 1rem 0rem;
  background: #fff;
  gap: 8px;

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 12px;
    color: #666;

    img {
      width: 24px;
      height: 24px;
      margin-bottom: 4px;
    }
    .locationColorIcon {
      width: 20px;
    }
  }
}

.order-info {
  padding: 0 1rem;
  margin-top: 1rem;
  img {
    width: 1.142rem;
    height: 1.142rem;
    margin-right: 4px;
  }
}
.c-card {
  background: #fff;
  padding: 1.428rem;
  margin-bottom: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.road-card,
.info-card,
.rules-card {
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 12px;
}

.road-card {
  background: #fff;
}

.info-card {
  background: #fff;
  border-radius: 12px;
  padding: 0 1rem;
  &_item {
    padding: 1.428rem 0;
    border-bottom: 1px solid #f5f7fa;
  }
}

.card-title {
  font-size: 1.142rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.rules-title {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 1rem;
  color: #41485d;
}
.from-area,
.to-area {
  padding: 0 !important;
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

.info-item.time {
  color: #858b9c;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.user-info .name {
  font-size: 1.142rem;
  margin-right: 1.428rem;
}

.user-info .tag {
  font-size: 0.857rem;
  color: #1168e2;
  background: rgba(25, 137, 250, 0.1);
  padding: 4px 12px;
  border-radius: 4px;
}

.phone {
  font-size: 1rem;
  color: #858b9c;
}

.info-item .label {
  color: #858b9c;
  margin-right: 1.428rem;
}

.rule-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 8px;
  font-size: 0.857rem;
  color: #858b9c;
  line-height: 1.5;
}

.rule-item .dot {
  width: 6px;
  height: 6px;
  background: #858b9c;
  border-radius: 50%;
  flex-shrink: 0;
  margin-right: 6px;
}

.cancel-reason {
  padding: 12px 24px;
}

.reason-wrap {
  max-height: 50vh;
  overflow-y: auto;
}

.bottom-wrap {
  padding-left: 16px;
  .price {
    padding: 0 4px;
  }
}

.showprice-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  padding-top: 10px;
  &::after {
    content: "";
    margin-left: 10px;
    width: 4px;
    height: 4px;
    border: 1px solid #000000;
    border-top: none;
    border-right: none;
    transform: rotate(-45deg);
  }
}

.isshow-price {
  &::after {
    transform: rotate(135deg);
  }
}
</style>
