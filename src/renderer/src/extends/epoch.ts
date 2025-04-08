declare global {
  var SNOWFLAKE_EPOCH: Date;
  interface Window { SNOWFLAKE_EPOCH: Date; }
}

window.SNOWFLAKE_EPOCH = new Date("2024-11-01T06:00:00+01:00")

export {}