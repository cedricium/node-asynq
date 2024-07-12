declare global {
  var __REDIS__: {
    host: string;
    port: number;
    db: number;
  };
}

import { Redis } from "ioredis";
import { Broker } from "../src/broker";

describe("Enqueue", () => {
  const broker = new Broker(new Redis({ ...global.__REDIS__ }));

  afterEach(() => broker["redis"].flushdb());
  afterAll(() => broker["redis"].quit());

  test.todo("enqueue");
});

describe("Schedule", () => {
  const broker = new Broker(new Redis({ ...global.__REDIS__ }));

  afterEach(() => broker["redis"].flushdb());
  afterAll(() => broker["redis"].quit());

  test.todo("schedule");
});
