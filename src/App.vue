<template>
  <router-view></router-view>
</template>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  width: 100%;
  font-size: 14px;
}

#app {
  height: 100%;
}

.bottom-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  padding: 10px;
  box-sizing: border-box;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 56px;
  background-color: #ffffff;
  box-shadow: 5px -5px 10px #e8e8e8, -5px 5px 10px #ffffff;

  .btn {
    display: flex;
    position: relative;
    flex: 1;
    align-items: center;
    justify-content: center;
    height: 100%;
    background-color: #003f93;
    border-radius: 10px;
    color: #ffffff;
    margin: 0 10px;
  }

  .min-btn{
    flex: unset;
    padding: 0 20px;
  }
}
</style>

<script setup>
import { Client } from "@stomp/stompjs";
import { onMounted } from "vue";

const webSocketURL = `ws://117.29.161.242:31232/api-tanji/foundation/ws-stomp?access_token=MTUxNzk4MTY4ODN8MXwyMDI0LTEyLTI2IDE0OjUyOjU5&tenant_id=1`;
onMounted(() => {
  const client = new Client({
    brokerURL: webSocketURL,
    connectHeaders: { "X-maas-TenantId": "1" },
    onConnect: (e) => {
      console.log(e);
      client.subscribe(
        "/queue/hailing/applet/push/travel.applet.hailing.message15179816883",
        (message) =>
          console.log(`Received: ${message.body}`, {
            "Custom-Subscribe-Topic": "travel.applet.hailing.message",
            id: "travel.applet.hailing.message15179816883",
          })
      );
    },
  });

  client.activate();
});
</script>
