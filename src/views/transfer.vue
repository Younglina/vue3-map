<script setup>
import { useRoute } from "vue-router";
const route = useRoute();
const page = route.query.page;
let url = "";
let data = "";
if (page === "ZSX_ORDER_CONFIRM") {
  url = "/pages/chooseArea/orderConfirm";
  data = JSON.parse(
    localStorage.getItem("ZSX_ORDER_CONFIRM") || "{_NODATA: true}"
  );
  data._ZSX_PAGE_KEY = "ZSX_ORDER_CONFIRM";
}
if (url) {
  wx.miniProgram.redirectTo({ url: url });
  wx.miniProgram.postMessage({
    data,
  });
  if (data && data._NODATA !== true) {
    localStorage.removeItem(page);
  }
}
</script>
<template>
  <view>加载中</view>
</template>
<style scoped lang="scss"></style>
