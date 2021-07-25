const sleep = function (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

class DummyJob {
  constructor() {}

  async shutdown() {
    for (let i = 0; i < 5; i++) {
      if (i === 3) {
        await sleep(6000);
      }
      console.log(`Completing task #${i}`);
    }
  }
}

module.exports = DummyJob;
