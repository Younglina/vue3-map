<script setup>
import { ref, onMounted, computed, reactive } from "vue";
import { ORDER_STATUS } from "../utils/constant";
import moment from "moment";
import { useRoute, useRouter } from "vue-router";
import request from "@/utils/request";
import AMap from "@/components/AMap.vue";
import { showToast } from "vant";
import towgs84 from "@/utils/towgs84";

let map = null;
const mapLoaded = (m) => {
  map = m;
};

const orderDetail = reactive({});
function getOrderDetail(logId, orderNo) {
  let interval = setInterval(() => {
    request({
      url: "/app/common/order/get",
      method: "POST",
      headers: {
        Authorization: route.query.token,
      },
      data: {
        logId,
        orderNo,
      },
    }).then((res) => {
      // const res = {
      //   orderNo: "2024122800010520000044",
      //   passengerId: "1872173744031252481",
      //   orderTime: "2024-12-28 07:52:28",
      //   orderState: "4",
      //   orderStateStr: "待派车",
      //   orderSource: null,
      //   orderAmount: null,
      //   businessType: "5",
      //   arrangedTips: null,
      //   order: {
      //     logId: "1872913492504035329",
      //     passengerId: "1872173744031252481",
      //     orderPersonPhone: "15179816883",
      //     orderPersonDeptName: null,
      //     orderPersonOrgName: null,
      //     orderPersonName: "6883",
      //     passengerPhone: "15166666666",
      //     passengerName: "wzq",
      //     orderTime: "2024-12-28 07:52:28",
      //     orderState: "1",
      //     useCarTime: "2024-12-28 15:52:24",
      //     useCarReason: "",
      //     orderType: "2",
      //     onlinePay: null,
      //     rentDuration: "12",
      //     dispatchType: "2",
      //     placeOrderType: "2",
      //     startLngtitude: 120.211784,
      //     startLatitude: 30.208879,
      //     startAddress: "高新区(滨江)公安分局",
      //     startAddressFull: "",
      //     endLngtitude: 120.223401,
      //     endLatitude: 30.220748,
      //     endAddress: "印月尚庭(西北门)",
      //     endAddressFull: "丹枫路86号印月尚庭",
      //     approvalNo: "",
      //     togetherOrder: "0",
      //     orderNo: "2024122800010520000044",
      //     remark: null,
      //     businessType: "5",
      //     chooseBusinessType: "5",
      //     businessId: null,
      //     cancelType: null,
      //     cancelDesc: null,
      //     cancelTime: null,
      //     createUserId: "1872173747813265410",
      //     orgId: "1",
      //     orgName: null,
      //     orderSource: "2",
      //     dispatchSource: "5",
      //     driverId: null,
      //     vehicleId: null,
      //     togetherList: null,
      //     midwayPoint: null,
      //     channelId: null,
      //     vehicleModelLevel: null,
      //     partnerOrderId: null,
      //     partnerCarTypeId: null,
      //     partnerEstimateId: null,
      //     partnerEstimateAmount: null,
      //   },
      // };
      console.log(res);
      [res.order.startLatitude, res.order.startLngtitude] =
        towgs84.transformWGS2GCJ(
          res.order.startLatitude,
          res.order.startLngtitude
        );
      [res.order.endLatitude, res.order.endLngtitude] =
        towgs84.transformWGS2GCJ(res.order.endLatitude, res.order.endLngtitude);
      Object.assign(orderDetail, res);
      if (
        orderDetail.orderNo &&
        ["100", "101", "102"].includes(orderDetail.orderState)
      ) {
        clearInterval(interval);
        interval = null;
      }
    });
  }, 3000);
}

const router = useRouter();
function handleReOrder() {
  const orderData = JSON.parse(JSON.stringify(orderDetail.order));
  if (orderData.orderState === "101") {
    orderData.overTimeOrder = "1";
    orderData.overTimeApprovalNo = orderData.approvalNo;
  }
  const fromwgs84 = towgs84.transformGCJ2WGS(
    orderData.startLatitude,
    orderData.startLngtitude
  );
  const endwgs84 = towgs84.transformGCJ2WGS(
    orderData.endLatitude,
    orderData.endLngtitude
  );
  orderData.startLngtitude = fromwgs84[1];
  orderData.startLatitude = fromwgs84[0];
  orderData.endLngtitude = endwgs84[1];
  orderData.endLatitude = endwgs84[0];
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
  //       getOrderDetail(res.logId);
  //     })
  //     .catch((err) => {
  //       showToast(err.data.userTip);
  //     });
  // } else {
  request({
    url: "/app/common/order/add",
    method: "POST",
    headers: {
      Authorization: route.query.token,
    },
    data: {
      ...orderData,
    },
  }).then((res) => {
    router.replace({
      path: "/orderDetail",
      query: {
        logId: res.logId,
      },
    });
    getOrderDetail(res.logId, res.orderNo);
  });
  // }
}

const showStateInfo = computed(() => {
  const s = ORDER_STATUS[orderDetail.orderState];
  if (s) {
    return {
      text: s.text,
      subtext: orderDetail.order.cancelDesc || s.subtext("曹操出行"),
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
      Authorization: route.query.token,
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
      Authorization: route.query.token,
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
        Authorization: route.query.token,
      },
      data: {
        orderNo: orderDetail.orderNo,
        businessType: orderDetail.businessType,
        cancelDesc: chooseReason.value,
        logId: orderDetail.order.logId,
      },
    }).then((res) => {
      if (res.logId) {
        showToast("取消成功");
        getOrderDetail(res.logId);
      }
    });
  }
  if (type === "cancel") {
    showCancleDialog.value = false;
    chooseReason.value = "";
  }
}

function callPolice() {
  request({
    url: "/app/hailing/passenger/alarm/oneTouch",
    method: "POST",
    headers: {
      Authorization: route.query.token,
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
    url: `/pages/order/share`,
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

const route = useRoute();
onMounted(() => {
  getOrderDetail(route.query.logId, route.query.orderNo);
  // axios("/api/signature?url=" + encodeURIComponent(window.location.href));
  // const appdsata = {
  //   appId: "wxc6f5cb56394f1ae0",
  //   nonceStr: "YWW5ZIXLWlvYno4I",
  //   timestamp: 1735182029,
  //   signature: "67920b72be7d7496544c755bebacb2c4c037fcdc",
  //   url: "http://localhost:5173/#/orderDetail?logId=1871799246868889602&token=MTUxNzk4MTY4ODN8emgwMDAwMnwyMDI0LTEyLTI1IDE3OjI1OjA4",
  // };
  getCancelReason();
  // request({
  //   url: "/app/hailing/order/path/planning/info",
  //   method: "POST",
  //   headers: {
  //     Authorization: route.query.token,
  //   },
  //   data: {
  //     phone: "15179816883",
  //     orderNo: route.query.orderNo,
  //   },
  // }).then((res) => {
  //   console.log(res);
  // });
  // request({
  //   url: "/app/common/order/underway",
  //   method: "POST",
  //   headers: {
  //     Authorization: route.query.token,
  //   },
  //   data: {
  //     phone: "15179816883",
  //   },
  // }).then((res) => {
  // console.log(res);
  //   });
});
</script>
<template>
  <div v-if="orderDetail.orderNo" class="order-detail-wrap">
    <a-map
      style="min-height: 35vh"
      @loaded="mapLoaded"
      :showCenterMarker="false"
      :showLocationIcon="false"
      :center="{
        longitude: orderDetail.order.startLngtitude,
        latitude: orderDetail.order.startLatitude,
      }"
    ></a-map>

    <div class="state-wrap">
      <div class="state-info-wrap">
        <div class="state-info">
          <div class="title">{{ showStateInfo.text }}</div>
          <div class="info">{{ showStateInfo.subtext }}</div>
        </div>
        <img src="@/assets/haixia.png" alt="" />
      </div>
      <div
        class="car-info-wrap"
        v-if="
          ['0', '2', '3', '4', '5', '6', '100'].includes(orderDetail.orderState)
        "
      >
        <div>
          <div class="car-type-info">
            <span class="car-type">经济型</span>
            <span class="car-type-name">曹操出行</span>
          </div>
          <div class="car-num">赣BU13EI</div>
          <div>
            <span class="car-name">凯迪拉克·白</span>
            <span class="car-dirver">周师傅</span>
          </div>
        </div>
        <div class="car-phone">
          <img src="@/assets/phoneCall.svg" alt="" />
          <span>打电话</span>
        </div>
      </div>
      <div class="paidan-wrap" v-if="orderDetail.orderState == '1'">
        <div>
          <div>正在同时呼叫{{ orderDetail.totalChooseCarTypeNum }}个车型</div>
          <div>经济型1</div>
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
      <div class="action-btn" @click="cancelOrder('show')">
        <img src="@/assets/close.svg" alt="" />
        <span>取消订单</span>
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

    <div class="order-info">
      <!-- 出行信息 -->
      <div class="road-card">
        <div class="card-title">出行信息</div>
        <div class="info-item">
          <img src="@/assets/company.png" class="icon" />
          <span>
            {{
              orderDetail.order.carUseType === "firm" ? "企业用车" : "个人用车"
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
          <span v-if="orderDetail.order.useCarTime"
            >{{
              moment(orderDetail.order.useCarTime).format("MM月DD日 HH:mm")
            }}
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
</style>
