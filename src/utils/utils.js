import moment from "moment";

export function generateDateArray() {
  const today = new Date();
  const monthNames = [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ];
  const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const dateArray = [];

  for (let i = 0; i < 29; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);

    const month = monthNames[currentDate.getMonth()];
    const day = currentDate.getDate();
    const dayOfWeek = dayNames[currentDate.getDay()];

    const formattedDate = `${month}${day}日${dayOfWeek}`;
    dateArray.push({
      text: formattedDate,
      value: moment(currentDate).format("YYYY/MM/DD"),
    });
  }

  dateArray.unshift({
    text: "今天",
    value: moment(today).format("YYYY/MM/DD"),
  });

  const hourArray = [];
  for (let i = 0; i < 24; i++) {
    hourArray.push({
      text: i.toString().padStart(2, "0"),
      value: i.toString().padStart(2, "0"),
    });
  }

  const minuteArray = [];
  for (let i = 0; i < 60; i++) {
    minuteArray.push({
      text: i.toString().padStart(2, "0"),
      value: i.toString().padStart(2, "0"),
    });
  }
  return { dateArray, hourArray, minuteArray };
}
