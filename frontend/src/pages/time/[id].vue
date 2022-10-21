<script lang="ts" setup>
import { main } from "../../../wailsjs/go/models";

const { id } = defineProps<{ id: string }>();

let list = $ref<main.TimeItem[]>();

async function getList() {
    list = await SelectAllTimeItem(Number(id))
}

getList()

let isStart = $ref(false);
let isPause = $ref(false);

let base = 0,
  now = 0,
  sum = 0,
  collection: number[] = [];
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
  collection.push(base, now);
  sum += now - base;
}

function resume() {
  isPause = false;
  start();
}

async function finish() {
  if (!isPause) {
    collection.push(base, now);
  }
  isStart = false;
  isPause = false;
  cancelAnimationFrame(frame);
  await InsertTimeItem(Number(id), collection);
  base = now = sum = 0;
  collection = [];
  clock = format(0);
  await getList()
}

function complement(num: number) {
  return num < 10 ? `0${num}` : num;
}

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

<template>
  <calendar-graph :list="list" />
  <div>{{ clock }}</div>
  <button v-show="!isStart" @click="start" btn bg-green>{{$t('start')}}</button>
  <button
    v-show="isStart"
    @click="isPause ? resume() : pause()"
    btn
    :class="isPause ? 'bg-orange' : 'bg-gray'"
  >
    {{ isPause ? $t('resume') : $t('pause') }}
  </button>
  <button v-show="isStart" btn bg-red @click="finish">{{$t('finish')}}</button>
</template>
