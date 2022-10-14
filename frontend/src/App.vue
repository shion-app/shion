<script lang="ts" setup>
let isStart = $ref(false);
let isPause = $ref(false);

let base = 0,
  now = 0,
  sum = 0;
let clock = $ref(format(0));

let frame: number;

function start() {
  isStart = true;
  base = Date.now();
  count();
}

function pause() {
  isPause = true;
  cancelAnimationFrame(frame);
  sum += now - base;
}

function resume() {
  isPause = false;
  start();
}

function finish() {
  isStart = false;
  isPause = false;
  cancelAnimationFrame(frame);
  base = now = sum = 0;
  clock = format(0);
}

function complement(num: number) {
  return (num < 10 ? `0${num}` : num)
};

function format(time: number) {
  const milli = complement(~~((time % 1000) / 10));
  time = ~~(time / 1000);
  const second = complement(time % 60);
  time = ~~(time / 60);
  const minute = complement(time % 60);
  const hour = ~~(time / 60);
  const result = `${minute}:${second}.${milli}`;
  return hour ? `${complement(hour)}:${result}` : result;
}

function count() {
  frame = requestAnimationFrame(() => {
    now = Date.now();
    clock = format(now - base + sum);
    count();
  });
}
</script>

<!-- <template>
  <div>{{ clock }}</div>
  <button v-show="!isStart" @click="start" btn bg-green>开始</button>
  <button
    v-show="isStart"
    @click="isPause ? resume() : pause()"
    btn
    :class="isPause ? 'bg-orange' : 'bg-gray'"
  >
    {{ isPause ? "继续" : "暂停" }}
  </button>
  <button v-show="isStart" btn bg-red @click="finish">结束</button>
</template> -->

<template>
  <RouterView />
</template>

<style></style>
