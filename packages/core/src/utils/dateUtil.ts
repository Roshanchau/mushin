export const logTimeStamp = (date: Date = new Date()): string => {
    const d = date;
    const pad = (n: number, size: number = 2) => String(n).padStart(size, "0");

    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const millis = pad(d.getMilliseconds(), 3);

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}:${millis}`;
  }