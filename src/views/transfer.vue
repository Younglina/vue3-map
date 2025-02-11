<script setup>
import { useRoute } from "vue-router";
import {  showLoadingToast } from "vant";
const route = useRoute();
const page = route.query.page;
let url = "";
let data = "";
showLoadingToast();
switch (page) {
  case "ZSX_ORDER_CONFIRM":
    url = "/pages/order/confirm";
    data = JSON.parse(
      localStorage.getItem("ZSX_ORDER_CONFIRM") || '{"_NODATA": true}'
    );
    data._ZSX_PAGE_KEY = "ZSX_ORDER_CONFIRM";
    break;
  case "ZSX_PRICEINFO":
    url = "/pages/trajectory/priceInfo";
    data = JSON.parse(
      localStorage.getItem("ZSX_PRICEINFO") || '{"_NODATA": true}'
    );
    data._ZSX_PAGE_KEY = "ZSX_PRICEINFO";
    break;
}
if (url) {
  wx.miniProgram.redirectTo({ url: url });
  wx.miniProgram.postMessage({
    data,
  });
  if (data && data._NODATA !== true && page !== "ZSX_ORDER_CONFIRM") {
    localStorage.removeItem(page);
  }
}
</script>
<template>
  <div></div>
</template>
<style scoped lang="scss"></style>
