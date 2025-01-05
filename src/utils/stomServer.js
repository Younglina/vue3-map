// 在您的Vue 3项目中创建一个名为 StompService.js 的文件
import { Client } from "@stomp/stompjs";

export default class StompService {
  static client = null;

  static initStompClient(webSocketURL, connectHeaders) {
    if (this.client) {
      return;
    }

    this.client = new Client({
      brokerURL: webSocketURL,
      connectHeaders,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log("Connected: " + frame);
      // 这里可以调用订阅方法
      this.subscribeMessages();
    };

    this.client.onStompError = (frame) => {
      console.error("Broker reported error: " + frame.headers["message"]);
      console.error("Additional details: " + frame.body);
    };
  }

  static subscribeMessages() {
    const destination =
      "/queue/hailing/applet/push/travel.applet.hailing.message18912341234";
    const headers = {
      "Custom-Subscribe-Topic": "travel.applet.hailing.message",
      id: "travel.applet.hailing.message18912341234",
    };

    this.client.subscribe(
      destination,
      (message) => {
        if (message.body) {
          this.parseMessage(message.body);
        }
      },
      headers
    );
  }

  static parseMessage(body) {
    try {
      const data = JSON.parse(body);
      console.log("Order No:", data.orderNo);
      console.log("Order State:", data.orderState);
      console.log("Business Type:", data.businessType);
      console.log("Arrive Time (seconds):", data.arriveTime);
      console.log("Arrive Mileage (meters):", data.arriveMileage);
      console.log("Latitude:", data.latitude);
      console.log("Longitude:", data.longitude);
      console.log("Direction:", data.direction);
      console.log("Speed (km/h):", data.speed);
      console.log("Path:", data.path);

      // 可以在这里更新Vue组件的状态或执行其他操作
    } catch (e) {
      console.error("Failed to parse message body:", e);
    }
  }

  static connect() {
    if (!this.client) {
      console.error("STOMP client is not initialized.");
      return;
    }

    this.client.activate();
  }

  static disconnect() {
    if (this.client) {
      this.client.deactivate();
    }
  }
}
