<script setup></script>
<template>
  <div class="empty-wrap">
    <img src="@/assets/empty.png" alt="" />
    <p class="empty-text">这里空空的，什么都没有...</p>
  </div>
</template>
<style scoped lang="scss">
.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 20px 0;
  img {
    width: 9.86rem;
    height: 11.43rem;
  }
  .empty-text {
    margin-top: 20px;
    color: #666f83;
    font-size: 14px;
    text-align: center;
  }
}
</style>
